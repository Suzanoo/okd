# OKD CM

Browser tools for BOQ analysis, keyword Query, progress reports and media.

## R1 release candidate

Current implementation, input requirements, security decisions and verification:
[R1 runbook](docs/R1.md). Engineering candidate for Coordinator/PO review;
deployment and native Excel acceptance have not been performed.

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
synthetic demos. Query remains part of BOQ. Structured Workspace is a future
design direction; R2 and full UI redesign are not implemented.

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, SheetJS and
jsPDF. Supabase is retained for authenticated rollback only. Use Node 20.9+
(verified Node 24.19.0) and pnpm; this candidate was verified with pnpm 11.25.0.
