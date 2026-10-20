"use client";

import type React from "react";

type SourceType = "default" | "upload";

type Props = {
  sourceType: SourceType;
  sourceName: string;
  defaultName: string;
  isLoading?: boolean;
  onUseDefault: () => void;
  onUpload: (file: File) => void;
};

const DEFAULT_BOQ_PATH = "/boq/example_boq.xlsx";

export default function BoqSourcePicker({
  sourceType,
  sourceName,
  defaultName,
  isLoading,
  onUseDefault,
  onUpload,
}: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onUpload(file);
    e.currentTarget.value = "";
  };

  const cardBtn =
    "inline-flex h-10 items-center justify-center rounded-xl border border-[color:var(--color-border)] " +
    "bg-[color:var(--color-surface-2)] px-4 text-xs font-medium text-[color:var(--color-foreground)] " +
    "shadow-[var(--shadow-input)] transition hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 " +
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

  return (
    <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-medium text-[color:var(--color-muted-foreground)]">
            BOQ Source
          </div>

          <div className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
            Current:{" "}
            <span className="font-medium text-[color:var(--color-foreground)]">
              {sourceName}
            </span>{" "}
            {sourceType === "default" ? "(synthetic demo)" : "(uploaded)"}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <a href={DEFAULT_BOQ_PATH} download={defaultName} className={cardBtn}>
            Download Demo
          </a>

          <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[color:var(--color-accent)] px-4 text-xs font-medium text-white shadow-[var(--shadow-input)] transition hover:-translate-y-[1px] hover:shadow-md hover:brightness-110 active:translate-y-0 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:disabled]:hover:translate-y-0">
            Upload Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              disabled={isLoading}
              onChange={handleFileChange}
            />
          </label>

          <button
            type="button"
            onClick={onUseDefault}
            disabled={isLoading || sourceType === "default"}
            className={cardBtn}
          >
            Reset to Demo
          </button>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-[color:var(--color-muted-foreground)]">
        Synthetic demo: <span className="font-mono">{defaultName}</span> • Upload is
        processed in browser only.
      </div>
    </section>
  );
}
