"use client";

import { useCallback, useMemo } from "react";
import type { SessionRow } from "@/lib/boq/session";
import { useQueryState } from "@/app/_providers/BoqSessionProvider";
import {
  buildDescriptionRegex,
  filterByDescription,
} from "@/lib/boq/query";

/** WorkingRow = row หลัง search + _id สำหรับ key/staging */
export type WorkingRow = SessionRow;

function amountGt0(r: SessionRow) {
  return (r.amount ?? 0) > 0;
}

export function useBoqQuery(rows: SessionRow[]) {

  // -------------------------
  // Draft UI state
  // -------------------------
  const [input, setInput] = useQueryState("input");
  const [matchMode, setMatchMode] = useQueryState("matchMode");
  const [error, setError] = useQueryState("error");

  // pagination lives here (QuerySection uses it)
  const [page, setPage] = useQueryState("page");

  // applied query (เมื่อ user กด Search)
  const [applied, setApplied] = useQueryState("applied");

  // apply removals (ลบจริงแล้ว) — เก็บเป็น ids
  const [removedIds, setRemovedIds] = useQueryState("removedIds");

  // staging pending remove (กด x)
  const [pendingRemoveIds, setPendingRemoveIds] = useQueryState("pendingRemoveIds");

  // highlight keywords (จาก draft input)
  const keywords = useMemo(
    () => input.trim().split(/\s+/).filter(Boolean),
    [input],
  );

  // -------------------------
  // Derived workingRows (NO setState in effect)
  // -------------------------
  const workingRows: WorkingRow[] = useMemo(() => {
    const base = rows.filter(amountGt0);

    // 1) initial view (ยังไม่กด Search) => Full accepted list
    if (!applied || !applied.q.trim()) {
      return base
        .filter((r) => !removedIds.has(r._id));
    }

    // 2) after Search
    const regex = buildDescriptionRegex(applied.q, applied.mode);
    if (!regex) return [];

    // note: filterByDescription robust/ปลอดภัยอยู่แล้ว (ถ้าแก้ r.description ?? "" ใน lib)
    const searched = filterByDescription(base, regex);

    return searched
      .filter((r) => !removedIds.has(r._id));
  }, [rows, applied, removedIds]);

  // -------------------------
  // Actions
  // -------------------------
  const clearPending = useCallback(() => {
    setPendingRemoveIds(new Set());
  }, [setPendingRemoveIds]);

  const togglePending = useCallback((id: string) => {
    setPendingRemoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [setPendingRemoveIds]);

  /**
   * Search:
   * - reset error/page/pending
   * - set applied query (derived rows จะคำนวณเอง)
   * - ถ้า input ว่าง => แสดงรายการที่ยังไม่ถูกตัดออกทั้งหมด
   */
  const onSearch = useCallback(() => {
    setError("");
    setPage(1);
    setPendingRemoveIds(new Set());

    const q = input.trim();
    if (!q) {
      setApplied(null); // กลับไป initial view (all remaining rows)
      return;
    }

    // validate regex early เพื่อ set error ให้ user
    try {
      const r = buildDescriptionRegex(q, matchMode);
      if (!r) {
        setApplied(null);
        return;
      }
      setApplied({ q, mode: matchMode });
    } catch {
      setError("Invalid search pattern");
      setApplied(null);
    }
  }, [input, matchMode, setError, setPage, setPendingRemoveIds, setApplied]);

  /**
   * Apply pending removals:
   * - add ids เข้า removedIds
   * - clear pending ids ที่ apply แล้ว
   * - clamp page ให้ caller ส่ง newTotalPages มา
   */
  const applyPendingRemovals = useCallback(
    (applyIds: Set<string>, newTotalPages: number) => {
      if (applyIds.size === 0) return;

      setPage((p) => Math.min(p, Math.max(1, newTotalPages)));

      setRemovedIds((prev) => {
        const next = new Set(prev);
        for (const id of applyIds) next.add(id);
        return next;
      });

      setPendingRemoveIds((prev) => {
        const next = new Set(prev);
        for (const id of applyIds) next.delete(id);
        return next;
      });
    },
    [setPage, setRemovedIds, setPendingRemoveIds],
  );

  return {
    // state
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

    // actions
    onSearch,
    togglePending,
    clearPending,
    applyPendingRemovals,
  };
}
