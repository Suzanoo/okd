# OKD CM

Browser tools for BOQ analysis, keyword Query, progress reports and media.

## R3 visual closure candidate (after accepted R4)

R1–R4 are accepted and merged. The outstanding R3 Viewer/Query visual obligation
is implemented against R0 Option A: [visual closure runbook](docs/R3_VISUAL_CLOSURE.md).
R5 remains paused. All-page UX and resilient operation feedback are
documented in the [R4 runbook](docs/R4.md). Shared navigation and the Structured
Workspace design system remain documented in the [R3 runbook](docs/R3.md).
Workbook session behavior remains in the [R2 runbook](docs/R2.md). Input requirements, modes and
accepted security deferrals remain in the [R1 runbook](docs/R1.md).
This is an engineering candidate; no deployment or native-device acceptance
is implied.

```text
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm lint
```

Set the server environment `OKD_ACCESS_MODE=public`, then `pnpm build` and
`pnpm start`. Public mode requires no Supabase environment. Missing mode retains
authentication; see the runbook and `.env.example` before using that mode.

BOQ and Report uploads are read in the browser. The app does not upload project
workbooks to a server or persist them between page loads. Public downloads are
synthetic demos. `/boq` is the Viewer; `/query` searches the entire selected
sheet independently of Viewer navigation. Select a workbook once and use both
routes in the same tab. Refresh requires selecting it again; the synthetic
BOQ demo is an explicit choice. R4 clarifies Home tools, Report source and
variance/proxy feedback, Media fallback and export recovery without changing
calculations or shared workbook ownership. R5 is not included.

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, SheetJS and
jsPDF. Supabase is retained for authenticated rollback only. Verified with Node 24.19.0 and pnpm 11.25.0; pnpm 11 requires Node 22.13+.
