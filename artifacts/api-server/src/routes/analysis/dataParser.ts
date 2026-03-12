import { parse } from "csv-parse/sync";

export interface ParsedDataset {
  rows: Record<string, unknown>[];
  columnNames: string[];
  columnTypes: Record<string, string>;
}

function inferType(values: unknown[]): string {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "string";

  const allNumeric = nonNull.every((v) => !isNaN(Number(v)));
  if (allNumeric) return "number";

  const allBoolean = nonNull.every((v) =>
    ["true", "false", "1", "0", "yes", "no"].includes(String(v).toLowerCase())
  );
  if (allBoolean) return "boolean";

  const allDate = nonNull.every((v) => !isNaN(Date.parse(String(v))));
  if (allDate) return "date";

  return "string";
}

export function parseCSV(content: string): ParsedDataset {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, unknown>[];

  if (!records.length) {
    return { rows: [], columnNames: [], columnTypes: {} };
  }

  const columnNames = Object.keys(records[0]);
  const columnTypes: Record<string, string> = {};

  for (const col of columnNames) {
    const values = records.map((r) => r[col]);
    columnTypes[col] = inferType(values);
  }

  return { rows: records, columnNames, columnTypes };
}

export function parseJSON(content: string): ParsedDataset {
  const data = JSON.parse(content);
  const records: Record<string, unknown>[] = Array.isArray(data) ? data : [data];

  if (!records.length) {
    return { rows: [], columnNames: [], columnTypes: {} };
  }

  const columnNames = Object.keys(records[0]);
  const columnTypes: Record<string, string> = {};

  for (const col of columnNames) {
    const values = records.map((r) => r[col]);
    columnTypes[col] = inferType(values);
  }

  return { rows: records, columnNames, columnTypes };
}

export function computeMissingValues(
  rows: Record<string, unknown>[],
  columnNames: string[]
): Record<string, number> {
  const missing: Record<string, number> = {};
  for (const col of columnNames) {
    missing[col] = rows.filter(
      (r) => r[col] === null || r[col] === undefined || r[col] === ""
    ).length;
  }
  return missing;
}

export function computeSummary(
  rows: Record<string, unknown>[],
  columnNames: string[],
  columnTypes: Record<string, string>
): Record<string, unknown> {
  const summary: Record<string, unknown> = {};

  for (const col of columnNames) {
    const values = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== "");

    if (columnTypes[col] === "number") {
      const nums = values.map(Number);
      const sorted = [...nums].sort((a, b) => a - b);
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const std = Math.sqrt(nums.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / nums.length);

      summary[col] = { mean: +mean.toFixed(4), median, min, max, std: +std.toFixed(4), count: nums.length };
    } else {
      const freq: Record<string, number> = {};
      for (const v of values) {
        const key = String(v);
        freq[key] = (freq[key] || 0) + 1;
      }
      const topValues = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([val, cnt]) => ({ value: val, count: cnt }));
      summary[col] = { uniqueCount: Object.keys(freq).length, topValues, count: values.length };
    }
  }

  return summary;
}
