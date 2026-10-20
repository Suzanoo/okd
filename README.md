# OKD CM

Browser tools for BOQ analysis, keyword Query, progress reports and media.

## R2 engineering candidate

R1 is accepted and merged. Independent BOQ Viewer and Query workflows are
implemented in R2: [R2 runbook](docs/R2.md). Input requirements, modes and
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
BOQ demo is now an explicit choice. Structured Workspace and full UI redesign
remain future work.

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, SheetJS and
jsPDF. Supabase is retained for authenticated rollback only. Verified with Node 24.19.0 and pnpm 11.25.0; pnpm 11 requires Node 22.13+.
