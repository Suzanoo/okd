"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ActivityRow, ProgressRow, ViewMode } from "@/types/report";

import { KPICards } from "./_components/KPICards";
import { ReportControls } from "./_components/ReportControls";
import { SCurveChart } from "./_components/SCurveChart";
import { ActivityTable } from "./_components/ProgressTable";

import {
  buildChartRows,
  getBaseRows,
  getCutoffOptions,
} from "@/lib/report/aggregateProgress";
import { calculateKpi } from "@/lib/report/calculateKpi";
import { calculateActivityProgress } from "@/lib/report/calculateActivityProgress";
import { parseReportWorkbook } from "@/lib/report/parseReportWorkbook";

export default function ReportPage() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
  const [mode, setMode] = useState<ViewMode>("weekly");
  const [cutoffDate, setCutoffDate] = useState("");
  const [workbookName, setWorkbookName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [amountLabel, setAmountLabel] = useState("Amount / weight (source units)");
  const request = useRef(0);

  function applyWorkbookData(
    progressRows: ProgressRow[],
    nextActivityRows: ActivityRow[],
    name: string,
    nextWarnings: string[],
    nextAmountLabel: string,
  ) {
    setRows(progressRows);
    setActivityRows(nextActivityRows);
    setWorkbookName(name);
    setWarnings(nextWarnings);
    setAmountLabel(nextAmountLabel);
    setError("");
    setCutoffDate(progressRows.at(-1)?.week_start ?? "");
  }

  useEffect(() => {
    let active = true;
    const id = request.current;
    fetch("/data/example_progress.xlsx")
      .then((res) => { if (!res.ok) throw new Error("Could not load the demo workbook."); return res.arrayBuffer(); })
      .then((buffer) => {
        if (!active || request.current !== id) return;
        const result = parseReportWorkbook(buffer);
        applyWorkbookData(
          result.progressRows,
          result.activityRows,
          "Synthetic demo — example_progress.xlsx",
          result.warnings,
          result.amountLabel,
        );
      })
      .catch((error) => {
        if (active && request.current === id) setError(String(error));
      })
      .finally(() => {
        if (active && request.current === id) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleWorkbookUpload = async (file: File) => {
    const id = ++request.current;
    setLoading(true);
    setError("");
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("Report workbook exceeds the 20 MiB upload limit.");
      const result = parseReportWorkbook(await file.arrayBuffer());
      if (id !== request.current) return;
      applyWorkbookData(result.progressRows, result.activityRows, file.name, result.warnings, result.amountLabel);
    } catch (e) {
      if (id === request.current) setError(`Could not load ${file.name}. ${e instanceof Error ? e.message : "Invalid workbook."} ${workbookName ? `Showing the previously loaded workbook: ${workbookName}.` : "No workbook is loaded."} Select a corrected workbook to retry.`);
    } finally {
      if (id === request.current) setLoading(false);
    }
  };

  const options = useMemo(() => getCutoffOptions(rows, mode), [rows, mode]);
  const baseRows = useMemo(() => getBaseRows(rows, mode), [rows, mode]);

  const cutoffRow = useMemo(
    () => baseRows.find((row) => row.week_start === cutoffDate) ?? null,
    [baseRows, cutoffDate],
  );

  const chartRows = useMemo(
    () => buildChartRows(rows, mode, cutoffDate),
    [rows, mode, cutoffDate],
  );

  const kpi = useMemo(() => calculateKpi(cutoffRow), [cutoffRow]);

  const activityTableRows = useMemo(
    () => calculateActivityProgress(activityRows, cutoffDate),
    [activityRows, cutoffDate],
  );

  const handleModeChange = (nextMode: ViewMode) => {
    setMode(nextMode);

    const nextRows = getBaseRows(rows, nextMode);
    setCutoffDate(nextRows.at(-1)?.week_start ?? "");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:flex-wrap md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground md:text-sm md:tracking-[0.35em]">
              OKD Dashboard
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:mt-3 md:text-4xl">
              Progress Report
            </h1>
          </div>

          <ReportControls
            mode={mode}
            setMode={handleModeChange}
            cutoffDate={cutoffDate}
            setCutoffDate={setCutoffDate}
            options={options}
            workbookName={workbookName || "No workbook loaded"}
            disabled={loading || rows.length === 0}
            onWorkbookUpload={handleWorkbookUpload}
          />
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl border border-danger p-4 text-danger">{error}</p>}
        <p role="status" className="mb-4 break-words text-sm text-muted-foreground">
          {loading ? `Loading workbook… ${workbookName ? `Previous data remains visible: ${workbookName}.` : "No report data is available yet."}` : workbookName ? `Loaded: ${workbookName}. Cutoff: ${cutoffDate || "not selected"}.` : "No report data. Upload a supported workbook, or download the synthetic sample and select it with Upload Excel."}
        </p>
        <p className="mb-4 text-sm text-muted-foreground">Progress variance is Actual minus Plan, in percentage points. The duration proxy scales this variance by the planned project duration; it is not confirmed schedule delay or a critical-path assessment. Uploaded files stay in this browser; leaving Report clears this report.</p>
        {warnings.map(message => <p key={message} className="mb-3 text-sm text-muted-foreground">{message}</p>)}
        {cutoffRow?.actual === null && <p className="mb-3">Actual progress is unavailable at this cutoff. Plan: {cutoffRow.plan.toFixed(2)}%.</p>}
        {rows.length > 0 && <>
        {kpi && <p className="mb-4 text-sm">Progress status at {cutoffDate}: Actual {kpi.variance < 0 ? "is below Plan" : kpi.variance > 0 ? "is above Plan" : "matches Plan"}. This compares progress percentages, not schedule completion dates.</p>}
        <KPICards kpi={kpi} />
        <SCurveChart data={chartRows} />
        <ActivityTable data={activityTableRows} amountLabel={amountLabel} />
        </>}
      </div>
    </main>
  );
}
