# Quartermaster — Claude Code context

You are working on **Quartermaster**, a local-first SaaS audit agent
submitted to the Coral "Pirates of the Coral-bean" hackathon (Track 1).

## Product in one paragraph

Quartermaster uses Coral's federated SQL engine to join the user's HRIS
(Deel), identity provider (Okta), code platform (GitHub), chat (Slack),
and billing (Stripe) — *in a single SQL query* — to find zombie accounts,
ghost seats, shadow IT, and compliance drift. The agent (Claude Sonnet 4.6
over MCP) drives a conversational interface ("QM Copilot"), narrates
findings, and drafts Slack/Jira remediation. The SQL does the joins.
Everything runs on the user's machine. PII never leaves.

## The five killer differentiators

1. **QM Copilot** — chat that compiles natural language to federated SQL
   using Coral's schema catalog as grounding.
2. **Continuous Mode** — Quartermaster polls sources on a tick and surfaces
   new findings in a live feed on the Cockpit.
3. **Blast Radius** — interactive force-directed graph of every system one
   account touches.
4. **Quartermaster-as-MCP-Server** — our audits are themselves an MCP
   server; Claude Code can call them as tools.
5. **Schema Graph** — visual swimlanes of all source tables with
   auto-detected join keys.

## The five named audits

- **QM-01 Zombie Account Hunter** — Deel + Okta + GitHub + Slack. Inactive
  employees still holding active accounts or admin roles.
- **QM-02 Permission Drift** — Active employees with elevated permissions
  unused 90+ days.
- **QM-03 Ghost-Seat Spend** — Paid seats with zero activity in 30 days,
  quantified in $/mo.
- **QM-04 Shadow-IT Detector** — Off-list Stripe charges + Slack mentions.
- **QM-05 Compliance Ledger** — SOC2 evidence pack per terminated employee.

## Stack

- Next.js 15 (App Router) + TypeScript 5.7 + Tailwind v4 + shadcn/ui
- Framer Motion + anime.js for microinteractions
- React Flow for Blast Radius + Schema Graph
- Anthropic SDK for Claude Sonnet 4.6
- `@modelcontextprotocol/sdk` for Coral + Quartermaster MCP
- better-sqlite3 for local audit history / ledger
- pnpm. Node 22.

## Brand — locked, do not invent

Color tokens are defined in `src/styles/globals.css` under `@theme`.
**Always use the CSS variables** (e.g. `bg-[var(--color-bg)]`, `text-[var(--color-gold)]`).
Never inline hex.

- `--color-bg` `#070E1A` (app)
- `--color-surface` `#0F1A2E` (rail/top bar)
- `--color-card` `#13213A` (cards)
- `--color-border` `#22324F`
- `--color-text` `#E8EEF7`
- `--color-text-muted` `#9AA7BD`
- `--color-gold` `#E4B66B` (brand primary, buttons, key numbers)
- `--color-coral` `#FF7A6B` (P0, danger)
- `--color-sea` `#5BD2C7` (P1, SQL keywords, info)
- `--color-lime` `#A8E063` (success, P2 inverse)

Type: Geist sans + Geist mono. Radii: 6 / 10 / 999. Spacing: 4/8/12/16/24/32/48/64/96.

## Folder map

```
src/
  app/                  Next.js App Router pages
    cockpit/            The hero — risk + audit grid + live feed
    audits/             Library + run views
    findings/           Slide-over surfaces
    remediation/        Inbox of drafted actions
    ledger/             Compliance trail
    copilot/            Conversational audit
    schema/             Schema Graph (KD-5)
    playground/         SQL Playground
    sources/            Connection health
    settings/
    api/                Orchestrator HTTP endpoints
  components/
    layout/             AppShell, LeftRail, TopBar
    cockpit/            StatCard, AuditTile, LiveFeed
    audit-run/          SQLPanel, ResultGrid, FindingRow
    finding-detail/     EvidenceCard, RemediationDraft, BlastRadius
    ledger/             LedgerEntry, EvidencePack
    copilot/            ChatBubble, ThreadMeta
    ui/                 shadcn primitives
  lib/
    claude/             Anthropic wrappers (sql-author, narrator)
    coral/              MCP client + schema catalog
    audits/             5 named audits — SQL templates + registry
    fixtures/           Demo seed data (QM_FIXTURES=on)
    db/                 better-sqlite3 schemas
    types/              Shared TypeScript types
    utils/cn.ts
mcp-server/             Quartermaster as MCP server (3 tools)
sources/deel/           Custom Coral source spec (Chart New Waters bounty)
fixtures/               JSON seed for offline / demo mode
```

## Behaviors

- **Dark theme only.** No light variants.
- **No third-party warehouse, no telemetry.** Everything local.
- **Read-only by design.** The agent never executes destructive ops.
  Remediation is drafted; humans approve.
- **Demo path matters.** Setup → Cockpit → Copilot → Audit Run →
  Finding Detail → Ledger. Polish these four screens before anything else.
- **Fixture mode.** `QM_FIXTURES=on` swaps live Coral calls for canned
  JSON. Used for offline development and demo-day fallback.

## When you (future Claude) edit code

1. Use `cn()` from `@/lib/utils/cn` for class merging.
2. Import shared types from `@/lib/types`.
3. Never invent colors; use the CSS variables.
4. Server components by default; add `"use client"` only when needed.
5. Pages live under `src/app/<route>/page.tsx`.
6. API routes live under `src/app/api/<route>/route.ts` and return JSON
   or SSE streams (text/event-stream).

## Demo (3 minutes)

00:00 cold open · 00:10 Cockpit with Live ON · 00:30 QM Copilot ★
01:00 Run Zombie Hunter (SQL streams) ★ · 01:40 Blast Radius ★
02:20 Continuous Mode live trigger ★ · 02:45 MCP server kicker

See `docs/demo-script.md` for the full beat-by-beat.
