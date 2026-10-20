import type { BoqRow } from "./types";

export type MatchMode = "all" | "any";

/** escape regex special chars (กัน user พิมพ์ * + ?) */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build regex for Thai + English
 * - unicode
 * - case-insensitive
 * - partial match
 */
export function buildDescriptionRegex(input: string, mode: MatchMode): RegExp | null {
  const q = input.trim();
  if (!q) return null;

  const parts = q.split(/\s+/).map(escapeRegExp);
  if (parts.length === 0) return null;

  if (mode === "any") {
    // OR
    return new RegExp(`(${parts.join("|")})`, "iu");
  }

  // ALL (AND)
  const pattern = parts.map((p) => `(?=.*${p})`).join("") + ".*";
  return new RegExp(pattern, "iu");
}

export function filterByDescription<T extends BoqRow>(
  rows: T[],
  regex: RegExp
): T[] {
  return rows.filter((r) => regex.test(r.description ?? ""));

}

type CsvCell = string | number | null | undefined;

function rowsToCSV(header: string[], lines: CsvCell[][]): string {
  const csvBody = [header, ...lines]
    .map((row) =>
      row.map((v) => {
        // Keep numeric cells numeric; prevent imported text becoming Excel formulas.
        const safe = typeof v === "string" && /^[\s\uFEFF]*[=+@-]/.test(v) ? `'${v}` : String(v ?? "");
        return `"${safe.replace(/"/g, '""')}"`;
      }).join(","),
    )
    .join("\r\n");

  // BOM ช่วยให้ Excel/Windows อ่านภาษาไทยถูกขึ้น
  return "\uFEFF" + csvBody;
}

export function toCSV(rows: BoqRow[]): string {
  const header = [
    "WBS-1",
    "WBS-2",
    "WBS-3",
    "WBS-4",
    "Description",
    "Unit",
    "Qty",
    "Material",
    "Labor",
    "Amount",
  ];

  const lines = rows.map((r) => [
    r.wbs1,
    r.wbs2,
    r.wbs3,
    r.wbs4,
    r.description,
    r.unit,
    r.qty,
    r.material,
    r.labor,
    r.amount,
  ]);

  return rowsToCSV(header, lines);
}

export type DescriptionSummaryCsvRow = {
  description: string;
  unit: string;
  qty: number;
  material: number;
  labor: number;
  amount: number;
  sourceRows: number;
};

export function toDescriptionSummaryCSV(
  rows: DescriptionSummaryCsvRow[],
): string {
  const header = [
    "Description",
    "Unit",
    "Qty",
    "Material",
    "Labor",
    "Amount",
    "Source Rows",
  ];

  const lines = rows.map((r) => [
    r.description,
    r.unit,
    r.qty,
    r.material,
    r.labor,
    r.amount,
    r.sourceRows,
  ]);

  return rowsToCSV(header, lines);
}
