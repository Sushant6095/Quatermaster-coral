# Architecture

*Quartermaster v2 — the local-first SaaS audit agent.*

## Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  QUARTERMASTER UI  (Next.js 15, React 19, Tailwind v4, shadcn/ui)      │
│  Cockpit · Copilot · Audits · Findings · Blast · Ledger · Schema · SQL │
└──────────────┬──────────────────────────────┬──────────────────────────┘
               │ HTTP / SSE                   │ HTTP
               ▼                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  QUARTERMASTER ORCHESTRATOR  (Node 22 / Bun-compatible)                │
│                                                                        │
│   ┌──────────────┐  ┌────────────────┐  ┌──────────────────────────┐   │
│   │ Audit        │  │ Continuous     │  │ MCP server façade        │   │
│   │ registry     │  │ loop + diff    │  │ exposes:                 │   │
│   │ + scheduler  │  │ engine (SSE)   │  │  run_audit               │   │
│   │              │  │                │  │  get_findings            │   │
│   │              │  │                │  │  draft_remediation       │   │
│   └──────────────┘  └────────────────┘  └──────────────────────────┘   │
│                                                                        │
│   ┌──────────────┐  ┌────────────────┐  ┌──────────────────────────┐   │
│   │ Copilot      │  │ Blast Radius   │  │ Schema graph indexer     │   │
│   │ NL → SQL     │  │ reachability   │  │ auto-detect join keys    │   │
│   │ + validator  │  │ CTE chain      │  │ → SQLite catalog         │   │
│   └──────────────┘  └────────────────┘  └──────────────────────────┘   │
│                                                                        │
│   Evidence packager · Remediation drafter · Audit log (better-sqlite3) │
└──────────────┬──────────────────────────────┬──────────────────────────┘
               │ MCP (stdio)                  │ Anthropic SDK
               ▼                              ▼
   ┌─────────────────────────────┐  ┌─────────────────────────────────┐
   │ CORAL  (coral mcp-stdio)    │  │ CLAUDE  (Sonnet 4.6)            │
   │  Apache DataFusion          │  │  - SQL author (Copilot)         │
   │  + source manifests         │  │  - Finding narrator             │
   │  + local schema + cache     │  │  - Remediation drafter          │
   └─────────────────────────────┘  └─────────────────────────────────┘
               ▲   ▲   ▲   ▲   ▲
               │   │   │   │   │
            ┌──┴┐ ┌┴─┐ ┌┴─┐ ┌┴─┐ ┌┴────┐
            │Deel│ │Okta│ │GH │ │Slk│ │Stripe│
            │ ✦ │ └───┘ └───┘ └───┘ └─────┘
            └────┘   ✦ custom source spec — Chart New Waters bounty
```

## Layers

### UI — Next.js 15 + React 19

The App Router app. Server components by default; `"use client"` is used for the Copilot stream, the Blast Radius graph, the Live feed, and anything else that needs the browser. Tailwind v4 with brand tokens defined in `src/styles/globals.css` under `@theme`. shadcn/ui is the primitive base. Framer Motion and anime.js drive the microinteractions. React Flow renders the Blast Radius and Schema Graph.

The UI talks to the orchestrator over plain HTTP for synchronous calls (run an audit, fetch a finding) and over SSE for streams (Copilot tokens, Continuous Mode tick, SQL execution). The UI never talks to Coral or Anthropic directly.

### Orchestrator — Node 22

A single Node process that owns the audit registry, the continuous loop, the Copilot pipeline, the Blast Radius reachability engine, the schema-graph indexer, and the MCP server façade. Eight conceptual modules; one process. State lives in `better-sqlite3` on disk (audit history, ledger entries, schema catalog).

The orchestrator is **not** a warehouse. It does not store source rows. It does not run pipelines. Every audit is a SQL statement that Coral executes against the live or cached source data. The orchestrator's job is to ground prompts, validate SQL, narrate findings, and run a 30-second tick.

### Coral — federation engine

Coral runs locally (`coral mcp-stdio`). It speaks MCP. It registers a source per manifest, exposes its schema in `coral.tables` / `coral.columns`, executes SQL via Apache DataFusion, pushes filters down to source APIs where possible, and caches rows locally between calls.

Quartermaster's federation surface is exactly the set of sources you've `coral source add`ed. Five at launch: Deel (✦ custom spec), Okta, GitHub, Slack, Stripe.

### Claude — Sonnet 4.6

Three roles, all over the Anthropic SDK.

1. **SQL author.** The Copilot pipeline grounds Claude with Coral's catalog and asks it to produce a DataFusion-compatible SELECT.
2. **Finding narrator.** Each audit run pipes `(rows, columns)` to a second Claude call for a one-paragraph summary that cites which columns it used.
3. **Remediation drafter.** When a human asks for a Slack DM / Jira ticket / checklist, Claude composes it. Never sends — the human approves.

Claude never sees raw rows for sensitive sources. The narrator gets aggregate counts and column names; the drafter gets a finding summary, never the underlying records.

### Sources

Five connectors. Four use stock Coral source specs (`coral source add github` etc.). Deel uses the custom manifest in [`sources/deel/manifest.yaml`](../sources/deel/manifest.yaml) — built for the Chart New Waters bounty and explained in [`sources/deel/README.md`](../sources/deel/README.md).

Join-key discipline: every source flattens nested fields with `__` (e.g. `worker__email`), and every cross-source join goes through `work_email` for identity or `repo_id` / `channel_id` for resource identity. That convention is what lets the schema-graph indexer auto-detect joins.

## Data flow — one audit, end to end

```
User clicks "Zombie Account Hunter"
        │
        ▼
UI POST /api/audits/QM-01/run
        │
        ▼
Orchestrator: registry.load("QM-01") → templated SQL
        │
        ▼
MCP call → Coral: execute(sql)
        │
        ├─→ Coral fan-out: Deel /people, Okta /users,
        │                   GitHub /members, Slack /users
        │
        ▼
Rows return → DataFusion JOIN + filter → SSE stream to UI
        │
        ▼
Orchestrator: narrator.summarize(rows, columns) via Anthropic
        │
        ▼
UI renders findings + narration; user clicks one
        │
        ▼
Orchestrator: blastRadius(targetId) — reachability CTE → React Flow
        │
        ▼
User approves drafted remediation → ledger.append(hash)
```

## Data flow — Continuous Mode

Every `QM_CONTINUOUS_INTERVAL` seconds (default 30):

```
tick →  for each enabled audit:
          run audit (cached Coral pull where possible)
          diff against last result-set hash
          if new findings → push to /api/feed SSE → Live feed in UI
```

The tick is a single setInterval in the orchestrator. The diff is a SHA-256 over `(finding.id, finding.target, finding.severity)` tuples — a finding is *new* iff its hash isn't in the last result-set. New findings are pushed; resolved findings are pulled.

## Data flow — MCP server façade

```
External MCP client (Claude Code / Cursor / Goose)
        │ stdio
        ▼
mcp-server/index.ts
        │ in-process
        ▼
bridge → orchestrator internal API
        │
        ▼  (same as the UI's HTTP path)
audit registry / findings / drafter
```

The MCP server is a thin façade. It validates inputs with Zod, routes to the orchestrator's internal API, and returns text content per the MCP wire format. All logging goes to `stderr` — `stdout` is reserved for the protocol.

## Non-goals

- **Multi-tenant cloud deployment.** Quartermaster is local-first by design. If someone wants a hosted version, the federation model needs to change.
- **Real-time row streaming.** Continuous Mode is poll-based with a 30-second tick. Anything tighter requires source-side webhooks per integration; out of scope for v0.1.
- **Writing back to sources.** The agent is read-only. Remediation is drafted, never sent. Deprovisioning happens in the source's own UI.
- **A custom query language.** Coral's SQL is the query language. Quartermaster does not invent a DSL on top.

## Storage

| Where                                  | What                                                              |
| -------------------------------------- | ----------------------------------------------------------------- |
| `./.coral-workspace/` (Coral)          | Source manifests, schema catalog, row cache.                      |
| `./.qm-state.db` (better-sqlite3)      | Audit history, findings, ledger entries, evidence hashes.         |
| `./fixtures/` (JSON, in repo)          | Canned data for `QM_FIXTURES=on` demo / offline mode.             |
| `./.env.local`                         | Source tokens, Anthropic key. Never committed.                    |

## Versions

- Node ≥ 22
- Next.js 15.1
- React 19.0
- Tailwind 4.0 (beta)
- TypeScript 5.7
- `@modelcontextprotocol/sdk` ≥ 1.0.4
- `@anthropic-ai/sdk` ≥ 0.32

Coral version is pinned by `brew install withcoral/tap/coral` at the time of writing.
