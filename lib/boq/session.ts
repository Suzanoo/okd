import { createStore } from "zustand/vanilla";
import { loadBoqWorkbook } from "./boqParse";
import type { BoqRow } from "./types";

export type SessionRow = BoqRow & { _id: string };
export type ViewerPath = (string | null)[];
export type QueryState = {
  input: string;
  matchMode: "all" | "any";
  error: string;
  page: number;
  applied: { q: string; mode: "all" | "any" } | null;
  removedIds: Set<string>;
  pendingRemoveIds: Set<string>;
  filters: { wbs1: string[]; wbs2: string[]; wbs3: string[]; wbs4: string[]; unit: string[] };
  viewMode: "detail" | "summary";
  summaryPage: number;
  summarySort: { key: "description" | "unit" | "qty" | "material" | "labor" | "amount" | "sourceRows"; order: "asc" | "desc" };
};
const initialQuery = (): QueryState => ({ input: "", matchMode: "all", error: "", page: 1, applied: null, removedIds: new Set(), pendingRemoveIds: new Set(), filters: {wbs1:[],wbs2:[],wbs3:[],wbs4:[],unit:[]}, viewMode: "detail", summaryPage: 1, summarySort: {key:"amount",order:"desc"} });
type Workbook = Awaited<ReturnType<typeof loadBoqWorkbook>>;
type State = {
  sourceName: string; sourceType: "none" | "default" | "upload";
  sheets: string[]; sheet: string; rows: SessionRow[];
  loading: boolean; pendingName: string; error: string;
  generation: number; revision: number; viewerPath: ViewerPath; viewerPage: number; query: QueryState;
};

/** Factory, never a server-wide singleton. No workbook bytes go to storage. */
export function createBoqSession(parse = loadBoqWorkbook) {
  let request = 0;
  let workbook: Workbook | null = null;
  const rowCache = new Map<string, SessionRow[]>();
  const store = createStore<State>(() => ({sourceName:"",sourceType:"none",sheets:[],sheet:"",rows:[],loading:false,pendingName:"",error:"",generation:0,revision:0,viewerPath:[null,null,null,null],viewerPage:1,query:initialQuery()}));
  function commitRows(sheet: string, rows: SessionRow[], source: Partial<State> = {}) {
    store.setState(s => ({...source,sheet, rows, loading:false, pendingName:"", error:"", revision:s.revision+1,viewerPath:[null,null,null,null],viewerPage:1,query:initialQuery()}));
  }
  async function load(name: string, sourceType: "default" | "upload", read: () => Promise<ArrayBuffer>) {
    const token = ++request;
    store.setState({loading:true,pendingName:name,error:""});
    try {
      const buffer = await read();
      if (token !== request) return;
      const next = await parse(buffer);
      if (token !== request) return;
      if (!next.sheets.length) throw new Error("No sheet has all required BOQ columns. Select a BOQ Studio workbook.");
      const sheet = next.sheets[0];
      const generation = store.getState().generation + 1;
      const rows = identifyRows(next.rowsForSheet(sheet), generation, sheet);
      if (token !== request) return;
      workbook = next;
      rowCache.clear(); rowCache.set(sheet, rows);
      commitRows(sheet, rows, {sourceName:name,sourceType,sheets:next.sheets,generation});
    } catch (e) {
      if (token !== request) return;
      const previous = store.getState().sourceName;
      store.setState({loading:false,pendingName:"",error:`Could not load ${name}. ${e instanceof Error ? e.message : "Invalid workbook."} ${previous ? `Still using ${previous}; your previous view and query are retained.` : "Select a workbook or use the synthetic demo."}`});
    }
  }
  function selectSheet(sheet: string) {
    if (store.getState().loading || sheet === store.getState().sheet) return;
    try {
      if (!workbook || !workbook.sheets.includes(sheet)) throw new Error("Select a valid BOQ sheet.");
      if (!rowCache.has(sheet)) rowCache.set(sheet, identifyRows(workbook.rowsForSheet(sheet),store.getState().generation,sheet));
      commitRows(sheet,rowCache.get(sheet)!);
    } catch (e) { store.setState({error:e instanceof Error ? e.message : "Could not read sheet. Previous sheet retained."}); }
  }
  function setQuery<K extends keyof QueryState>(key: K, value: QueryState[K] | ((old: QueryState[K]) => QueryState[K])) {
    store.setState(s => ({query:{...s.query,[key]: typeof value === "function" ? value(s.query[key]) : value}}));
  }
  return { ...store, load, selectSheet, setQuery, setViewerPath: (viewerPath: ViewerPath) => store.setState({viewerPath,viewerPage:1}) };
}

export function identifyRows(rows: BoqRow[], generation: number, sheet: string): SessionRow[] {
  return rows.map((row, index) => ({...row,_id:JSON.stringify([generation,sheet,index])}));
}

export function filterViewerRows(rows: SessionRow[], path: ViewerPath) {
  const keys = ["wbs1","wbs2","wbs3","wbs4"] as const;
  return rows.filter(row => keys.every((key,i) => path[i] === null || row[key] === path[i]));
}
