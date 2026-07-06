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

type Props = {
  pageData: DescriptionSummaryRow[];
  summaryRows: DescriptionSummaryRow[];
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

export default function QuerySummaryTable({
  pageData,
  summaryRows,
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

  return (
    <>
      <div className={tableWrap}>
        <table className="w-full min-w-[900px] text-xs">
          <thead className={thead}>
            <tr>
              <th className={th}>Description</th>
              <th className={th}>Unit</th>
              <th className={`${th} text-right`}>Qty</th>
              <th className={`${th} text-right`}>Material</th>
              <th className={`${th} text-right`}>Labor</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={`${th} text-right`}>Source Rows</th>
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
          Page <span className={`${fg} font-medium`}>{page}</span> /{" "}
          <span className={`${fg} font-medium`}>{totalPages}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={btnGhost}
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={btnGhost}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
