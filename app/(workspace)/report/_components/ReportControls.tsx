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
  const controlClass =
    "h-11 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none";
  const buttonClass =
    "inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-surface-2";

  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-2 shadow-card md:w-auto">
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:gap-3">
        <a href="/data/example_progress.xlsx" download className={buttonClass}>
          Download Demo
        </a>

        <label className={`${buttonClass} cursor-pointer`}>
          Upload Excel
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onWorkbookUpload(file);
              e.target.value = "";
            }}
          />
        </label>

        <span className="col-span-2 min-w-0 truncate px-2 py-1 text-xs text-muted-foreground md:col-span-1 md:max-w-[220px] md:px-0">
          {workbookName}
        </span>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as ViewMode)}
          className={controlClass}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <select
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
    </div>
  );
}
