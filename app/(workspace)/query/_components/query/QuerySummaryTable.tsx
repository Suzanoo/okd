"use client";

import type React from "react";
import { highlightText } from "@/lib/boq/highlight";

export type DescriptionSummaryRow = {
  _id: string;
  description: string;
  unit: string;
  qty: number;
  material: number;
  labor: number;
  amount: number;
  sourceRows: number;
};

export type SummarySortKey =
  | "description"
  | "unit"
  | "qty"
  | "material"
  | "labor"
  | "amount"
  | "sourceRows";

export type SummarySortOrder = "asc" | "desc";

export type SummarySortState = {
  key: SummarySortKey;
  order: SummarySortOrder;
};

type Props = {
  pageData: DescriptionSummaryRow[];
  summaryRows: DescriptionSummaryRow[];

  sort: SummarySortState;
  onSort: (key: SummarySortKey) => void;

  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;

  keywords: string[];

  fmtInt: (n: number) => string;
  fmtNum: (n: number) => string;

  tableWrap: string;
  thead: string;
  th: string;
  td: string;
  tdNum: string;
  rowBase: string;
  muted: string;
  fg: string;
  markWrap: string;
  btnGhost: string;
};

function sortIndicator(key: SummarySortKey, sort: SummarySortState) {
  if (sort.key !== key) return "↕";
  return sort.order === "asc" ? "▲" : "▼";
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "th", {
    numeric: true,
    sensitivity: "base",
  });
}

function compareSummaryRows(
  a: DescriptionSummaryRow,
  b: DescriptionSummaryRow,
  sort: SummarySortState,
) {
  let result = 0;

  switch (sort.key) {
    case "description":
      result = compareText(a.description, b.description);
      break;
    case "unit":
      result = compareText(a.unit, b.unit);
      break;
    case "qty":
      result = a.qty - b.qty;
      break;
    case "material":
      result = a.material - b.material;
      break;
    case "labor":
      result = a.labor - b.labor;
      break;
    case "amount":
      result = a.amount - b.amount;
      break;
    case "sourceRows":
      result = a.sourceRows - b.sourceRows;
      break;
  }

  if (result === 0) result = compareText(a._id, b._id);
  return sort.order === "asc" ? result : -result;
}

export function defaultSummarySortOrderFor(
  key: SummarySortKey,
): SummarySortOrder {
  return key === "description" || key === "unit" ? "asc" : "desc";
}

export function sortDescriptionSummaryRows(
  rows: DescriptionSummaryRow[],
  sort: SummarySortState,
) {
  return [...rows].sort((a, b) => compareSummaryRows(a, b, sort));
}

export default function QuerySummaryTable({
  pageData,
  summaryRows,

  sort,
  onSort,

  page,
  totalPages,
  setPage,

  keywords,

  fmtInt,
  fmtNum,

  tableWrap,
  thead,
  th,
  td,
  tdNum,
  rowBase,
  muted,
  fg,
  markWrap,
  btnGhost,
}: Props) {
  const sumQty = summaryRows.reduce((a, r) => a + r.qty, 0);
  const sumMaterial = summaryRows.reduce((a, r) => a + r.material, 0);
  const sumLabor = summaryRows.reduce((a, r) => a + r.labor, 0);
  const sumAmount = summaryRows.reduce((a, r) => a + r.amount, 0);

  const safePage = Math.min(page, totalPages);

  const sortableHeader = (
    key: SummarySortKey,
    label: string,
    align: "left" | "right" = "left",
  ) => (
    <button
      type="button"
      onClick={() => onSort(key)}
      className={
        "inline-flex w-full items-center gap-1 rounded-md transition hover:text-[color:var(--color-foreground)] " +
        (align === "right"
          ? "justify-end text-right"
          : "justify-start text-left")
      }
      title={`Sort by ${label}`}
    >
      <span>{label}</span>
      <span className={`text-[10px] ${sort.key === key ? fg : muted}`}>
        {sortIndicator(key, sort)}
      </span>
    </button>
  );

  return (
    <>
      <div className={tableWrap} tabIndex={0} role="region" aria-label="Query results — scroll horizontally for all columns">
        <table className="w-full min-w-[900px] text-xs">
          <thead className={thead}>
            <tr>
              <th aria-sort={sort.key === "description" ? (sort.order === "asc" ? "ascending" : "descending") : "none"} className={th}>
                {sortableHeader("description", "Description")}
              </th>
              <th aria-sort={sort.key === "unit" ? (sort.order === "asc" ? "ascending" : "descending") : "none"} className={th}>
                {sortableHeader("unit", "Unit")}</th>
              <th aria-sort={sort.key === "qty" ? (sort.order === "asc" ? "ascending" : "descending") : "none"} className={`${th} text-right`}>
                {sortableHeader("qty", "Qty", "right")}
              </th>
              <th aria-sort={sort.key === "material" ? (sort.order === "asc" ? "ascending" : "descending") : "none"} className={`${th} text-right`}>
                {sortableHeader("material", "Material", "right")}
              </th>
              <th aria-sort={sort.key === "labor" ? (sort.order === "asc" ? "ascending" : "descending") : "none"} className={`${th} text-right`}>
                {sortableHeader("labor", "Labor", "right")}
              </th>
              <th aria-sort={sort.key === "amount" ? (sort.order === "asc" ? "ascending" : "descending") : "none"} className={`${th} text-right`}>
                {sortableHeader("amount", "Amount", "right")}
              </th>
              <th aria-sort={sort.key === "sourceRows" ? (sort.order === "asc" ? "ascending" : "descending") : "none"} className={`${th} text-right`}>
                {sortableHeader("sourceRows", "Source Rows", "right")}
              </th>
            </tr>
          </thead>

          <tbody>
            {pageData.map((r) => (
              <tr key={r._id} className={rowBase}>
                <td className={td}>
                  <span className={markWrap}>
                    {highlightText(r.description, keywords)}
                  </span>
                </td>
                <td className={td}>{r.unit}</td>
                <td className={tdNum}>{fmtNum(r.qty)}</td>
                <td className={tdNum}>{fmtInt(r.material)}</td>
                <td className={tdNum}>{fmtInt(r.labor)}</td>
                <td className={`${tdNum} font-semibold`}>{fmtInt(r.amount)}</td>
                <td className={tdNum}>{r.sourceRows.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-[color:var(--color-border)]">
              <td className="p-3 text-xs" colSpan={2}>
                <div className={`font-semibold ${fg}`}>
                  Summary by Description
                </div>
                <div className={`mt-1 text-[11px] ${muted}`}>
                  Unique descriptions:{" "}
                  <span className={fg}>
                    {summaryRows.length.toLocaleString()}
                  </span>
                </div>
              </td>

              <td className="p-3 text-xs text-right">
                <div className={`text-[11px] ${muted}`}>Qty</div>
                <div className={`text-sm font-semibold ${fg}`}>
                  {fmtNum(sumQty)}
                </div>
              </td>

              <td className="p-3 text-xs text-right">
                <div className={`text-[11px] ${muted}`}>Material</div>
                <div className={`text-sm font-semibold ${fg}`}>
                  {fmtInt(sumMaterial)}
                </div>
              </td>

              <td className="p-3 text-xs text-right">
                <div className={`text-[11px] ${muted}`}>Labor</div>
                <div className={`text-sm font-semibold ${fg}`}>
                  {fmtInt(sumLabor)}
                </div>
              </td>

              <td className="p-3 text-xs text-right">
                <div className={`text-[11px] ${muted}`}>Amount</div>
                <div className={`text-sm font-semibold ${fg}`}>
                  {fmtInt(sumAmount)}
                </div>
              </td>

              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className={muted}>
          Page <span className={`${fg} font-medium`}>{safePage}</span> /{" "}
          <span className={`${fg} font-medium`}>{totalPages}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() =>
              setPage((p) => Math.max(1, Math.min(p, totalPages) - 1))
            }
            className={btnGhost}
          >
            Prev
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() =>
              setPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))
            }
            className={btnGhost}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
