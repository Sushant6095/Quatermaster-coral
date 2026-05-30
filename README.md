# Quartermaster

> Local-first SaaS audit agent. Federated SQL across your tools. No ETL, no warehouse.

[![Track 1 — Best Enterprise Agent](https://img.shields.io/badge/Track%201-Best%20Enterprise%20Agent-E4B66B?style=flat-square)](https://wemakedevs.org/hackathons/coral)
[![Built on Coral](https://img.shields.io/badge/Built%20on-Coral-5BD2C7?style=flat-square)](https://withcoral.com)
[![Powered by Claude Sonnet 4.6](https://img.shields.io/badge/Powered%20by-Claude%20Sonnet%204.6-FF7A6B?style=flat-square)](https://www.anthropic.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-A8E063?style=flat-square)](#license)

Quartermaster joins your HRIS, identity provider, code platform, chat, and billing into a single SQL query — and turns the answers into Slack-ready remediations. Everything runs on your laptop. PII never leaves.

![Cockpit](docs/screenshots/cockpit.png)

---

## The problem

Every company has zombie SaaS access. People leave, contractors wrap up, and their GitHub admin, Okta sessions, paid Linear seats, and Slack workspace ownership quietly stay live. Tools like BetterCloud and Torii solve this — for $50k/year, a multi-tenant cloud warehouse, and a procurement cycle.

Quartermaster is the same audit surface, built on a federated query engine you run locally. No warehouse. No ETL. No vendor reviewing your employee directory. Pull a token, run a query, ship a finding.

## The product

**Quartermaster is a Next.js 15 app and a Node orchestrator.** The orchestrator talks to [Coral](https://withcoral.com) over MCP. Coral talks to your sources — Deel, Okta, GitHub, Slack, Stripe — and lets you join them at query time with regular SQL. Quartermaster sits on top of that and ships five named audits as opinionated, pre-written SQL.

**The audit is a SQL statement, not a service.** Every finding is reproducible from the query and the source data. You can paste the SQL into the Playground and step through it. There are no hidden microservices, no streaming pipelines, no scheduler in the cloud.

**Claude Sonnet 4.6 drives the conversation.** Claude is the SQL author for the natural-language Copilot, the narrator for findings, and the drafter for Slack/Jira remediation. Claude never sees your raw rows — only column names and aggregate counts — because the SQL does the joins and Coral keeps the data local.

![Audit Run](docs/screenshots/audit-run.png)

## The five killer features

- **QM Copilot.** Hit `⌘J`. Type *"who left in the last 30 days and still has GitHub commits?"* — Claude compiles federated SQL using Coral's schema catalog as grounding, runs it, and narrates the result in 1.4 seconds.
- **Continuous Mode.** A 30-second tick polls every source, diffs against the last run, and surfaces new findings in a live feed. Flip a Deel record to `terminated` and the Cockpit blinks within five seconds.
- **Blast Radius.** Click one zombie account and see the force-directed graph of every system it touches — repos, secrets, channels, paid seats. Coral handles the reachability CTE; React Flow handles the render.
- **Quartermaster-as-MCP-Server.** Quartermaster speaks MCP back out. `claude mcp add quartermaster -- npx tsx mcp-server/index.ts` lands three tools — `run_audit`, `get_findings`, `draft_remediation` — in any MCP-aware client.
- **Schema Graph.** Every connected source as a swimlane, with auto-detected join keys drawn between tables. Click two columns, hit *Generate SQL*, and a starter JOIN drops into the Playground.

## Quickstart

```bash
# 1. Clone
git clone https://github.com/quartermaster/quartermaster.git
cd quartermaster

# 2. Install
pnpm install

# 3. Install Coral and isolate the workspace
brew install withcoral/tap/coral
export CORAL_CONFIG_DIR=./.coral-workspace

# 4. Add your sources (use real tokens or skip and use fixtures mode)
coral source add github
coral source add slack
coral source add okta
coral source add stripe
coral source add --file ./sources/deel/manifest.yaml

# 5. Drop in your Anthropic key
cp .env.example .env.local
# then edit .env.local

# 6. Run
pnpm dev
```

Open `http://localhost:3000`. The Cockpit greets you.

### Register Quartermaster as an MCP server

```bash
claude mcp add quartermaster -- npx tsx /absolute/path/to/quartermaster/mcp-server/index.ts
```

Restart Claude Code. Three new tools appear: `run_audit`, `get_findings`, `draft_remediation`. Try:

> *"Use Quartermaster to check for offboarded contractors with active GitHub admin, then draft Jira tickets for the P0s."*

## Demo mode

You don't need real source tokens to see the full app.

```bash
pnpm demo
```

This sets `QM_FIXTURES=on` and boots `next dev`. Every Coral call is intercepted and answered from `fixtures/`. The Copilot, the audits, the Live feed, the Blast Radius, the MCP server — all behave like the real thing. Useful for offline development, judge demos, and the inevitable conference Wi-Fi.

## The five audits

| ID    | Audit                  | Sources                                  | Question                                                                                  |
| ----- | ---------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| QM-01 | Zombie Account Hunter  | Deel, Okta, GitHub, Slack                | Which inactive employees still hold active accounts, write access, or admin roles?       |
| QM-02 | Permission Drift       | GitHub, Slack, Linear, Deel              | Which active employees hold elevated permissions they haven't used in 90+ days?           |
| QM-03 | Ghost-Seat Spend       | Stripe, GitHub, Slack, Linear            | Which paid seats have zero activity in the last 30 days, in $/mo?                        |
| QM-04 | Shadow-IT Detector     | Stripe, Slack, Deel                      | Which Stripe charges are off the approved-vendor list, and which Slack channels mention them? |
| QM-05 | Compliance Ledger      | Deel, Okta, GitHub, Slack, Linear        | Per terminated employee: when each platform was deprovisioned. SOC2 PDF export.          |

Each audit is one SQL statement. Browse them in [`src/lib/audits/`](src/lib/audits/).

A taste — QM-01, simplified:

```sql
WITH offboarded AS (
  SELECT person_id, work_email, terminated_at
  FROM deel.directory
  WHERE is_active = false
    AND terminated_at > NOW() - INTERVAL '90 days'
),
still_admin AS (
  SELECT gh.email, gh.role, repos.name AS repo
  FROM github.members gh
  JOIN github.repo_collaborators rc ON rc.user_email = gh.email
  JOIN github.repos repos ON repos.id = rc.repo_id
  WHERE rc.permission IN ('admin', 'maintain')
)
SELECT o.work_email, o.terminated_at,
       array_agg(DISTINCT s.repo) AS repos,
       max(s.role) AS gh_role
FROM offboarded o
JOIN still_admin s ON s.email = o.work_email
GROUP BY o.work_email, o.terminated_at
ORDER BY o.terminated_at DESC;
```

One query. Five sources. 1.4 seconds.

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  QUARTERMASTER UI  (Next.js 15, React 19, Tailwind v4)                 │
│  Cockpit · Copilot · Audits · Findings · Blast · Ledger · Schema · SQL │
└──────────────┬──────────────────────────────┬──────────────────────────┘
               │ HTTP / SSE                   │ HTTP
               ▼                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  QUARTERMASTER ORCHESTRATOR  (Node 22 / Bun-compatible)                │
│   ┌──────────────┐ ┌────────────────┐ ┌────────────────────────────┐   │
│   │ Audit        │ │ Continuous     │ │ MCP server façade          │   │
│   │ registry     │ │ loop + diff    │ │ run_audit / get_findings / │   │
│   │ + scheduler  │ │ (SSE)          │ │ draft_remediation          │   │
│   └──────────────┘ └────────────────┘ └────────────────────────────┘   │
│   ┌──────────────┐ ┌────────────────┐ ┌────────────────────────────┐   │
│   │ Copilot      │ │ Blast Radius   │ │ Schema graph indexer       │   │
│   │ NL → SQL     │ │ reachability   │ │ auto-detect join keys      │   │
│   │ + validator  │ │ CTE chain      │ │ → SQLite catalog           │   │
│   └──────────────┘ └────────────────┘ └────────────────────────────┘   │
│   Evidence packager · Remediation drafter · Audit log (better-sqlite3) │
└──────────────┬──────────────────────────────┬──────────────────────────┘
               │ MCP (stdio)                  │ Anthropic SDK
               ▼                              ▼
   ┌─────────────────────────────┐ ┌─────────────────────────────────┐
   │ CORAL  (coral mcp-stdio)    │ │ CLAUDE  (Sonnet 4.6)            │
   │  Apache DataFusion          │ │  - SQL author (Copilot)         │
   │  + source manifests         │ │  - Finding narrator             │
   │  + local schema + cache     │ │  - Remediation drafter          │
   └─────────────────────────────┘ └─────────────────────────────────┘
               ▲   ▲   ▲   ▲   ▲
               │   │   │   │   │
            ┌──┴┐ ┌┴─┐ ┌┴─┐ ┌┴─┐ ┌┴────┐
            │Deel│ │Okta│ │GH │ │Slk│ │Stripe│
            │ ✦ │ └───┘ └───┘ └───┘ └─────┘
            └────┘   (✦ custom source spec — Chart New Waters bounty)
```

See [`docs/architecture.md`](docs/architecture.md) for the long form.

## Bounty trail

| Bounty                          | Status                  | Deliverable                                      | Submission           |
| ------------------------------- | ----------------------- | ------------------------------------------------ | -------------------- |
| Track 1 — Best Enterprise Agent | shipping                | Working repo + 3-min video                       | `<submission link>`  |
| Chart New Waters — Source Spec  | submitted               | `sources/deel/manifest.yaml`                     | `<PR link>`          |
| Captain's Log — Build Guide     | drafted                 | `docs/captains-log.md`, blog post                | `<blog link>`        |
| Tell the Tale — Discord/Social  | scheduled               | Discord #show-and-tell + LinkedIn/X w/ @withcoral | `<thread link>`      |

See [`docs/bounty-strategy.md`](docs/bounty-strategy.md) for owners and odds.

## Repository layout

```
src/
  app/                  Next.js App Router pages (cockpit, audits, findings, ...)
  components/           UI primitives + screen-level components
  lib/
    audits/             Five named audits — SQL templates + registry
    claude/             Anthropic SDK wrappers (sql-author, narrator, drafter)
    coral/              MCP client + schema catalog
    fixtures/           Demo seed data (QM_FIXTURES=on)
    db/                 better-sqlite3 schemas (audit history, ledger)
    types/              Shared TypeScript types
mcp-server/             Quartermaster as MCP server (3 tools)
sources/deel/           Custom Coral source spec
fixtures/               JSON seed for offline / demo mode
docs/                   Demo script, Captain's Log, architecture, bounty plan
```

## Brand

Dark theme only. Tokens in [`src/styles/globals.css`](src/styles/globals.css):

| Token              | Hex       | Use                              |
| ------------------ | --------- | -------------------------------- |
| `--color-bg`       | `#070E1A` | App background                   |
| `--color-surface`  | `#0F1A2E` | Left rail, top bar               |
| `--color-card`     | `#13213A` | Cards                            |
| `--color-border`   | `#22324F` | Hairlines                        |
| `--color-text`     | `#E8EEF7` | Body                             |
| `--color-text-muted` | `#9AA7BD` | Captions                       |
| `--color-gold`     | `#E4B66B` | Brand primary, buttons, numbers  |
| `--color-coral`    | `#FF7A6B` | P0, danger                       |
| `--color-sea`      | `#5BD2C7` | P1, SQL keywords, info           |
| `--color-lime`     | `#A8E063` | P2 inverse, success              |

Type: Geist sans + Geist mono. Radii: 6 / 10 / 999. Spacing scale: 4/8/12/16/24/32/48/64/96.

Never inline hex. Always reference the CSS variable.

## Behaviors

- **Local-first.** No third-party warehouse, no telemetry, nothing phones home.
- **Read-only.** The agent never executes destructive ops. Remediation is drafted; humans approve.
- **Reproducible.** Every finding is regenerable from its SQL plus the source rows.
- **Offline-capable.** `pnpm demo` makes the full app work on conference Wi-Fi.

## Scripts

| Script                | What it does                                                        |
| --------------------- | ------------------------------------------------------------------- |
| `pnpm dev`            | Next.js dev server with Turbopack.                                  |
| `pnpm demo`           | Same, with `QM_FIXTURES=on`. No real tokens needed.                 |
| `pnpm build`          | Production build.                                                   |
| `pnpm start`          | Production server.                                                  |
| `pnpm lint`           | ESLint via `next lint`.                                             |
| `pnpm typecheck`      | `tsc --noEmit`.                                                     |
| `pnpm mcp-server`     | Start the Quartermaster MCP server over stdio.                      |

## Environment

Copy `.env.example` to `.env.local` and fill in.

```bash
ANTHROPIC_API_KEY=sk-ant-...
CORAL_CONFIG_DIR=./.coral-workspace
QM_STATE_DB=./.qm-state.db
DEEL_API_TOKEN=
OKTA_API_TOKEN=
GITHUB_TOKEN=
SLACK_BOT_TOKEN=
STRIPE_SECRET_KEY=
QM_FIXTURES=on
QM_CONTINUOUS_INTERVAL=30
```

Missing source tokens? Set `QM_FIXTURES=on` and every audit will run against the bundled JSON in `fixtures/`.

## Team

Built for the *Pirates of the Coral-bean* hackathon (May 27 – May 31, 2026).

- **Code** — orchestrator, Coral integration, MCP server, Deel spec.
- **Design/FE** — Cockpit, Audit Run, Finding Detail, Blast Radius, Schema Graph.

## Documentation

- [Architecture](docs/architecture.md) — what every layer does.
- [Demo script](docs/demo-script.md) — the 3-minute beat-by-beat.
- [Captain's Log](docs/captains-log.md) — the build-guide blog draft.
- [Bounty strategy](docs/bounty-strategy.md) — what we're going for and why.
- [MCP server](mcp-server/README.md) — registering Quartermaster as MCP.
- [Deel source spec](sources/deel/README.md) — the Chart New Waters submission.

## License

MIT. See [LICENSE](LICENSE).

Coral is the query layer. Quartermaster is what you build on top of it.
