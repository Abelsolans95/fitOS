/**
 * Agnostic Excel parser with semantic column inference.
 *
 * Analyzes column content to infer what each column represents:
 * - Strings → exercise_name, day_label, notes
 * - Integers → sets, reps
 * - Decimals → weight_kg, rest_seconds
 * - Patterns → RIR (0-4), RPE (6-10)
 *
 * Confidence < 90% triggers the uncertainty protocol:
 * the trainer is asked to confirm/correct the mapping.
 */

import * as XLSX from "xlsx";

export type InferredColumnType =
  | "exercise_name"
  | "sets"
  | "reps"
  | "weight_kg"
  | "rir"
  | "rpe"
  | "rest_seconds"
  | "day_label"
  | "week_number"
  | "notes"
  | "scheme"
  | "coach_notes"
  | "video_url"
  | "date"
  | "series_weight"
  | "series_reps"
  | "previous_data"
  | "exercise_category"
  | "unknown";

export interface DetectedColumn {
  index: number;
  header: string | null;
  inferred_type: InferredColumnType;
  confidence: number; // 0-1
  sample_values: (string | number | null)[];
  reasoning: string;
}

export interface ParsedSheet {
  name: string;
  columns: DetectedColumn[];
  rows: Record<string, any>[];
  row_count: number;
}

export interface ParseResult {
  file_name: string;
  sheets: ParsedSheet[];
  needs_review: boolean; // true if any column confidence < 0.9
}

// ── Header keyword maps ──

const HEADER_KEYWORDS: Record<InferredColumnType, RegExp[]> = {
  exercise_name: [
    /ejercicio/i, /exercise/i, /nombre/i, /name/i, /movimiento/i,
  ],
  sets: [/series/i, /sets/i, /set/i],
  reps: [/rep(eticion)?e?s?/i, /reps/i],
  weight_kg: [/peso/i, /weight/i, /kg/i, /carga/i, /load/i],
  rir: [/rir/i, /reserv/i],
  rpe: [/rpe/i, /esfuerzo/i, /exertion/i],
  rest_seconds: [/descanso/i, /rest/i, /pausa/i, /seg/i],
  day_label: [/d[ií]a/i, /day/i, /sesi[oó]n/i, /session/i],
  week_number: [/semana/i, /week/i, /bloque/i],
  notes: [/nota/i, /note/i, /observ/i, /comment/i],
  scheme: [/esquema/i, /scheme/i, /formato/i],
  coach_notes: [/coach/i, /entrenador/i, /trainer/i],
  video_url: [/v[ií]deo/i, /video/i, /url/i, /link/i],
  date: [/fecha/i, /date/i],
  series_weight: [/carga\s*\d/i, /peso\s*serie/i],
  series_reps: [/reps?\s*serie/i],
  previous_data: [/actual/i, /anterior/i, /prev/i, /histor/i],
  exercise_category: [/categor/i, /grupo/i, /muscle/i, /m[uú]sculo/i],
  unknown: [],
};

// ── Content analysis helpers ──

function isInteger(values: (string | number | null)[]): boolean {
  const nums = values.filter((v) => v !== null && v !== "");
  if (nums.length === 0) return false;
  return nums.every((v) => {
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return !isNaN(n) && Number.isInteger(n) && n >= 0;
  });
}

function isDecimal(values: (string | number | null)[]): boolean {
  const nums = values.filter((v) => v !== null && v !== "");
  if (nums.length === 0) return false;
  return nums.some((v) => {
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return !isNaN(n) && !Number.isInteger(n);
  });
}

function isText(values: (string | number | null)[]): boolean {
  const nonEmpty = values.filter((v) => v !== null && v !== "");
  if (nonEmpty.length === 0) return false;
  return nonEmpty.every((v) => {
    const s = String(v);
    return isNaN(parseFloat(s)) || s.length > 10;
  });
}

function getNumericRange(
  values: (string | number | null)[]
): { min: number; max: number; avg: number } | null {
  const nums = values
    .map((v) => (typeof v === "number" ? v : parseFloat(String(v))))
    .filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  return {
    min: Math.min(...nums),
    max: Math.max(...nums),
    avg: nums.reduce((a, b) => a + b, 0) / nums.length,
  };
}

function hasRepetitionPattern(values: (string | number | null)[]): boolean {
  // Check for "8-10", "6-8" style ranges
  return values.some((v) => /^\d{1,2}\s*[-–]\s*\d{1,2}$/.test(String(v)));
}

// ── Core inference ──

function inferColumnType(
  header: string | null,
  values: (string | number | null)[]
): { type: InferredColumnType; confidence: number; reasoning: string } {
  const candidates: {
    type: InferredColumnType;
    score: number;
    reasoning: string;
  }[] = [];

  // 1. Header-based inference (strong signal)
  if (header) {
    for (const [type, patterns] of Object.entries(HEADER_KEYWORDS)) {
      for (const pattern of patterns) {
        if (pattern.test(header)) {
          candidates.push({
            type: type as InferredColumnType,
            score: 0.7,
            reasoning: `Header "${header}" matches pattern for ${type}`,
          });
          break;
        }
      }
    }
  }

  // 2. Content-based inference
  const range = getNumericRange(values);
  const hasRangePattern = hasRepetitionPattern(values);

  if (isText(values)) {
    // Long text strings → exercise name or notes
    const nonNull = values.filter((v) => v !== null);
    const avgLen =
      nonNull.reduce((s: number, v) => s + String(v).length, 0) /
      (nonNull.length || 1);

    if (avgLen > 20) {
      candidates.push({
        type: "notes",
        score: 0.6,
        reasoning: `Text values with avg length ${avgLen.toFixed(0)} suggest notes`,
      });
    } else {
      // Check for day names
      const dayPattern =
        /^(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday|push|pull|pierna|leg|upper|lower|full)/i;
      const dayMatches = values.filter((v) => dayPattern.test(String(v)));
      if (dayMatches.length > values.filter((v) => v !== null).length * 0.3) {
        candidates.push({
          type: "day_label",
          score: 0.85,
          reasoning: `${dayMatches.length} values match day/session patterns`,
        });
      } else {
        candidates.push({
          type: "exercise_name",
          score: 0.75,
          reasoning: `Short text values (avg ${avgLen.toFixed(0)} chars) suggest exercise names`,
        });
      }
    }
  }

  if (hasRangePattern) {
    candidates.push({
      type: "reps",
      score: 0.9,
      reasoning: `Values contain range patterns (e.g. "8-10") typical of rep ranges`,
    });
  }

  if (range) {
    // RIR: typically 0-4
    if (range.min >= 0 && range.max <= 5 && isInteger(values)) {
      candidates.push({
        type: "rir",
        score: 0.5,
        reasoning: `Integer range [${range.min}-${range.max}] could be RIR`,
      });
    }

    // RPE: typically 6-10
    if (range.min >= 5 && range.max <= 10) {
      candidates.push({
        type: "rpe",
        score: 0.5,
        reasoning: `Range [${range.min}-${range.max}] could be RPE`,
      });
    }

    // Sets: typically 1-6, integers
    if (range.min >= 1 && range.max <= 8 && isInteger(values)) {
      candidates.push({
        type: "sets",
        score: 0.55,
        reasoning: `Integer range [${range.min}-${range.max}] could be sets`,
      });
    }

    // Reps: typically 1-30, integers
    if (range.min >= 1 && range.max <= 50 && isInteger(values)) {
      candidates.push({
        type: "reps",
        score: 0.5,
        reasoning: `Integer range [${range.min}-${range.max}] could be reps`,
      });
    }

    // Weight: typically 5-300, often decimals
    if (range.min >= 2 && range.max <= 500) {
      const decimalBonus = isDecimal(values) ? 0.2 : 0;
      candidates.push({
        type: "weight_kg",
        score: 0.45 + decimalBonus,
        reasoning: `Range [${range.min}-${range.max}]${isDecimal(values) ? " with decimals" : ""} could be weight`,
      });
    }

    // Rest: typically 30-300 seconds
    if (range.min >= 10 && range.max <= 600 && isInteger(values)) {
      candidates.push({
        type: "rest_seconds",
        score: 0.5,
        reasoning: `Integer range [${range.min}-${range.max}] could be rest seconds`,
      });
    }

    // Week number: 1-12
    if (range.min >= 1 && range.max <= 16 && isInteger(values)) {
      candidates.push({
        type: "week_number",
        score: 0.35,
        reasoning: `Integer range [${range.min}-${range.max}] could be week numbers`,
      });
    }
  }

  // 3. Combine header + content scores
  const combined = new Map<InferredColumnType, { score: number; reasoning: string }>();
  for (const c of candidates) {
    const existing = combined.get(c.type);
    if (existing) {
      // Boost when both header and content agree
      combined.set(c.type, {
        score: Math.min(existing.score + c.score * 0.5, 0.99),
        reasoning: `${existing.reasoning}; ${c.reasoning}`,
      });
    } else {
      combined.set(c.type, { score: c.score, reasoning: c.reasoning });
    }
  }

  // Pick best candidate
  let best: { type: InferredColumnType; score: number; reasoning: string } = {
    type: "unknown",
    score: 0,
    reasoning: "Could not determine column type",
  };

  for (const [type, data] of combined) {
    if (data.score > best.score) {
      best = { type, ...data };
    }
  }

  return {
    type: best.type,
    confidence: Math.round(best.score * 100) / 100,
    reasoning: best.reasoning,
  };
}

// ── Public API ──

/**
 * Parse an Excel file buffer and return structured data with column inference.
 */
export function parseExcelBuffer(
  buffer: ArrayBuffer,
  fileName: string
): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheets: ParsedSheet[] = [];
  let needsReview = false;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      header: 1, // Use array indices as keys
      defval: null,
    }) as (string | number | null)[][];

    if (jsonData.length === 0) continue;

    // Detect if first row is header
    const firstRow = jsonData[0];
    const isFirstRowHeader = firstRow.every(
      (v) => v === null || typeof v === "string"
    );

    const headers = isFirstRowHeader
      ? firstRow.map((v) => (v !== null ? String(v).trim() : null))
      : firstRow.map((_, i) => `Col ${i + 1}`);

    const dataRows = isFirstRowHeader ? jsonData.slice(1) : jsonData;
    const colCount = headers.length;

    // Analyze each column
    const columns: DetectedColumn[] = [];
    for (let colIdx = 0; colIdx < colCount; colIdx++) {
      const colValues = dataRows
        .slice(0, 30) // Sample first 30 rows
        .map((row) => (colIdx < row.length ? row[colIdx] : null));

      const { type, confidence, reasoning } = inferColumnType(
        headers[colIdx],
        colValues
      );

      if (confidence < 0.9) needsReview = true;

      columns.push({
        index: colIdx,
        header: headers[colIdx],
        inferred_type: type,
        confidence,
        sample_values: colValues.slice(0, 5),
        reasoning,
      });
    }

    // Resolve conflicts: if two columns have same inferred type, lower the weaker one's confidence
    const typeCount = new Map<string, number[]>();
    for (const col of columns) {
      if (col.inferred_type !== "unknown") {
        const existing = typeCount.get(col.inferred_type) || [];
        existing.push(col.index);
        typeCount.set(col.inferred_type, existing);
      }
    }
    for (const [, indices] of typeCount) {
      if (indices.length > 1) {
        // Keep the highest-confidence one, demote others
        const sorted = indices.sort(
          (a, b) => columns[b].confidence - columns[a].confidence
        );
        for (let i = 1; i < sorted.length; i++) {
          columns[sorted[i]].confidence *= 0.5;
          columns[sorted[i]].reasoning += " (conflict: another column has higher confidence for same type)";
          needsReview = true;
        }
      }
    }

    // Convert data rows to objects
    const rows = dataRows.map((row) => {
      const obj: Record<string, any> = {};
      for (let i = 0; i < colCount; i++) {
        const key = headers[i] || `col_${i}`;
        obj[key] = i < row.length ? row[i] : null;
      }
      return obj;
    });

    sheets.push({
      name: sheetName,
      columns,
      rows,
      row_count: rows.length,
    });
  }

  return {
    file_name: fileName,
    sheets,
    needs_review: needsReview,
  };
}

/**
 * Apply trainer's confirmed column mapping to parsed data.
 * Returns structured exercise data ready for reconciliation.
 */
export function applyColumnMapping(
  sheet: ParsedSheet,
  mapping: Record<number, InferredColumnType>
): {
  exercises: {
    row_index: number;
    name: string;
    sets?: number;
    reps?: string;
    weight_kg?: number;
    rir?: number;
    rpe?: number;
    rest_seconds?: number;
    day_label?: string;
    week_number?: number;
    notes?: string;
  }[];
} {
  const exercises: any[] = [];
  const headers = sheet.columns.map((c) => c.header || `col_${c.index}`);

  for (let rowIdx = 0; rowIdx < sheet.rows.length; rowIdx++) {
    const row = sheet.rows[rowIdx];
    const entry: any = { row_index: rowIdx };

    for (const [colIdxStr, colType] of Object.entries(mapping)) {
      const colIdx = parseInt(colIdxStr);
      const header = headers[colIdx];
      const value = row[header];

      if (value === null || value === undefined || value === "") continue;

      switch (colType) {
        case "exercise_name":
          entry.name = String(value).trim();
          break;
        case "sets":
          entry.sets = parseInt(String(value));
          break;
        case "reps":
          entry.reps = String(value); // Keep as string to support "8-10"
          break;
        case "weight_kg":
          entry.weight_kg = parseFloat(String(value));
          break;
        case "rir":
          entry.rir = parseInt(String(value));
          break;
        case "rpe":
          entry.rpe = parseFloat(String(value));
          break;
        case "rest_seconds":
          entry.rest_seconds = parseInt(String(value));
          break;
        case "day_label":
          entry.day_label = String(value).trim();
          break;
        case "week_number":
          entry.week_number = parseInt(String(value));
          break;
        case "notes":
          entry.notes = String(value).trim();
          break;
      }
    }

    // Only include rows that have at least an exercise name
    if (entry.name) {
      exercises.push(entry);
    }
  }

  return { exercises };
}
