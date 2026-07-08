"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [workbookName, setWorkbookName] = useState("example_progress.xlsx");

  function applyWorkbookData(
    progressRows: ProgressRow[],
    nextActivityRows: ActivityRow[],
    name: string,
  ) {
    setRows(progressRows);
    setActivityRows(nextActivityRows);
    setWorkbookName(name);
    setCutoffDate(progressRows.at(-1)?.week_start ?? "");
  }

  useEffect(() => {
    fetch("/data/example_progress.xlsx")
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const result = parseReportWorkbook(buffer);
        applyWorkbookData(
          result.progressRows,
          result.activityRows,
          "example_progress.xlsx",
        );
      })
      .catch((error) => {
        console.error("Failed to load example_progress.xlsx", error);
      });
  }, []);

  const handleWorkbookUpload = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const result = parseReportWorkbook(buffer);
    applyWorkbookData(result.progressRows, result.activityRows, file.name);
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
              QUE SERA, SERA. 🙈 🙉 🙊
            </h1>
          </div>

          <ReportControls
            mode={mode}
            setMode={handleModeChange}
            cutoffDate={cutoffDate}
            setCutoffDate={setCutoffDate}
            options={options}
            workbookName={workbookName}
            onWorkbookUpload={handleWorkbookUpload}
          />
        </div>

        <KPICards kpi={kpi} />
        <SCurveChart data={chartRows} />
        <ActivityTable data={activityTableRows} />
      </div>
    </main>
  );
}
