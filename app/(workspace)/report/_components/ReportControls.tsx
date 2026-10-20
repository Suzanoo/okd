import { SourcePanel, controlClass, buttonClass } from "@/app/_components/WorkspaceControls";
import type { ViewMode } from "@/types/report";

type Option = {
  value: string;
  label: string;
};

export function ReportControls({
  mode,
  setMode,
  cutoffDate,
  setCutoffDate,
  options,
  workbookName,
  onWorkbookUpload,
}: {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  cutoffDate: string;
  setCutoffDate: (date: string) => void;
  options: Option[];
  workbookName: string;
  onWorkbookUpload: (file: File) => void;
}) {
  return (
    <SourcePanel label="Report workbook">
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:gap-3">
        <a href="/data/example_progress.xlsx" download className={buttonClass}>
          Download Demo
        </a>

        <label className={`${buttonClass} cursor-pointer`}>
          Upload Excel
          <input
            type="file"
            accept=".xlsx"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onWorkbookUpload(file);
              e.target.value = "";
            }}
          />
        </label>

        <span className="col-span-2 min-w-0 break-words px-2 py-1 text-xs text-muted-foreground md:col-span-1 md:max-w-[320px] md:px-0">
          {workbookName}
        </span>

        <select
          aria-label="Reporting period"
          value={mode}
          onChange={(e) => setMode(e.target.value as ViewMode)}
          className={controlClass}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <select
          aria-label="Report cutoff"
          value={cutoffDate}
          onChange={(e) => setCutoffDate(e.target.value)}
          className={`${controlClass} min-w-0 md:min-w-[160px]`}
        >
          <option value="">Select cutoff</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </SourcePanel>
  );
}
