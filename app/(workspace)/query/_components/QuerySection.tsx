"use client";

import { useMemo, useState, useCallback } from "react";
import type { SessionRow } from "@/lib/boq/session";
import { useBoqSession, useQueryState } from "@/app/_providers/BoqSessionProvider";
import { toCSV, toDescriptionSummaryCSV } from "@/lib/boq/query";
import { useThemeStore } from "@/lib/theme/store";

import QueryTable from "./query/QueryTable";
import { useBoqQuery } from "./query/useBoqQuery";

import { MAX_EXPORT_ROWS, PAGE_SIZE } from "@/config/boq.config";

import QuerySummaryTable, {
  defaultSummarySortOrderFor,
  sortDescriptionSummaryRows,
  type DescriptionSummaryRow,
  type SummarySortKey,
} from "./query/QuerySummaryTable";

type Props = {
  /** BOQ rows ทั้งหมด (source of truth) */
  rows: SessionRow[];
};

/**
 * Filters ที่ใช้เฉพาะ "หัวตาราง" (หลังจาก search แล้ว)
 * เป็น multi-select ทั้งหมด
 */
type TableFilters = {
  wbs1: string[];
  wbs2: string[];
  wbs3: string[];
  wbs4: string[];
  unit: string[]; // ✅ Unit filter
};

type QtyByUnit = { unit: string; qty: number };

/** แปลง number ที่อาจเป็น null/undefined ให้ปลอดภัย */
const safeNum = (v: number | null | undefined) =>
  typeof v === "number" ? v : 0;

/** format จำนวนเต็ม (ตารางเว็บ) */
const fmtInt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/** format ทศนิยม 2 ตำแหน่ง (PDF/summary) */
const fmtNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });

/** normalize unit เพื่อให้ filter/summary สม่ำเสมอ */
const normalizeUnit = (u: string | null | undefined) => (u ?? "").trim() || "-";

/** รวม Qty ตาม unit สำหรับ summary */
function sumByUnit(rows: Array<{ unit?: string | null; qty?: number | null }>) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const u = normalizeUnit(r.unit);
    m.set(u, (m.get(u) ?? 0) + safeNum(r.qty));
  }
  return Array.from(m, ([unit, qty]) => ({ unit, qty })).sort((a, b) =>
    a.unit.localeCompare(b.unit),
  );
}

export default function QuerySection({ rows }: Props) {
  const session = useBoqSession();
  const isDark = useThemeStore((s) => s.theme) === "dark";

  // =========================
  // 1) Query state/actions (hook)
  // =========================
  const {
    input,
    setInput,
    matchMode,
    setMatchMode,
    error,

    workingRows,
    pendingRemoveIds,
    page,
    setPage,
    keywords,

    onSearch,
    togglePending,
    clearPending,
    applyPendingRemovals,
  } = useBoqQuery(rows);

  // =========================
  // 2) Table header filters
  // =========================
  const [tf, setTf] = useQueryState("filters");

  const [viewMode, setViewMode] = useQueryState("viewMode");
  const [summaryPage, setSummaryPage] = useQueryState("summaryPage");
  const [summarySort, setSummarySort] = useQueryState("summarySort");

  /** helper: patch filters แล้ว reset page (ใช้กับ dropdown) */
  const patchFilters = useCallback(
    (patch: Partial<TableFilters>) => {
      setTf((prev) => ({ ...prev, ...patch }));
      setPage(1);
      setSummaryPage(1);
    },
    [setPage, setTf, setSummaryPage],
  );

  /** reset filters + page */
  const resetFilters = useCallback(() => {
    setTf({ wbs1: [], wbs2: [], wbs3: [], wbs4: [], unit: [] });
    setPage(1);
    setSummaryPage(1);
  }, [setPage, setTf, setSummaryPage]);

  // =========================
  // 3) Derived data
  // =========================
  const filteredWorkingRows = useMemo(() => {
    return workingRows.filter((r) => {
      if (tf.wbs1.length && !tf.wbs1.includes(r.wbs1)) return false;
      if (tf.wbs2.length && !tf.wbs2.includes(r.wbs2)) return false;
      if (tf.wbs3.length && !tf.wbs3.includes(r.wbs3)) return false;
      if (tf.wbs4.length && !tf.wbs4.includes(r.wbs4)) return false;

      const u = normalizeUnit(r.unit);
      if (tf.unit.length && !tf.unit.includes(u)) return false;

      return true;
    });
  }, [workingRows, tf]);

  const pendingCountInFiltered = useMemo(() => {
    if (pendingRemoveIds.size === 0) return 0;
    let c = 0;
    for (const r of filteredWorkingRows) if (pendingRemoveIds.has(r._id)) c++;
    return c;
  }, [filteredWorkingRows, pendingRemoveIds]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredWorkingRows.length / PAGE_SIZE),
  );

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWorkingRows.slice(start, start + PAGE_SIZE);
  }, [filteredWorkingRows, page]);

  const sumAmount = useMemo(
    () => filteredWorkingRows.reduce((acc, r) => acc + safeNum(r.amount), 0),
    [filteredWorkingRows],
  );

  const qtyByUnit: QtyByUnit[] = useMemo(
    () => sumByUnit(filteredWorkingRows),
    [filteredWorkingRows],
  );

  const descriptionSummaryRows: DescriptionSummaryRow[] = useMemo(() => {
    const m = new Map<string, DescriptionSummaryRow>();

    for (const r of filteredWorkingRows) {
      const description = (r.description ?? "").trim();
      if (!description) continue;

      const unit = normalizeUnit(r.unit);
      const key = `${description}||${unit}`;

      const prev = m.get(key);
      if (!prev) {
        m.set(key, {
          _id: key,
          description,
          unit,
          qty: safeNum(r.qty),
          material: safeNum(r.material),
          labor: safeNum(r.labor),
          amount: safeNum(r.amount),
          sourceRows: 1,
        });
      } else {
        prev.qty += safeNum(r.qty);
        prev.material += safeNum(r.material);
        prev.labor += safeNum(r.labor);
        prev.amount += safeNum(r.amount);
        prev.sourceRows += 1;
      }
    }

    return Array.from(m.values());
  }, [filteredWorkingRows]);

  const sortedDescriptionSummaryRows = useMemo(
    () => sortDescriptionSummaryRows(descriptionSummaryRows, summarySort),
    [descriptionSummaryRows, summarySort],
  );

  const onSummarySort = useCallback((key: SummarySortKey) => {
    setSummarySort((prev) => {
      const nextOrder =
        prev.key === key
          ? prev.order === "asc"
            ? "desc"
            : "asc"
          : defaultSummarySortOrderFor(key);

      return { key, order: nextOrder };
    });
    setSummaryPage(1);
  }, [setSummarySort, setSummaryPage]);

  const summaryTotalPages = Math.max(
    1,
    Math.ceil(sortedDescriptionSummaryRows.length / PAGE_SIZE),
  );

  const summaryPageData = useMemo(() => {
    const start = (summaryPage - 1) * PAGE_SIZE;
    return sortedDescriptionSummaryRows.slice(start, start + PAGE_SIZE);
  }, [sortedDescriptionSummaryRows, summaryPage]);

  // =========================
  // 4) Apply pending removals (apply เฉพาะใน filtered view)
  // =========================
  const applyPendingRemovalsInView = useCallback(() => {
    if (pendingRemoveIds.size === 0) return;

    const applyIds = new Set<string>();
    for (const r of filteredWorkingRows) {
      if (pendingRemoveIds.has(r._id)) applyIds.add(r._id);
    }
    if (applyIds.size === 0) return;

    const newLen = filteredWorkingRows.length - applyIds.size;
    const newTotalPages = Math.max(1, Math.ceil(newLen / PAGE_SIZE));

    applyPendingRemovals(applyIds, newTotalPages);
  }, [applyPendingRemovals, filteredWorkingRows, pendingRemoveIds]);

  // =========================
  // 5) Export (CSV / PDF)
  // =========================
  const onDownloadCSV = useCallback(() => {
    const csv =
      viewMode === "detail"
        ? toCSV(filteredWorkingRows)
        : toDescriptionSummaryCSV(sortedDescriptionSummaryRows);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download =
      viewMode === "detail"
        ? "boq_query_detail_result.csv"
        : "boq_query_summary_by_description.csv";
    a.click();

    URL.revokeObjectURL(url);
  }, [filteredWorkingRows, sortedDescriptionSummaryRows, viewMode]);

  const [exporting, setExporting] = useState(false);

  const onExportPDF = useCallback(async () => {
    if (exporting) return;
    const revision = session.getState().revision;

    const exportRowCount =
      viewMode === "detail"
        ? filteredWorkingRows.length
        : sortedDescriptionSummaryRows.length;

    if (exportRowCount > MAX_EXPORT_ROWS) {
      alert(
        `ข้อมูล ${exportRowCount.toLocaleString()} แถว เยอะเกินไป\n` +
          `กรุณา filter ให้เหลือไม่เกิน ${MAX_EXPORT_ROWS.toLocaleString()} แถวก่อน export`,
      );
      return;
    }

    setExporting(true);
    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const { registerThaiFont } = await import("@/lib/pdf/registerThaiFont");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      await registerThaiFont(doc);

      const marginX = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const available = pageWidth - marginX * 2;

      doc.setFont("Sarabun", "normal");
      doc.setFontSize(14);
      doc.text(
        viewMode === "detail"
          ? `BOQ Query Detail Result (${filteredWorkingRows.length.toLocaleString()} rows)`
          : `BOQ Summary by Description (${sortedDescriptionSummaryRows.length.toLocaleString()} rows)`,
        marginX,
        32,
      );

      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, 46);

      const head =
        viewMode === "detail"
          ? [
              [
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
              ],
            ]
          : [
              [
                "Description",
                "Unit",
                "Qty",
                "Material",
                "Labor",
                "Amount",
                "Source Rows",
              ],
            ];

      const body =
        viewMode === "detail"
          ? filteredWorkingRows.map((r) => [
              r.wbs1 ?? "",
              r.wbs2 ?? "",
              r.wbs3 ?? "",
              r.wbs4 ?? "",
              r.description ?? "",
              normalizeUnit(r.unit),
              fmtNum(safeNum(r.qty)),
              fmtNum(safeNum(r.material)),
              fmtNum(safeNum(r.labor)),
              fmtNum(safeNum(r.amount)),
            ])
          : sortedDescriptionSummaryRows.map((r) => [
              r.description,
              r.unit,
              fmtNum(r.qty),
              fmtNum(r.material),
              fmtNum(r.labor),
              fmtNum(r.amount),
              r.sourceRows.toLocaleString(),
            ]);

      const detailW = { wbs: 42, unit: 40, qty: 48, money: 62 };
      const detailFixed =
        detailW.wbs * 4 + detailW.unit + detailW.qty + detailW.money * 3;
      const detailDescW = Math.max(180, available - detailFixed);

      const summaryW = { unit: 48, qty: 70, money: 82, sourceRows: 62 };
      const summaryFixed =
        summaryW.unit + summaryW.qty + summaryW.money * 3 + summaryW.sourceRows;
      const summaryDescW = Math.max(260, available - summaryFixed);

      autoTable(doc, {
        head,
        body,
        startY: 52,
        margin: { left: marginX, right: marginX },
        tableWidth: available,

        styles: {
          font: "Sarabun",
          fontStyle: "normal",
          fontSize: 8,
          cellPadding: 3,
          overflow: "ellipsize",
          valign: "top",
        },

        headStyles: {
          font: "Sarabun",
          fontStyle: "bold",
          fillColor: [230, 230, 230],
          textColor: [30, 30, 30],
        },

        columnStyles:
          viewMode === "detail"
            ? {
                0: { cellWidth: detailW.wbs },
                1: { cellWidth: detailW.wbs },
                2: { cellWidth: detailW.wbs },
                3: { cellWidth: detailW.wbs },
                4: { cellWidth: detailDescW, overflow: "ellipsize" },
                5: { cellWidth: detailW.unit },
                6: { halign: "right", cellWidth: detailW.qty },
                7: { halign: "right", cellWidth: detailW.money },
                8: { halign: "right", cellWidth: detailW.money },
                9: { halign: "right", cellWidth: detailW.money },
              }
            : {
                0: { cellWidth: summaryDescW, overflow: "ellipsize" },
                1: { cellWidth: summaryW.unit },
                2: { halign: "right", cellWidth: summaryW.qty },
                3: { halign: "right", cellWidth: summaryW.money },
                4: { halign: "right", cellWidth: summaryW.money },
                5: { halign: "right", cellWidth: summaryW.money },
                6: { halign: "right", cellWidth: summaryW.sourceRows },
              },

        didDrawPage: () => {
          const pageNo = doc.getNumberOfPages();
          doc.setFontSize(9);
          doc.text(`Page ${pageNo}`, pageWidth - marginX, pageHeight - 18, {
            align: "right",
          });
        },
      });

      const last = doc as unknown as { lastAutoTable?: { finalY?: number } };
      const y = (last.lastAutoTable?.finalY ?? pageHeight - 80) + 18;

      doc.setFontSize(10);

      if (viewMode === "detail") {
        const sum = filteredWorkingRows.reduce(
          (acc, r) => acc + safeNum(r.amount),
          0,
        );
        const qtyUnits = sumByUnit(filteredWorkingRows);

        doc.text(`Sum Amount: ${fmtNum(sum)}`, marginX, y);

        const qtyText = qtyUnits
          .map((x) => `${fmtNum(x.qty)} ${x.unit}`)
          .join(" | ");
        doc.text(`Sum Qty (by Unit): ${qtyText || "-"}`, marginX, y + 14);
      } else {
        const sumQty = sortedDescriptionSummaryRows.reduce(
          (a, r) => a + r.qty,
          0,
        );
        const sumMaterial = sortedDescriptionSummaryRows.reduce(
          (a, r) => a + r.material,
          0,
        );
        const sumLabor = sortedDescriptionSummaryRows.reduce(
          (a, r) => a + r.labor,
          0,
        );
        const sumAmount = sortedDescriptionSummaryRows.reduce(
          (a, r) => a + r.amount,
          0,
        );

        doc.text(
          `Unique descriptions: ${sortedDescriptionSummaryRows.length.toLocaleString()}`,
          marginX,
          y,
        );
        doc.text(
          `Sum Qty: ${fmtNum(sumQty)} | Material: ${fmtNum(sumMaterial)} | Labor: ${fmtNum(sumLabor)} | Amount: ${fmtNum(sumAmount)}`,
          marginX,
          y + 14,
        );
      }

      // A delayed font/module load must not export a replaced workbook.
      if (session.getState().revision !== revision || session.getState().loading) return;
      doc.save(
        viewMode === "detail"
          ? "boq_query_detail_result.pdf"
          : "boq_query_summary_by_description.pdf",
      );
    } finally {
      setExporting(false);
    }
  }, [exporting, filteredWorkingRows, sortedDescriptionSummaryRows, viewMode, session]);

  // =========================
  // 6) Filter options (for dropdowns)
  // =========================
  const wbs1Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) s.add(r.wbs1);
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows]);

  const wbs2Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) {
      if (tf.wbs1.length && !tf.wbs1.includes(r.wbs1)) continue;
      s.add(r.wbs2);
    }
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows, tf.wbs1]);

  const wbs3Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) {
      if (tf.wbs1.length && !tf.wbs1.includes(r.wbs1)) continue;
      if (tf.wbs2.length && !tf.wbs2.includes(r.wbs2)) continue;
      s.add(r.wbs3);
    }
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows, tf.wbs1, tf.wbs2]);

  const wbs4Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) {
      if (tf.wbs1.length && !tf.wbs1.includes(r.wbs1)) continue;
      if (tf.wbs2.length && !tf.wbs2.includes(r.wbs2)) continue;
      if (tf.wbs3.length && !tf.wbs3.includes(r.wbs3)) continue;
      s.add(r.wbs4);
    }
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows, tf.wbs1, tf.wbs2, tf.wbs3]);

  const unitOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) s.add(normalizeUnit(r.unit));
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows]);

  // =========================
  // 7) UI TOKENS (tailwind strings)
  // =========================
  const card =
    "rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-card)]";
  const muted = "text-[color:var(--color-muted-foreground)]";
  const fg = "text-[color:var(--color-foreground)]";

  const inputCls =
    "h-10 flex-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 text-sm " +
    "text-[color:var(--color-foreground)] shadow-[var(--shadow-input)] outline-none " +
    "focus:ring-2 focus:ring-[color:var(--color-accent)]/35";

  const checkboxWrap = "flex items-center gap-2 text-xs";
  const checkboxCls =
    "h-4 w-4 rounded border border-[color:var(--color-border)] accent-[color:var(--color-accent)]";

  const btnPrimary =
    "inline-flex items-center justify-center gap-2 h-10 rounded-xl " +
    "bg-[color:var(--color-accent)] px-4 text-sm font-medium text-white " +
    "shadow-[var(--shadow-input)] " +
    "transition-all duration-150 ease-out " +
    "hover:-translate-y-[1px] hover:shadow-lg hover:brightness-110 " +
    "active:translate-y-0 active:scale-[0.98] active:shadow-md " +
    "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40 " +
    "disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100";

  const btnGhost =
    "inline-flex items-center justify-center gap-2 rounded-xl " +
    "border border-[color:var(--color-border)] " +
    "bg-[color:var(--color-surface-2)] px-3 py-1.5 text-xs " +
    "text-[color:var(--color-foreground)] " +
    "shadow-[var(--shadow-input)] " +
    "transition-all duration-150 ease-out " +
    "hover:-translate-y-[1px] hover:shadow-md hover:border-[color:var(--color-accent)]/35 " +
    "active:translate-y-0 active:scale-[0.98] active:shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/35 " +
    "disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100";

  const tableWrap =
    "overflow-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]";
  const thead =
    "sticky top-0 z-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]";
  const th = `p-2 text-left text-xs font-semibold ${muted}`;
  const td = `p-2 text-xs ${fg}`;
  const tdNum = `p-2 text-xs text-right ${fg}`;
  const rowBase =
    "border-t border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-2)]/70";

  const emptyBox =
    "rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 text-sm " +
    "text-[color:var(--color-muted-foreground)]";

  const markWrap =
    "[&>mark]:rounded [&>mark]:px-0.5 " +
    (isDark
      ? "[&>mark]:bg-amber-400/25 [&>mark]:text-amber-200"
      : "[&>mark]:bg-yellow-200 [&>mark]:text-slate-900");

  const pendingRowCls = isDark ? "bg-red-500/10" : "bg-rose-50";

  // =========================
  // 8) RENDER
  // =========================
  return (
    <section className={`${card} space-y-4`}>
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className={`text-lg font-semibold ${fg}`}>BOQ Query</h2>
          <div className={`mt-1 text-xs ${muted}`}>
            • ค้นหา Description • WBS/Unit filter เลือกได้หลายค่า •
            เลือกแถวตัดออก (pending) • Apply ทีเดียว
          </div>
        </div>
        <div className={`text-xs ${muted}`}>
          Page size: <span className={`${fg} font-medium`}>{PAGE_SIZE}</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ค้นหา Description (Thai / English)"
          className={inputCls}
        />

        <label className={checkboxWrap}>
          <input
            className={checkboxCls}
            type="checkbox"
            checked={matchMode === "any"}
            onChange={(e) => setMatchMode(e.target.checked ? "any" : "all")}
          />
          <span className={muted}>Match any word</span>
        </label>

        <button type="button" onClick={onSearch} className={btnPrimary}>
          Search
        </button>

        <div className="flex overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
          <button
            type="button"
            onClick={() => {
              setViewMode("detail");
              setPage(1);
            }}
            className={
              "px-3 py-1.5 text-xs transition " +
              (viewMode === "detail"
                ? "bg-[color:var(--color-accent)] text-white"
                : "text-[color:var(--color-foreground)]")
            }
          >
            Detail by WBS
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("summary");
              setSummaryPage(1);
            }}
            className={
              "px-3 py-1.5 text-xs transition " +
              (viewMode === "summary"
                ? "bg-[color:var(--color-accent)] text-white"
                : "text-[color:var(--color-foreground)]")
            }
          >
            Summary by Description
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* Result */}
      {workingRows.length > 0 ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className={`text-sm ${muted}`}>
              {viewMode === "detail" ? (
                <>
                  พบ{" "}
                  <span className={`${fg} font-medium`}>
                    {filteredWorkingRows.length.toLocaleString()}
                  </span>{" "}
                  รายการ
                </>
              ) : (
                <>
                  สรุป{" "}
                  <span className={`${fg} font-medium`}>
                    {descriptionSummaryRows.length.toLocaleString()}
                  </span>{" "}
                  descriptions จาก{" "}
                  <span className={`${fg} font-medium`}>
                    {filteredWorkingRows.length.toLocaleString()}
                  </span>{" "}
                  รายการ
                </>
              )}

              {pendingCountInFiltered > 0 ? (
                <>
                  {" "}
                  • เลือกตัดออก{" "}
                  <span className={`${fg} font-medium`}>
                    {pendingCountInFiltered.toLocaleString()}
                  </span>{" "}
                  รายการ (ยังไม่ลบจริง)
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={applyPendingRemovalsInView}
                disabled={pendingCountInFiltered === 0}
                className={btnGhost}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={clearPending}
                disabled={pendingCountInFiltered === 0}
                className={btnGhost}
              >
                Undo
              </button>
              <button type="button" onClick={resetFilters} className={btnGhost}>
                Clear filters
              </button>
              <button
                type="button"
                onClick={onExportPDF}
                className={btnGhost}
                disabled={exporting}
              >
                {exporting ? "Exporting..." : "Export PDF"}
              </button>

              <button
                type="button"
                onClick={onDownloadCSV}
                className={btnGhost}
              >
                Download CSV
              </button>
            </div>
          </div>

          {viewMode === "detail" ? (
            <QueryTable
              pageData={pageData}
              qtyByUnit={qtyByUnit}
              sumAmount={sumAmount}
              page={page}
              totalPages={totalPages}
              setPage={setPage}
              pendingRemoveIds={pendingRemoveIds}
              togglePending={togglePending}
              keywords={keywords}
              tf={tf}
              patchFilters={patchFilters}
              wbs1Options={wbs1Options}
              wbs2Options={wbs2Options}
              wbs3Options={wbs3Options}
              wbs4Options={wbs4Options}
              unitOptions={unitOptions}
              normalizeUnit={normalizeUnit}
              safeNum={safeNum}
              fmtInt={fmtInt}
              fmtNum={fmtNum}
              tableWrap={tableWrap}
              thead={thead}
              th={th}
              td={td}
              tdNum={tdNum}
              rowBase={rowBase}
              muted={muted}
              fg={fg}
              markWrap={markWrap}
              pendingRowCls={pendingRowCls}
              btnGhost={btnGhost}
            />
          ) : (
            <QuerySummaryTable
              pageData={summaryPageData}
              summaryRows={descriptionSummaryRows}
              sort={summarySort}
              onSort={onSummarySort}
              page={summaryPage}
              totalPages={summaryTotalPages}
              setPage={setSummaryPage}
              keywords={keywords}
              fmtInt={fmtInt}
              fmtNum={fmtNum}
              tableWrap={tableWrap}
              thead={thead}
              th={th}
              td={td}
              tdNum={tdNum}
              rowBase={rowBase}
              muted={muted}
              fg={fg}
              markWrap={markWrap}
              btnGhost={btnGhost}
            />
          )}
        </>
      ) : (
        <div className={emptyBox}>ยังไม่มีผลลัพธ์</div>
      )}
    </section>
  );
}
