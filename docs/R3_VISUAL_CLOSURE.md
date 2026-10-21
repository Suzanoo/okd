# R3 visual closure — Structured Workspace Option A

Baseline: accepted R4 main `dcd30bff475fd7cbe46b61b041df00ecac787901`.
This closes the outstanding R3 Viewer/Query layout obligation. R5 stays paused.
Reference: R0 UI Design Proposal, Refresh Milestone Proposal, interactive preview,
design comparison and Option A visuals 01–05, 14, 17 and 18.

## Presentation and preserved contracts

At desktop widths (1024px and above), Viewer has a persistent 240px WBS rail,
breadcrumbs, shared source/sheet controls, selected Amount/source-row/scope KPIs,
one compact horizontal chart beside the Query link, and a read-only items table.
Selecting a parent clears lower levels through the existing session implementation.
The rail and chart scroll locally when long. Every chart group remains available.

The chart uses the existing `sumBy` grouping at the next WBS level (Description
at a complete path), stored Amounts and existing grouped-total percentages. It
does not infer the mockup's illustrative work-type categories. Blank labels are
still omitted by the existing chart grouping; explicit copy distinguishes the
named-group denominator from the complete selected total. The rail calls blank
WBS values “Unassigned” and still lets users select those source rows.

Query places Description search, Match All/Any, filter chips and a filter sheet
beside whole-result Amount and quantity-by-unit information. Detail/Summary,
exports, exclusions and paginated results occupy the full-width panel below.
Filter-sheet changes apply immediately, using the same existing state/cascade
as table-header filters. Exclusions still require Apply and retain Undo.
Viewer selections never restrict Query; both use one tab-local workbook session.

Below 1024px WBS uses a modal sheet. At 700px and below both workflows present
item cards; every accepted field remains available through All item fields.
Summary cards retain Material, Labor, source-row count and all seven sort keys.
Show full table exposes the existing keyboard-scrollable table and its controls.
Pagination is shared with the original table. No row identity is regenerated.

Sheets use native modal dialogs, keyboard containment, Escape, focus return,
backdrop dismissal and scroll restoration. The mobile WBS sheet closes on a
desktop resize. Existing R3 System/Light/Dark preference and navigation remain.

R0 composition is the target, not pixel identity. Extra accepted controls and
all ten detail columns remain; local Sarabun typography and Report naming remain.
Amounts are labelled as supplied, because the input contract does not establish
currency. No mockup-only field, money conversion or calculation is introduced.
Report/Progress, Media, authorization, parsers, export code and dependencies are
unchanged. Existing R1 security deferrals remain; this is not a fresh security audit.

## Reproducible verification

Use a disposable local directory containing the baseline plus the manifest delta,
without secret environment files. Node 24.19.0 and pnpm 11.25.0 were used.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm lint
OKD_ACCESS_MODE=authenticated NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:43999 NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-test-anon NEXT_TELEMETRY_DISABLED=1 pnpm build
node tests/auth-smoke.cjs
```

Remove Supabase variables before the public build. Do not use production values.

```sh
OKD_ACCESS_MODE=public NEXT_TELEMETRY_DISABLED=1 pnpm build
pnpm exec playwright install chromium
pnpm test:browser
VISUAL_OUTPUT=/tmp/okd-after node tests/visual-capture.cjs
VISUAL_OUTPUT=/tmp/okd-after node tests/visual-closure.cjs
```

`TEST_CHROMIUM_PATH` may point to an installed Chromium executable. Browser suites
start their own local servers on 3187, 3190, 3193, 3194, 3196; capture uses 3195.
Do not run builds and browser suites concurrently. Auth smoke uses 3188 and a
synthetic local backend on 43999. No live account or production backend is used.

The original suites cover Thai/English Any/All, filters, grouping, exclusions,
pagination, replacement/races, CSV/PDF limits and contents, theme/navigation,
Report/Media regression and Public/Auth boundaries. Visual closure adds measured
desktop composition at 1024/1440, mobile sheets/cards at 360/390, tablet 768,
keyboard/focus checks, known R0 synthetic totals, chart-share reconciliation,
blank WBS handling and mobile 20+6 pagination. All-page R3 checks cover 360,
390, 768 and 1440 in both themes. Captures use only a synthetic six-row fixture.

To reproduce before images, run `visual-capture.cjs` and `visual-fixture.cjs`
against an unmodified baseline build in a separate disposable directory. Use
the same browser, fixture, 1440/390 widths and Light/Dark preferences. After
images use the candidate. Sheet images use viewport capture; pages use full-page.
The handoff includes logs and a reference-by-reference visual checklist.

Headless Chromium checks are Engineering Acceptance, not native Windows/macOS,
Safari, physical-device or screen-reader acceptance. No deployment is claimed.
Coordinator reviews the package first; PO only confirms visual alignment with
the already-selected Option A. Integration remains Coordinator-owned.
