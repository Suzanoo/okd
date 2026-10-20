"use client";

import { APP_NAME } from "@/config/app.config";
import { useMemo } from "react";
import { useBoqSession, useBoqState } from "@/app/_providers/BoqSessionProvider";
import BoqWorkspaceSource from "@/app/_components/BoqWorkspaceSource";
import { sumBy } from "@/lib/boq/boqTransform";
import { filterViewerRows } from "@/lib/boq/session";
import PieAmountCard from "./cards/PieAmountCard";
import BarAmountCard from "./cards/BarAmountCard";
import WBSSelect from "./controls/WBSSelect";
import ViewerRows from "./ViewerRows";
import ViewerTree from "./ViewerTree";

export default function BOQClient() {
  const state = useBoqState(), session = useBoqSession();
  const { rows, sourceName, sheet: selectedSheet, loading: isLoading, viewerPath } = state;
  const [wbs1,wbs2,wbs3,wbs4] = viewerPath;
  const resetCascade = () => session.setViewerPath([null,null,null,null]);
  const select = (level: number, value: string | null) => session.setViewerPath(viewerPath.map((v,i) => i < level ? v : i === level ? value : null));
  const setWBS1 = (v: string | null) => select(0,v);
  const setWBS2 = (v: string | null) => select(1,v);
  const setWBS3 = (v: string | null) => select(2,v);
  const setWBS4 = (v: string | null) => select(3,v);
  const rowsWBS1 = useMemo(() => rows, [rows]);
  const rowsWBS2 = useMemo(() => filterViewerRows(rows, [wbs1,null,null,null]), [rows, wbs1]);
  const rowsWBS3 = useMemo(
    () => filterViewerRows(rows, [wbs1,wbs2,null,null]),
    [rows, wbs1, wbs2],
  );
  const rowsWBS4 = useMemo(
    () => filterViewerRows(rows, [wbs1,wbs2,wbs3,null]),
    [rows, wbs1, wbs2, wbs3],
  );
  const rowsDesc = useMemo(
    () => filterViewerRows(rows, viewerPath),
    [rows, viewerPath],
  );

  const pieWBS1 = useMemo(() => sumBy(rowsWBS1, (r) => r.wbs1), [rowsWBS1]);

  const barWBS2 = useMemo(() => {
    if (wbs1 === null) return [];
    return sumBy(rowsWBS2, (r) => r.wbs2);
  }, [rowsWBS2, wbs1]);

  const barWBS3 = useMemo(() => {
    if (wbs1 === null || wbs2 === null) return [];
    return sumBy(rowsWBS3, (r) => r.wbs3);
  }, [rowsWBS3, wbs1, wbs2]);

  const barWBS4 = useMemo(() => {
    if (wbs1 === null || wbs2 === null || wbs3 === null) return [];
    return sumBy(rowsWBS4, (r) => r.wbs4);
  }, [rowsWBS4, wbs1, wbs2, wbs3]);

  const barDesc = useMemo(() => {
    if (wbs1 === null || wbs2 === null || wbs3 === null || wbs4 === null) return [];
    return sumBy(rowsDesc, (r) => r.description);
  }, [rowsDesc, wbs1, wbs2, wbs3, wbs4]);

  const wbs1Options = useMemo(() => pieWBS1.map((d) => d.name), [pieWBS1]);
  const wbs2Options = useMemo(() => barWBS2.map((d) => d.name), [barWBS2]);
  const wbs3Options = useMemo(() => barWBS3.map((d) => d.name), [barWBS3]);
  const wbs4Options = useMemo(() => barWBS4.map((d) => d.name), [barWBS4]);

  const C_WBS2 = "hsl(217 91% 60%)";
  const C_WBS3 = "hsl(160 84% 39%)";
  const C_WBS4 = "hsl(262 83% 58%)";
  const C_DESC = "hsl(25 95% 53%)";

  const cardBase =
    "rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[var(--shadow-card)]";
  const cardPad = "px-6 py-5";
  const muted = "text-[color:var(--color-muted-foreground)]";
  const fg = "text-[color:var(--color-foreground)]";

  const pill =
    "rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs text-[color:var(--color-foreground)]";

  const btnGhost =
    "rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs text-[color:var(--color-foreground)] transition hover:opacity-90";

  return (
    <main className="min-h-screen bg-[color:var(--color-background)]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <header className={`${cardBase} ${cardPad}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={`text-xs font-medium ${muted}`}>
                {APP_NAME} • Construction Management
              </p>
              <h1 className={`text-2xl font-semibold ${fg}`}>BOQ Viewer</h1>
              <p className={`mt-1 text-sm ${muted}`}>
                Budget structure overview → drill down by WBS
              </p>
            </div>

            <div className={`text-xs ${muted}`}>
              Source: <span className={`font-medium ${fg}`}>{sourceName}</span>
              {selectedSheet ? (
                <>
                  {" "}
                  • Sheet:{" "}
                  <span className={`font-medium ${fg}`}>{selectedSheet}</span>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <BoqWorkspaceSource />
        {selectedSheet && !isLoading && <>
        <ViewerTree rows={rows} path={viewerPath} onSelect={session.setViewerPath} />
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
          <div className={`text-xs ${muted}`}>Current filter</div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={pill}>WBS-1: {wbs1 ?? "All"}</span>
            <span className={pill}>WBS-2: {wbs2 ?? "All"}</span>
            <span className={pill}>WBS-3: {wbs3 ?? "All"}</span>
            <span className={pill}>WBS-4: {wbs4 ?? "All"}</span>

            <button
              type="button"
              onClick={resetCascade}
              className={`ml-auto ${btnGhost}`}
            >
              Clear all
            </button>
          </div>

          <div className={`mt-2 text-[11px] ${muted}`}>
            Tip: เลือก dropdown เพื่อ cascade → กราฟจะ render
            เฉพาะระดับที่เลือกแล้ว
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <PieAmountCard
            title="WBS-1"
            subtitle="Overview by WBS-1"
            data={pieWBS1}
            selected={wbs1}
            onSelect={(name) => setWBS1(name)}
            onClear={() => setWBS1(null)}
          />

          <BarAmountCard
            title="WBS-2"
            subtitle={
              wbs1 ? `Filtered by WBS-1 = ${wbs1}` : "Select WBS-1 to render"
            }
            data={barWBS2}
            color={C_WBS2}
            disabled={wbs1 === null}
            disabledHint="เลือก WBS-1 ก่อน เพื่อแสดง Bar ของ WBS-2"
            topControl={
              <WBSSelect
                label="Select"
                value={wbs1}
                options={wbs1Options}
                placeholder="(Choose WBS-1)"
                onChange={setWBS1}
                disabled={isLoading || wbs1Options.length === 0}
              />
            }
            onSelect={(name) => setWBS2(name)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BarAmountCard
            title="WBS-3"
            subtitle={
              wbs2 ? `Filtered by WBS-2 = ${wbs2}` : "Select WBS-2 to render"
            }
            data={barWBS3}
            color={C_WBS3}
            disabled={wbs1 === null || wbs2 === null}
            disabledHint="เลือก WBS-1 และ WBS-2 ก่อน เพื่อแสดง Bar ของ WBS-3"
            topControl={
              <WBSSelect
                label="Select"
                value={wbs2}
                options={wbs2Options}
                placeholder="(Choose WBS-2)"
                onChange={setWBS2}
                disabled={wbs1 === null || isLoading || wbs2Options.length === 0}
              />
            }
            onSelect={(name) => setWBS3(name)}
          />

          <BarAmountCard
            title="WBS-4"
            subtitle={
              wbs3 ? `Filtered by WBS-3 = ${wbs3}` : "Select WBS-3 to render"
            }
            data={barWBS4}
            color={C_WBS4}
            disabled={wbs1 === null || wbs2 === null || wbs3 === null}
            disabledHint="เลือก WBS-1, WBS-2, WBS-3 ก่อน เพื่อแสดง Bar ของ WBS-4"
            topControl={
              <WBSSelect
                label="Select"
                value={wbs3}
                options={wbs3Options}
                placeholder="(Choose WBS-3)"
                onChange={setWBS3}
                disabled={wbs2 === null || isLoading || wbs3Options.length === 0}
              />
            }
            onSelect={(name) => setWBS4(name)}
          />
        </div>

        <section className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 shadow-[var(--shadow-card)]">
          <BarAmountCard
            title="Description Amount"
            subtitle="Final level"
            data={barDesc}
            color={C_DESC}
            height={300}
            disabled={wbs1 === null || wbs2 === null || wbs3 === null || wbs4 === null}
            disabledHint="เลือก WBS-1 → WBS-2 → WBS-3 → WBS-4 ก่อน เพื่อแสดง Description"
            topControl={
              <WBSSelect
                label="Select"
                value={wbs4}
                options={wbs4Options}
                placeholder="(Choose WBS-4)"
                onChange={setWBS4}
                disabled={wbs3 === null || isLoading || wbs4Options.length === 0}
              />
            }
          />
        </section>

        <ViewerRows rows={rowsDesc} />
        </> }
      </div>
    </main>
  );
}
