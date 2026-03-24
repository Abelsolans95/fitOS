import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import * as XLSX from "xlsx";

/** Column detected by AI analysis */
interface DetectedColumn {
  index: number;
  header: string;
  type: string;
  confidence: number;
  series_number?: number | null;
}

/** Section detected by AI analysis */
interface DetectedSection {
  start_row: number;
  day_label: string;
  date?: string;
}

/** AI analysis result from Haiku */
interface AIAnalysis {
  header_row: number;
  data_start_row: number;
  columns: DetectedColumn[];
  sections: DetectedSection[];
  structure_notes: string;
}

/** Sheet result after processing */
interface SheetResult {
  name: string;
  columns: (DetectedColumn & { sample_values: (string | number | null)[] })[];
  rows: Record<string, string | number | null>[];
  row_count: number;
  ai_analysis: AIAnalysis;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verify trainer role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "trainer") {
    return NextResponse.json({ error: "Solo entrenadores" }, { status: 403 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No se recibió archivo" },
      { status: 400 }
    );
  }

  // Validate file type
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];
  if (
    !validTypes.includes(file.type) &&
    !file.name.match(/\.(xlsx|xls|csv)$/i)
  ) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa .xlsx, .xls o .csv" },
      { status: 400 }
    );
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Archivo demasiado grande (máx. 5MB)" },
      { status: 400 }
    );
  }

  // Parse Excel with SheetJS
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  if (workbook.SheetNames.length === 0) {
    return NextResponse.json(
      { error: "El archivo está vacío" },
      { status: 400 }
    );
  }

  // Process ALL sheets
  const sheetsResult: SheetResult[] = [];

  try {
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(
        worksheet,
        { header: 1, defval: null }
      );

      if (rawRows.length === 0) continue;

      // Send first 40 rows to Haiku for intelligent analysis
      const sampleRows = rawRows.slice(0, 40);

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `Analiza estas filas de una hoja de Excel de entrenamiento personal llamada "${sheetName}". El Excel puede tener headers en cualquier fila (no necesariamente la primera), celdas combinadas, secciones separadas por fechas, etc.

Necesito que identifiques:
1. En qué fila están los headers reales (la fila con EJERCICIO, REPS, etc.)
2. Qué representa cada columna
3. Qué filas contienen datos de ejercicios vs headers/separadores

Las filas del Excel (índice 0 = primera fila):
${JSON.stringify(sampleRows, null, 2)}

Responde SOLO con JSON válido, sin markdown ni explicaciones. Usa esta estructura exacta:
{
  "header_row": <número de fila donde están los headers reales, 0-indexed>,
  "data_start_row": <primera fila con datos de ejercicios, 0-indexed>,
  "columns": [
    {
      "index": <índice de columna, 0-indexed>,
      "header": "<nombre real del header detectado>",
      "type": "<uno de: exercise_name, exercise_category, scheme, weight_kg, reps, rir, rpe, rest_seconds, day_label, notes, coach_notes, video_url, date, series_weight, series_reps, previous_data, unknown>",
      "confidence": <0.0 a 1.0>,
      "series_number": <número de serie si es series_weight o series_reps, null si no aplica>
    }
  ],
  "sections": [
    {
      "start_row": <fila inicio>,
      "day_label": "<nombre del día/grupo, ej: PIERNA, TORSO, FULLBODY>",
      "date": "<fecha si existe, ej: 08/05/25>"
    }
  ],
  "structure_notes": "<breve descripción de la estructura detectada>"
}

IMPORTANTE:
- Si ves columnas C y R bajo "SERIE 1", "SERIE 2", etc., son series_weight y series_reps respectivamente con su series_number
- Si ves "RP" o "3x6-8" en una columna, es "scheme" (esquema de series×reps)
- Si ves "fullbody", "fullbody 2", etc., es day_label
- Las columnas con valores como "3,2,2" son rir (RIR por serie separado por comas)
- "ACTUAL" es previous_data (datos de sesiones anteriores)
- Si hay una columna con valores como "pecho", "espalda", "pierna", "bíceps", "fullbody" es exercise_category`,
          },
        ],
      });

      const firstBlock = message.content[0];
      if (!firstBlock || firstBlock.type !== "text" || !firstBlock.text) {
        // AI returned no text content — skip sheet
        continue;
      }
      const aiText = firstBlock.text;

      let analysis: AIAnalysis;
      try {
        const cleaned = aiText.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleaned) as AIAnalysis;
        // Validate required fields
        if (!Array.isArray(parsed.columns) || typeof parsed.data_start_row !== "number") {
          continue;
        }
        analysis = parsed;
      } catch {
        // If AI fails on this sheet, skip it with a warning
        continue;
      }

      // Build detected columns
      const detectedColumns = (analysis.columns || []).map(
        (col: DetectedColumn) => ({
          index: col.index,
          header: col.header,
          inferred_type: col.type,
          confidence: col.confidence,
          series_number: col.series_number || null,
          sample_values: sampleRows
            .slice(
              analysis.data_start_row || 0,
              (analysis.data_start_row || 0) + 5
            )
            .map((row: (string | number | null)[]) =>
              col.index < row.length ? row[col.index] : null
            ),
        })
      );

      // Extract data rows
      const dataStartRow = analysis.data_start_row || 0;
      const allDataRows = rawRows.slice(dataStartRow);

      const rows = allDataRows.map((row: (string | number | null)[]) => {
        const obj: Record<string, string | number | null> = {};
        for (const col of (analysis.columns || []) as DetectedColumn[]) {
          const key = col.header || `col_${col.index}`;
          obj[key] =
            col.index < row.length
              ? (row[col.index] as string | number | null)
              : null;
        }
        return obj;
      });

      sheetsResult.push({
        name: sheetName,
        columns: detectedColumns,
        rows,
        row_count: allDataRows.length,
        ai_analysis: analysis,
      });
    }

    if (sheetsResult.length === 0) {
      return NextResponse.json(
        { error: "No se pudo analizar ninguna hoja del Excel" },
        { status: 400 }
      );
    }

    // Save first sheet to excel_imports for audit trail
    const { data: importRecord, error: insertError } = await supabase
      .from("excel_imports")
      .insert({
        trainer_id: user.id,
        file_name: file.name,
        file_size_bytes: file.size,
        sheet_count: sheetsResult.length,
        detected_columns: sheetsResult[0].columns,
        row_data: sheetsResult[0].rows,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Error guardando importación: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      import_id: importRecord.id,
      file_name: file.name,
      needs_review: sheetsResult.some((s) =>
        s.columns.some((c) => c.confidence < 0.9)
      ),
      sheets: sheetsResult.map(({ ai_analysis, ...rest }) => rest),
      ai_analysis: sheetsResult.map((s) => ({
        sheet: s.name,
        ...s.ai_analysis,
      })),
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al analizar con IA: " + errorMessage },
      { status: 500 }
    );
  }
}
