# Clarion Dashboard

The operations dashboard for engineering managers. React 19 + TypeScript + Vite,
styled with the Clarion design system.

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api to the backend on :5080)
```

`npm run typecheck` · `npm run build` · `npm run preview`

The dev server proxies `/api` to `http://localhost:5080` by default, so the app makes
same-origin requests and needs no CORS handling or base URL. Point it elsewhere with
`CLARION_API_URL`.

---

## Design system

The palette, type and surfaces are taken directly from the Clarion marketing site so
the product and the landing page read as one system.

| Token | Value | Used for |
|---|---|---|
| `base-900/800/700` | `#07090E` `#0B0F17` `#0F1420` | Page and sidebar grounds |
| `surface` / `surface-raised` | `#121824` / `#161D2B` | Panels, cards, hover states |
| `hairline` | `#1E293B` | Every border and divider |
| `cyan-clarion` | `#00F2FE` | Primary accent, focus, active nav |
| `violet-electric` | `#7000FF` | Second half of the one gradient |
| `ink` / `ink-muted` / `ink-faint` | `#F8FAFC` `#94A3B8` `#64748B` | Text hierarchy |

The dashboard adds one thing the landing page has no need for: **semantic status
colours** (`state-*` for board columns, `signal-*` for health), chosen to sit
correctly on the same dark surfaces.

Deliberate choices that make it read as enterprise software rather than a toy:

- **The gradient is rationed.** It appears on the logo and the single primary action
  per screen. Everywhere else earns attention with one accent colour.
- **Dense type ramp.** A `2xs` (11px) step and tabular numerals throughout, so
  tables and KPI rows stay scannable at real data volumes.
- **Hairline structure over shadows.** Depth comes from 1px borders and flat
  surfaces, which stays legible at high information density.
- **Status is a token, not a decision.** `lib/format/status.ts` owns every
  status → label + colour mapping, so a state can never look like two different
  things on two screens.
- **Badges mean "act on this".** Sidebar counters only ever show blocked work, live
  incidents and critical client issues — never neutral totals.

---

## Structure

```
src/
  lib/
    api/        http boundary, typed endpoints, shared types, cache keys
    hooks/      useDashboard + useDashboardMutation
    format/     dates, status/colour tokens, Markdown renderer
    cn.ts       class merge (last-wins, so caller classes beat component defaults)
  components/
    ui/         the design system: Button, Panel, Field, Modal, Table, StatCard, …
    layout/     AppShell, Topbar, PageHeader, capability notices
    brand/      the Clarion mark
  features/
    overview/ board/ standup/ sprints/ people/
    review/ incidents/ clients/ reports/ assistant/ settings/
```

### Data flow

Every screen reads one query — `GET /api/state` — and every write goes through
`useDashboardMutation`, which invalidates that query on success. A change made
anywhere (dragging a card, pasting a standup, asking the assistant) is reflected
everywhere, with no per-screen cache plumbing. State also refreshes every 30s and on
window focus.

`ApiError` carries the backend's `code`, which is how the UI distinguishes "this
integration isn't configured" from "this actually failed" and shows the exact
environment variable to set instead of a dead button.

## Screens

| Route | What it answers |
|---|---|
| `/` | Where does the team stand, and what needs me today |
| `/board` | Every tracked task — board or table, drag to change state, deep-linkable via `?task=` |
| `/standup` | Paste the morning updates, then audit exactly what Clarion changed |
| `/sprints` | Committed scope vs. dates, with live progress and Jira mirroring |
| `/people` | Load, momentum and risk per person |
| `/review` | The deterministic record: who touched what, and every deadline that moved |
| `/incidents` | Ranked incidents found in Slack |
| `/clients` | Per-client critical issues and commitments, promotable to tickets |
| `/reports` | AI weekly report, plus a print-ready team activity export |
| `/assistant` | Ask or instruct in plain language |
| `/settings` | Team, connections, audit log |
