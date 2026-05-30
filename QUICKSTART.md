# Quartermaster — Quickstart

Welcome aboard. This file is the **first 15 minutes** after cloning.
For the full story, read `README.md`. For the v2 product spec, see
the PDF at `docs/` (or the Complete Product Guide PDF outside the repo).

## TL;DR

```bash
pnpm install
cp .env.example .env.local
# paste at least ANTHROPIC_API_KEY in .env.local
pnpm demo          # runs with QM_FIXTURES=on — no real APIs needed
# open http://localhost:3000
```

That's it. You're at the Cockpit, in fixture mode, with all 5 audits
and a hot demo path. Live integrations come later.

## What's in the box

```
quartermaster/
├── README.md                  ← the public story
├── CLAUDE.md                  ← context for Claude Code
├── QUICKSTART.md              ← you are here
├── docs/
│   ├── demo-script.md         ← the 3-minute demo, beat by beat
│   ├── captains-log.md        ← Captain's Log blog draft (bounty #3)
│   ├── bounty-strategy.md     ← all four bounties + odds
│   └── architecture.md
├── sources/deel/              ← Custom Coral source spec (bounty #2)
│   ├── manifest.yaml
│   └── README.md              ← how to submit the PR
├── mcp-server/                ← Quartermaster-as-MCP-Server (KD-4)
│   └── index.ts
├── src/
│   ├── app/                   ← Next.js routes
│   │   ├── cockpit/           ★ DEMO PATH — the hero
│   │   ├── copilot/           ★ DEMO PATH — KD-1
│   │   ├── audits/[id]/       ★ DEMO PATH — SQL streaming
│   │   ├── findings/[id]/     ★ DEMO PATH — slide-over
│   │   ├── ledger/            ★ DEMO PATH — Compliance Ledger
│   │   ├── remediation/       Inbox of drafted actions
│   │   ├── sources/           Connection health
│   │   ├── schema/            Schema Graph (KD-5 — stub for now)
│   │   ├── playground/        SQL Playground (stub for now)
│   │   ├── settings/          MCP toggle lives here
│   │   └── api/               5 SSE/JSON endpoints
│   ├── components/            (15 components total)
│   └── lib/
│       ├── claude/            Sonnet 4.6 wrappers + SQL validator
│       ├── coral/             MCP client + schema catalog
│       ├── audits/            5 audit registry + runner
│       ├── fixtures/          Demo seed data
│       ├── db/                better-sqlite3 (findings, ledger)
│       ├── types/             Shared TypeScript types
│       └── utils/
└── public/
```

67 files. ~5,500 lines of TypeScript. Dark theme locked. No `any`. No `console.log`.

## The demo path — in order

1. `/cockpit` — Risk Cockpit hero
2. `/copilot` — Conversational audit (NL → SQL → result)
3. `/audits/QM-01` — Audit Run View (SQL streams + rows pop in)
4. `/findings/{id}` — Finding Detail slide-over (Blast Radius button lives here)
5. `/ledger` — Compliance Ledger with immutable-hash evidence pack

When demoing, walk through these five surfaces in that order. The full
3-minute script is in `docs/demo-script.md`.

## Live mode (when you're ready to leave fixtures behind)

```bash
# 1. Install Coral and isolate the workspace
brew install withcoral/tap/coral
export CORAL_CONFIG_DIR=$(pwd)/.coral-workspace

# 2. Submit the custom Deel source spec
coral source lint ./sources/deel/manifest.yaml
coral source add --file ./sources/deel/manifest.yaml
coral source test deel

# 3. Add the community sources
coral source add github
coral source add slack
coral source add okta      # if available
coral source add stripe

# 4. Disable fixtures
unset QM_FIXTURES
pnpm dev

# 5. (Killer feature) Expose Quartermaster as an MCP server
claude mcp add quartermaster -- npx tsx ./mcp-server/index.ts
claude
> "check our SaaS compliance for offboarded contractors"
```

## What to ship before Sunday

In order:

1. **Submit the Deel source spec PR** to Coral's source catalog —
   instantly locks the Chart New Waters bounty ($100 + charity).
2. **Three full demo rehearsals** of the 3-minute script with fixtures.
3. **Record the demo video** (Loom or QuickTime). Upload to YouTube unlisted.
4. **Submit Track 1 entry** via the official submission form.
5. **Publish the Captain's Log** blog (it's pre-drafted in `docs/captains-log.md`).
6. **Discord #show-and-tell post + LinkedIn/X tagging @withcoral.**

The complete sprint timeline is in `docs/bounty-strategy.md`.

## When things break

| Symptom | Fix |
|---|---|
| Copilot returns "I couldn't compile" three times | Check `ANTHROPIC_API_KEY` is set. Without it, fixtures path takes over. |
| `/api/audits/run` hangs | Probably waiting on Coral stdio. Set `QM_FIXTURES=on` and re-run. |
| Live demo flakes during judging | Press the Continuous Mode toggle off → back on; fixtures kick in if any source is failing. |
| TypeScript errors on `better-sqlite3` | Run `pnpm rebuild better-sqlite3` after Node version changes. |
| `claude mcp add quartermaster` errors | Make sure the mcp-server has been built with `pnpm exec tsx ./mcp-server/index.ts` once first. |

## House rules (so the codebase stays clean)

- **Dark theme only.** Every color comes from CSS variables in `src/styles/globals.css`. Never inline hex.
- **Strict types.** No `any`. Use `unknown` for external input, narrow with Zod.
- **No `console.log` in committed code.** Use proper logging if needed; for hackathon, just delete the log.
- **`"use client"` only when you need state, effects, or framer-motion.**
- **All shared types live in `@/lib/types`.** If you add a new shape, put it there first.
- **API responses use SSE for streams, JSON otherwise.** See existing routes for the pattern.

Now go ship. ⚓
