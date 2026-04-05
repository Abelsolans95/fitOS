import { describe, it, expect } from "vitest";
import { parseExcelBuffer, applyColumnMapping, type DetectedColumn, type ParsedSheet } from "./excel-parser";
import ExcelJS from "exceljs";

// ---------------------------------------------------------------------------
// Helpers — build a minimal workbook buffer
// ---------------------------------------------------------------------------

async function makeWorkbookBuffer(sheets: Record<string, (string | number | null)[][]>): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  for (const [name, data] of Object.entries(sheets)) {
    const ws = wb.addWorksheet(name);
    for (const row of data) {
      ws.addRow(row);
    }
  }
  const nodeBuffer = await wb.xlsx.writeBuffer();
  return nodeBuffer as unknown as ArrayBuffer;
}

// ---------------------------------------------------------------------------
// Tests — parseExcelBuffer
// ---------------------------------------------------------------------------

describe("parseExcelBuffer", () => {
  // 1. Parses basic sheet structure
  it("parses a sheet with headers and data rows", async () => {
    const buffer = await makeWorkbookBuffer({
      "Hoja1": [
        ["Ejercicio", "Series", "Reps", "Peso"],
        ["Sentadilla", 4, 8, 80],
        ["Press banca", 3, 10, 60],
      ],
    });

    const result = await parseExcelBuffer(buffer, "test.xlsx");

    expect(result.file_name).toBe("test.xlsx");
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].name).toBe("Hoja1");
    expect(result.sheets[0].row_count).toBe(2); // 2 data rows (header excluded)
    expect(result.sheets[0].columns.length).toBeGreaterThanOrEqual(4);
  });

  // 2. Returns empty sheets array for empty workbook
  it("returns empty sheets for a workbook with an empty sheet", async () => {
    const buffer = await makeWorkbookBuffer({ "Empty": [] });

    const result = await parseExcelBuffer(buffer, "empty.xlsx");

    expect(result.sheets).toHaveLength(0);
  });

  // 3. Extracts headers from first row
  it("detects header row and uses as column headers", async () => {
    const buffer = await makeWorkbookBuffer({
      "Hoja1": [
        ["Ejercicio", "Series"],
        ["Curl", 3],
      ],
    });

    const result = await parseExcelBuffer(buffer, "headers.xlsx");
    const headers = result.sheets[0].columns.map((c) => c.header);

    expect(headers).toContain("Ejercicio");
    expect(headers).toContain("Series");
  });

  // 4. Infers exercise_name for text columns with header match
  it("infers exercise_name type for 'Ejercicio' header", async () => {
    const buffer = await makeWorkbookBuffer({
      "Hoja1": [
        ["Ejercicio", "Series"],
        ["Sentadilla", 4],
        ["Press", 3],
      ],
    });

    const result = await parseExcelBuffer(buffer, "infer.xlsx");
    const exCol = result.sheets[0].columns.find((c) => c.header === "Ejercicio");

    expect(exCol).toBeDefined();
    expect(exCol!.inferred_type).toBe("exercise_name");
    expect(exCol!.confidence).toBeGreaterThan(0.5);
  });

  // 5. Sets needs_review when low confidence columns exist
  it("sets needs_review=true when confidence < 0.9", async () => {
    const buffer = await makeWorkbookBuffer({
      "Hoja1": [
        ["A", "B"],
        [1, 2],
        [3, 4],
      ],
    });

    const result = await parseExcelBuffer(buffer, "ambiguous.xlsx");

    // Generic headers "A" and "B" with small integer data should be low confidence
    expect(result.needs_review).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests — applyColumnMapping
// ---------------------------------------------------------------------------

describe("applyColumnMapping", () => {
  it("maps columns to structured exercise data", () => {
    const sheet: ParsedSheet = {
      name: "Test",
      columns: [
        { index: 0, header: "Ejercicio", inferred_type: "exercise_name", confidence: 0.9, sample_values: ["Squat"], reasoning: "" },
        { index: 1, header: "Series", inferred_type: "sets", confidence: 0.9, sample_values: [4], reasoning: "" },
      ],
      rows: [
        { "Ejercicio": "Squat", "Series": 4 },
        { "Ejercicio": "Bench", "Series": 3 },
      ],
      row_count: 2,
    };

    const result = applyColumnMapping(sheet, {
      0: "exercise_name",
      1: "sets",
    });

    expect(result.exercises).toHaveLength(2);
    expect(result.exercises[0].name).toBe("Squat");
    expect(result.exercises[0].sets).toBe(4);
    expect(result.exercises[1].name).toBe("Bench");
  });

  it("skips rows without exercise name", () => {
    const sheet: ParsedSheet = {
      name: "Test",
      columns: [
        { index: 0, header: "Ejercicio", inferred_type: "exercise_name", confidence: 0.9, sample_values: [], reasoning: "" },
      ],
      rows: [
        { "Ejercicio": "Squat" },
        { "Ejercicio": null },
        { "Ejercicio": "" },
      ],
      row_count: 3,
    };

    const result = applyColumnMapping(sheet, { 0: "exercise_name" });

    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].name).toBe("Squat");
  });
});
