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

    // Allow selecting the same file again later.
    e.currentTarget.value = "";
  };

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
            </span>
            {sourceType === "default" ? " (default)" : " (uploaded)"}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onUseDefault}
            disabled={isLoading || sourceType === "default"}
            className="h-10 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 text-xs text-[color:var(--color-foreground)] shadow-[var(--shadow-input)] transition hover:opacity-90 disabled:opacity-50"
          >
            Use default
          </button>

          <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[color:var(--color-accent)] px-4 text-xs font-medium text-white shadow-[var(--shadow-input)] transition hover:brightness-110 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
            Upload Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              disabled={isLoading}
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-[color:var(--color-muted-foreground)]">
        Default file: <span className="font-mono">{defaultName}</span> • Upload
        is processed in browser only.
      </div>
    </section>
  );
}
