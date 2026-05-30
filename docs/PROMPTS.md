# 10 Prompts — Quartermaster to 10/10

These are **paste-and-go prompts** to take Quartermaster from its current
scaffolded state to a submission-ready, judges-can't-ignore Track 1 entry.

Run each one inside Claude Code from the project root:
`cd ~/Downloads/quartermaster && claude`

Each prompt is self-contained. Paste the entire block. The agents, slash
commands, and project skills under `.claude/` auto-engage where relevant.

Run sequentially. Don't skip. Roughly 1–3 hours per prompt.

Run `/sprint-status` after each. Run `/judge` before Prompt 10.

---

## ⚓ Prompt 1 — The Landfall: Stunning Marketing Landing Page (2h)

> **Goal:** A 10/10 UX landing page that judges see FIRST. Spline 3D hero,
> anime.js scroll reveals, glassmorphism audit cards, flowing federation SVG.
> Standalone — no left rail. Judges see this before anything else.

```
Build the Quartermaster marketing landing page at src/app/page.tsx.

This is the first thing judges see. It needs to score visually above
Vercel.com. Every section must animate on scroll. The goal is: judges
want to click "Enter Cockpit" within 10 seconds.

Stack: Spline, anime.js, Framer Motion, Tailwind v4.
Brand: CSS variables only. No inline hex. No light mode.

──────────────────────────────────────────
SECTION 1 — FULL-SCREEN HERO
──────────────────────────────────────────
File: src/app/page.tsx (server shell) +
      src/components/landing/HeroSection.tsx (client)

- Full-viewport section. Dark background (var(--color-bg)).
- Left half: stacked typography. Right half: Spline 3D scene.
- Headline: "One SQL query. Five sources. Every ghost account."
  - Animate character-by-character using anime.js (40ms/char stagger)
  - Use Geist font, large clamp size (clamp(2.5rem, 5vw, 5rem))
  - Color: var(--color-text). "Five sources." in var(--color-gold).
- Subhead (fades in 800ms after headline completes):
  "Quartermaster joins Deel + Okta + GitHub + Slack + Stripe in a single
   federated SQL query. No ETL. No warehouse. PII never leaves your machine."
- Two CTAs side by side:
  - Primary: "Enter Cockpit" → /cockpit. Gold fill, 999px radius.
  - Secondary: "See the SQL" → smooth-scroll to #audits. Ghost border.
- Spline 3D: Import from @splinetool/react-spline. Use a dark nautical
  or network-graph scene. If Spline runtime fails to load, show a
  canvas fallback: three.js scene with 47 animated nodes (spheres,
  var(--color-sea) glow, slow orbit). Keep the Three.js fallback in
  src/components/landing/HeroCanvas.tsx.

──────────────────────────────────────────
SECTION 2 — ANIMATED STATS STRIP
──────────────────────────────────────────
File: src/components/landing/StatsStrip.tsx

Four counters in a horizontal band (var(--color-surface) bg):
  7 zombies · $4,820/mo · 1.4s · 5 sources

- Each counter increments from 0 when scrolled into view.
- Use anime.js with easing: 'easeOutExpo', duration: 1400ms.
- Counter labels below in var(--color-text-muted), 0.875rem.
- Separator: 1px vertical var(--color-border) between each stat.

──────────────────────────────────────────
SECTION 3 — 5 AUDIT CARDS (#audits)
──────────────────────────────────────────
File: src/components/landing/AuditCards.tsx

Five cards in a 2-3 bento grid (or alternating 60/40 split layout).
On scroll into view, each card's SQL block types itself character by
character (anime.js, 18ms/char, Geist Mono, var(--color-sea) for
keywords SELECT/FROM/WHERE/JOIN/ON/LEFT/INNER).

Each card:
- Header: audit ID (QM-01) in var(--color-gold), audit name in large type
- One-sentence description in var(--color-text-muted)
- SQL preview block (6-10 lines of the audit's real SQL template)
- Badge: severity (P0 / P1 / P2) + estimated $/mo savings or risk
- Hover: card lifts (translateY(-4px)), border transitions to var(--color-gold)

Cards:
1. QM-01 Zombie Account Hunter — P0 — joins Deel + Okta + GitHub + Slack
2. QM-02 Permission Drift — P1 — joins Okta + GitHub
3. QM-03 Ghost-Seat Spend — P1 — joins Stripe + GitHub + Slack
4. QM-04 Shadow-IT Detector — P2 — joins Stripe + Slack
5. QM-05 Compliance Ledger — P1 — joins all 5 sources

Pull the real SQL snippets from src/lib/audits/.

──────────────────────────────────────────
SECTION 4 — FEDERATION FLOW ANIMATION
──────────────────────────────────────────
File: src/components/landing/FederationFlow.tsx

An SVG/canvas animated diagram showing:
  [Deel] [Okta] [GitHub] [Slack] [Stripe]
       ↘   ↓    ↓    ↓   ↙
            [Coral]
               ↓
          [Results]

On scroll into view:
1. Source icons fade in from their edges (staggered, 120ms each).
2. Animated dashed lines flow from each source toward Coral center node.
3. The lines pulse var(--color-gold) left-to-right (strokeDashoffset animation).
4. Coral node glows for 400ms in var(--color-sea).
5. "Results" appears below with a counter: "47 findings · 1.4s · 0 bytes sent to cloud"

Source icons: use SVG brand logos or letter-based avatars. Brand-colored.
Coral node: hexagonal, var(--color-gold) stroke, var(--color-card) fill.

──────────────────────────────────────────
SECTION 5 — 5 DIFFERENTIATOR ROWS
──────────────────────────────────────────
File: src/components/landing/DifferentiatorRows.tsx

Five alternating rows (left-text / right-visual, then right-text / left-visual):
1. QM Copilot — NL→SQL→execute→narrate. Visual: animated chat bubble sequence.
2. Continuous Mode — live finding feed. Visual: feed item animating in.
3. Blast Radius — force-directed graph. Visual: mini 20-node React Flow preview.
4. MCP Server — auditss callable as tools. Visual: terminal code block.
5. Schema Graph — federated join map. Visual: swimlane diagram thumbnail.

Each row:
- Slides in from the off-screen side (Framer Motion, x: ±80, opacity: 0→1)
- Triggered by IntersectionObserver (threshold: 0.25)
- Text side: 600 weight headline + 2-sentence description + link to the live page
- Visual side: the preview element described above

──────────────────────────────────────────
SECTION 6 — FINAL CTA
──────────────────────────────────────────
File: src/components/landing/CTASection.tsx

Dark card centered on var(--color-bg):
- Headline: "Ship your SaaS audit in 90 seconds."
- Terminal code block:
  ```
  git clone https://github.com/yourorg/quartermaster
  QM_FIXTURES=on pnpm demo
  ```
  Syntax-highlighted. One-click copy button.
- "Enter Cockpit" primary button (large, gold).
- Track 1 badge: "Built for Pirates of the Coral-bean · Hackathon 2025"

──────────────────────────────────────────
TECHNICAL REQUIREMENTS
──────────────────────────────────────────
- No left rail, no top bar on this page. Standalone layout.
- Scroll-based animations use IntersectionObserver, not scroll event handlers.
- All motion respects prefers-reduced-motion (wrap anime.js calls in
  a useReducedMotion check; static fallback if true).
- Page must score > 85 on Lighthouse performance. Spline loads lazily.
- Every image/asset has explicit width + height.
- cn() from @/lib/utils/cn for all class merging.
- Server component shell (page.tsx) + client islands only where animation needed.

──────────────────────────────────────────
ACCEPTANCE
──────────────────────────────────────────
- pnpm build passes with zero TypeScript errors.
- Open http://localhost:3000. Scroll through all six sections.
- Every section animates exactly once as it enters the viewport.
- SQL types itself on the audit cards.
- The stats strip counts up.
- "Enter Cockpit" routes to /cockpit.
- /brand-check passes (no inline hex, no console.log).
```

**Acceptance:** Landing page at `/` scores visually above Vercel.com.
Every section animates on scroll. Judges want to click "Enter Cockpit" immediately.

---

## ⚓ Prompt 2 — Chart New Waters: Coral Source PR (30min)

> **Goal:** Submit the Deel HRIS source spec to Coral's catalog repository
> for the Chart New Waters bounty. One PR. One URL in bounty-strategy.md.

```
Submit the Deel source spec to Coral's catalog repo for the
Chart New Waters bounty.

Steps:
1. Fork https://github.com/withcoral/coral-sources (the public catalog repo).
   Use `gh repo fork withcoral/coral-sources --clone=true`.

2. Copy ./sources/deel/ into the fork:
   `cp -r ./sources/deel <fork-dir>/sources/deel`

3. Verify the manifest passes lint:
   `coral source lint ./sources/deel/manifest.yaml`
   Fix any lint errors in ./sources/deel/manifest.yaml before pushing.

4. Commit and push:
   `git add sources/deel && git commit -m "feat: add Deel HRIS source spec"`
   `git push origin main`

5. Open PR:
   - Title: "Add Deel HRIS source spec (Chart New Waters bounty)"
   - Body: full contents of ./sources/deel/README.md
   - Use: `gh pr create --title "..." --body "$(cat ./sources/deel/README.md)"`

6. Capture the PR URL from gh output.

7. Paste the PR URL into docs/bounty-strategy.md in the Chart New Waters row.

If gh is not authenticated, run `gh auth login` first.
If Coral CLI is not installed, run `brew install withcoral/tap/coral`.
Document any blockers in docs/external-skills.md.
```

**Acceptance:** PR is open on Coral's catalog repo. URL is in
`docs/bounty-strategy.md` Chart New Waters row.

---

## ⚓ Prompt 3 — The Captain's Log: Build Blog Post (2h)

> **Goal:** A 1,400–1,800 word technical build story for the Captain's Log
> bounty. Written for engineers. Published. URL in bounty-strategy.md.

```
Write and publish the Captain's Log build post for the Captain's Log bounty.

First, write the post to docs/captains-log.md. Then I'll publish it.

──────────────────────────────────────────
CONTENT SPEC
──────────────────────────────────────────
Target length: 1,400–1,800 words. No fluff. No marketing. Real code.
Audience: engineers who've heard of Coral but haven't used it.
Voice: direct, first-person plural ("we"), slightly nautical (the theme).

Required sections, in order:

1. HOOK (150 words)
   Open with: "One SQL query. Five sources. $4,820/mo of waste.
   Found in 1.4 seconds."
   Then: what Quartermaster is in two sentences. Not the hackathon
   pitch — what the product does and why it matters.

2. THE CORAL ANGLE (200 words)
   Explain what Coral's federated SQL actually does, technically.
   Not marketing copy — what happens at the query layer. How the
   MCP client calls Coral. Why this is different from ETL or a
   data warehouse. Include a real connection diagram (ASCII or
   embedded image from public/screenshots/).

3. THE FIVE AUDITS (400 words)
   One paragraph per audit. Each paragraph includes:
   - The SQL template (4–8 lines, real code from src/lib/audits/)
   - What it finds and why it matters
   - The business cost surfaced ($ or compliance risk)

4. QM COPILOT (200 words)
   How the NL→SQL→execute→narrate pipeline works.
   Include the Claude system prompt excerpt.
   Include a real example: user question → generated SQL → narration.

5. BLAST RADIUS (150 words)
   How one account can touch 47 systems.
   How we compute the reachability graph from SQL joins.
   Screenshot: public/screenshots/blast-radius.png (embed as markdown).

6. THE DEEL SOURCE SPEC (100 words)
   What we contributed to Coral's catalog.
   What fields the manifest exposes.
   Link to the PR (placeholder: [CORAL_PR_URL]).

7. WHAT'S NEXT (100 words)
   MCP Marketplace listing, scheduling/alerting, multi-tenant mode,
   more source specs. One honest "we didn't finish" callout.

8. LINKS FOOTER
   - GitHub repo: [GITHUB_URL]
   - Demo video: [DEMO_VIDEO_URL]
   - Track 1 submission: [SUBMISSION_URL]
   - Coral PR: [CORAL_PR_URL]

──────────────────────────────────────────
TECHNICAL REQUIREMENTS
──────────────────────────────────────────
- Pull real SQL snippets directly from src/lib/audits/*.ts
- Pull real system prompt excerpt from src/lib/claude/copilot.ts
- Screenshot embed paths: public/screenshots/*.png (use whatever exists)
- All code blocks must be syntactically correct
- Replace placeholder URLs with real values if they exist in
  docs/bounty-strategy.md already

──────────────────────────────────────────
AFTER WRITING
──────────────────────────────────────────
Once docs/captains-log.md is final:
1. Print the publish instructions:
   - Hashnode: go to hashnode.com → New Article → paste content
   - dev.to: go to dev.to/new → paste content
   - Set canonical URL to your own domain if you have one
2. After publishing, paste the permalink into docs/bounty-strategy.md
   Captain's Log row.
```

**Acceptance:** `docs/captains-log.md` is 1,400+ words. Real SQL
excerpts present. Published permalink in `docs/bounty-strategy.md`.

---

## ⚓ Prompt 4 — Raise the Mizzen: Real Coral Live Integration (3h)

> **Goal:** All 5 audits run against a real Coral installation with real
> source tokens. `/sources` shows 5 healthy with real row counts.

```
Wire Quartermaster to a live Coral installation.
Goal: /sources shows 5 healthy sources with real row counts,
and QM-01 returns real terminated employees.

──────────────────────────────────────────
STEP 1 — CORAL CLI
──────────────────────────────────────────
1. `brew install withcoral/tap/coral`
2. Verify: `coral --version`
3. `export CORAL_CONFIG_DIR=$(pwd)/.coral-workspace`
4. Persist in .env.local: `CORAL_CONFIG_DIR=$(pwd)/.coral-workspace`

──────────────────────────────────────────
STEP 2 — DEEL SOURCE
──────────────────────────────────────────
1. `coral source lint ./sources/deel/manifest.yaml` — fix any errors.
2. `coral source add --file ./sources/deel/manifest.yaml`
3. `coral source test deel`
4. `coral sql "SELECT count(*) FROM deel.directory;"`
   If this returns a number, Deel is live.

──────────────────────────────────────────
STEP 3 — BUNDLED SOURCES
──────────────────────────────────────────
Run each of these and capture output:
- `coral source add github`
- `coral source add slack`
- `coral source add stripe`
- `coral source add okta` (may not be bundled — document in
  docs/external-skills.md if unavailable; proceed with 4/5)

Set real API tokens in .env.local:
  DEEL_API_TOKEN=
  GITHUB_TOKEN=
  OKTA_TOKEN=
  SLACK_TOKEN=
  STRIPE_KEY=

Document: which tokens you have, which are missing, which sources
are running with fixtures as fallback.

──────────────────────────────────────────
STEP 4 — MCP WIRING
──────────────────────────────────────────
1. `claude mcp list` — confirm coral MCP server appears.
   If not: `claude mcp add coral -- coral mcp-stdio`
2. Verify: run a test query through the MCP client:
   In src/lib/coral/client.ts, call executeSQL("SELECT 1") and
   log the result. If it returns {rows: [{1: 1}]}, MCP is live.
3. Remove `QM_FIXTURES=on` from .env.local.
4. Restart pnpm dev.

──────────────────────────────────────────
STEP 5 — VERIFICATION
──────────────────────────────────────────
1. Open /sources — verify health dots. At minimum Deel + GitHub +
   Slack must show green with real row counts.
2. Run QM-01 from /cockpit — verify real terminated employee rows
   appear (not fixture data). Check: names, emails, dates are real.
3. Open /copilot — ask "who left in the last 30 days?"
   Verify: real SQL is generated and real rows return.

──────────────────────────────────────────
BLOCKERS
──────────────────────────────────────────
If any source is unavailable:
- Document in docs/external-skills.md with: source name, blocker
  reason, workaround (fixture path or alternative).
- Do NOT remove fixture fallback — QM_FIXTURES=on must still work
  for offline demo mode.
- At minimum 3 of 5 sources must be live for this prompt to pass.
```

**Acceptance:** `/sources` shows real row counts. QM-01 returns real
terminated employees. `docs/external-skills.md` documents any gaps.

---

## ⚓ Prompt 5 — The Crow's Nest: Three.js Force Graph Blast Radius (2h)

> **Goal:** Replace the React Flow grid layout with a proper Three.js
> force-directed graph. 63 nodes. Cyber threat visualization aesthetic.
> Judges say "wow."

```
Upgrade Blast Radius to a Three.js force-directed graph.

Files to create/edit:
- src/components/finding-detail/BlastRadiusGraph.tsx  (new — Three.js graph)
- src/components/finding-detail/BlastRadiusModal.tsx  (edit — swap inner graph)
- src/lib/fixtures/blastRadius.ts                     (edit — 63 nodes for demo)

──────────────────────────────────────────
GRAPH SPEC — BlastRadiusGraph.tsx
──────────────────────────────────────────
Tech: Three.js only. No d3. No additional dependencies.
Canvas-based. Use a custom force simulation (spring + repulsion).

Nodes:
- Spheres. Radius: 0.4 (default), 0.8 (center person node).
- Material: MeshStandardMaterial with emissiveIntensity: 0.6
- Colors by type (use THREE.Color with brand hex):
    person   → #E4B66B (var --color-gold)
    repo     → #5BD2C7 (var --color-sea)
    channel  → #E4B66B (var --color-gold, 80% opacity)
    secret   → #FF7A6B (var --color-coral)
    service  → #A8E063 (var --color-lime)
    issue    → #9AA7BD (var --color-text-muted)
- Add a PointLight at center node position (gold, intensity 2.0)
  for the glow halo effect.

Edges:
- TubeGeometry following a QuadraticBezierCurve3.
- Control point offset: random ±15% of midpoint in Y.
- Material: LineBasicMaterial, color #22324F (var --color-border),
  opacity 0.6, transparent: true.
- Edge width: 1px.

Force simulation (implement in useEffect loop):
- Repulsion: F = k / distance² between all node pairs (k = 80)
- Spring attraction: F = stiffness * (distance - restLength) for edges
  (stiffness = 0.05, restLength = 12)
- Center gravity: weak pull toward origin (0.01 * position)
- Damping: velocity *= 0.92 per frame
- Run 200 iterations on initial load (pre-warm), then 1 per frame.
- Freeze simulation after 400ms of near-zero movement (maxVelocity < 0.01).

Camera:
- PerspectiveCamera, FOV 60, positioned at (0, 0, 80).
- Slow rotation: scene.rotation.y += 0.003 per frame.
- OrbitControls (use Three.js examples/jsm — already in three package).

Interaction:
- Raycasting on mousemove for hover detection.
- Hover: scale node to 1.3 + show tooltip with:
    {label} · {type} · {SQL evidence line}
- Click: dispatch a custom event 'blast-node-click' with node data
  so the modal can show a detail popover.

Export PNG:
- "Export PNG" button renders the scene, calls:
  renderer.domElement.toDataURL('image/png')
  then triggers a download.

Performance:
- Use InstancedMesh for nodes (single draw call for all nodes).
- Dispose geometry/material on unmount.
- Cap at 120 fps with a clock.

──────────────────────────────────────────
FIXTURE DATA — expand to 63 nodes
──────────────────────────────────────────
Edit src/lib/fixtures/blastRadius.ts for Mark Reyes:
- 1 person node (center)
- 18 repo nodes (mix of admin + write access)
- 12 slack channels
- 8 github secrets (some repo-scoped, 2 org-scoped)
- 14 services (AWS roles, Heroku apps, Vercel projects, etc.)
- 10 linear issues (assigned or created)

Each node: { id, label, type, severity, sqlEvidence }
Each edge: { source, target, label }
sqlEvidence for each node should be a 1-line SQL excerpt showing
how it was discovered.

──────────────────────────────────────────
MODAL WRAPPER
──────────────────────────────────────────
BlastRadiusModal.tsx changes:
- Swap <ReactFlow ...> with <BlastRadiusGraph nodes={nodes} edges={edges} />
- Keep the modal shell, header, and export button.
- Header summary: update to show "63 nodes · 5 sources · $4,820/mo at risk"
- Pass onNodeClick handler to graph; show side popover with
  node.sqlEvidence when fired.
- Keep Framer Motion scale-in entry animation.

──────────────────────────────────────────
ACCEPTANCE
──────────────────────────────────────────
- Graph renders 63 nodes without frame drops.
- Nodes stabilize within 400ms and keep slow Y rotation.
- Hover shows tooltip. Click shows SQL evidence popover.
- Export PNG downloads a valid image.
- Fixture mode works offline (no Coral needed for Blast Radius).
```

**Acceptance:** The graph looks like a cyber threat visualization.
Judges stop scrolling to look at it.

---

## ⚓ Prompt 6 — The Live Trigger: Continuous Mode Demo Polish (1h)

> **Goal:** Beat 02:20 works in 100% of environments without a real
> Deel sandbox. Keyboard shortcut triggers a live finding. Bulletproof.

```
Make the Continuous Mode demo beat bulletproof.

The problem: triggering a live finding currently requires flipping a
real Deel record. Demos fail when there's no live Coral sandbox.
Solution: a hidden admin trigger + keyboard shortcut.

──────────────────────────────────────────
STEP 1 — LOWER INTERVAL FOR DEMOS
──────────────────────────────────────────
In src/lib/audits/continuous.ts (or wherever QM_CONTINUOUS_INTERVAL
is consumed):
- Default: 30s production, 5s demo mode.
- Demo mode = QM_FIXTURES=on OR QM_DEMO=true.
- Persist: add QM_CONTINUOUS_INTERVAL=5 to the demo npm script in
  package.json's "demo" task.

──────────────────────────────────────────
STEP 2 — /api/admin/trigger ENDPOINT
──────────────────────────────────────────
Create src/app/api/admin/trigger/route.ts:
- POST only. No auth (local-only server).
- Generates one synthetic finding:
    {
      id: crypto.randomUUID(),
      auditId: "QM-01",
      severity: "P0",
      principalEmail: "mark.reyes@acme.corp",
      summary: "Terminated employee still holds GitHub admin on api-core",
      sourcesUsed: ["deel", "github"],
      discoveredAt: new Date().toISOString(),
      synthetic: true
    }
- Pushes the finding into the continuous mode emit queue
  (same path as real findings) so the SSE stream picks it up.
- Returns: { ok: true, findingId: "<uuid>" }

──────────────────────────────────────────
STEP 3 — KEYBOARD SHORTCUT
──────────────────────────────────────────
In src/app/cockpit/page.tsx:
- Add a useEffect that registers a keydown listener.
- Shortcut: Meta+Shift+T (macOS Cmd+Shift+T) OR Ctrl+Shift+T.
- On trigger: POST to /api/admin/trigger.
- Show a brief toast: "Live finding triggered (demo mode)" — use the
  existing toast system or a simple fixed div.
- Remove listener on unmount.

──────────────────────────────────────────
STEP 4 — CORAL GLOW ANIMATION
──────────────────────────────────────────
In src/components/cockpit/LiveFeed.tsx (or wherever new findings
are prepended):
- When a new finding arrives via SSE:
  1. Prepend to feed state.
  2. For 3000ms, apply a class `finding-new` to the new row.
  3. CSS for .finding-new:
       border-color: var(--color-coral);
       box-shadow: 0 0 12px var(--color-coral);
     Transition both properties back to normal over 3000ms.
  4. After 3000ms, remove the class.

──────────────────────────────────────────
STEP 5 — UPDATE DEMO SCRIPT
──────────────────────────────────────────
Edit docs/demo-script.md beat 02:20:
- Replace the "flip Deel record via curl" instruction with:
  "Press Cmd+Shift+T to trigger a live finding instantly.
   No Deel sandbox required. Works in full fixture mode."
- Add to the pre-flight checklist:
  [ ] Continuous Mode toggle is ON (green pulse)
  [ ] Test Cmd+Shift+T once before starting — confirm coral glow appears

──────────────────────────────────────────
ACCEPTANCE
──────────────────────────────────────────
- Start with QM_FIXTURES=on pnpm dev.
- Enable Continuous Mode.
- Press Cmd+Shift+T.
- Within 2 seconds: a P0 finding appears at the top of the Live Feed
  with a coral glow border that fades over 3 seconds.
- Works in a browser with no network requests beyond localhost.
```

**Acceptance:** Demo beat 02:20 works in 100% of environments.
Keyboard shortcut documented in `docs/demo-script.md`.

---

## ⚓ Prompt 7 — The Quartermaster's Mark: MCP Server Registration (30min)

> **Goal:** `quartermaster-mcp` is registered in Claude Code and callable.
> Demo beat 02:45 works. Screenshot in docs.

```
Register the Quartermaster MCP server in Claude Code and verify
it's callable as tools from Claude.

──────────────────────────────────────────
STEP 1 — REGISTER
──────────────────────────────────────────
From the project root, run:
  claude mcp add quartermaster -- npx tsx /Users/vyapar/Downloads/quartermaster/mcp-server/index.ts

Verify:
  claude mcp list
  → should show: quartermaster ... ready

If "npx tsx" fails, check:
  - tsx is installed: npm ls -g tsx or npx tsx --version
  - mcp-server/index.ts exists and compiles: npx tsx --check mcp-server/index.ts
  - Fix any TypeScript errors in mcp-server/ before re-registering.

──────────────────────────────────────────
STEP 2 — SMOKE TEST
──────────────────────────────────────────
Open a new Claude Code session (or sub-agent):
  "Use the quartermaster MCP tool to run the zombie audit and
   show me the top 3 findings."

Claude should:
1. Call run_audit({ auditId: "QM-01" })
2. Call get_findings({ auditId: "QM-01" })
3. Call draft_remediation({ findingId: "<id>" }) on the first finding
4. Return a readable summary of all three results.

If any tool call fails, check:
  - mcp-server/index.ts implements all 3 tools: run_audit, get_findings,
    draft_remediation with correct input schemas.
  - Each tool handler is connected to src/lib/audits/ logic.
  - QM_FIXTURES=on is set so the tools work without live Coral.

──────────────────────────────────────────
STEP 3 — SCREENSHOT
──────────────────────────────────────────
Once the three-tool chain works:
1. Take a screenshot of the Claude Code terminal showing the MCP
   tool calls and their results.
2. Save as public/screenshots/mcp-kicker.png.
3. Create public/screenshots/ if it doesn't exist.

──────────────────────────────────────────
STEP 4 — EMBED IN CAPTAIN'S LOG
──────────────────────────────────────────
In docs/captains-log.md, find the MCP server section and add:
  ![MCP tool chain — quartermaster called from Claude Code](../public/screenshots/mcp-kicker.png)

──────────────────────────────────────────
ACCEPTANCE
──────────────────────────────────────────
- `claude mcp list` shows quartermaster as ready.
- Three-tool chain runs without errors.
- mcp-kicker.png exists in public/screenshots/.
- Embedded in captains-log.md.
```

**Acceptance:** Demo beat 02:45 works. Claude Code calls Quartermaster
as a tool. Screenshot is in the repo.

---

## ⚓ Prompt 8 — Full Sail: Final UI Polish Pass (2h)

> **Goal:** Every screen on the demo path looks and performs at 10/10.
> Zero console errors. `/brand-check` passes. < 1s load on every page.

```
Final UI polish pass. Walk the full demo path and fix everything
that looks or feels below 10/10.

──────────────────────────────────────────
SCREENS TO POLISH (in demo order)
──────────────────────────────────────────

1. src/app/page.tsx (landing)
   - Confirm all six sections render without hydration errors.
   - Confirm Spline loads lazily (network tab: spline loads only when
     HeroSection is mounted, not on initial HTML parse).
   - Confirm stats strip counter fires once on scroll, not on mount.

2. src/app/cockpit/page.tsx
   - Confirm 4 KPI StatCards are visible on load without scrolling.
   - Confirm Continuous Mode pulse animates (lime, breathing).
   - Confirm Live Feed shows 3–5 items on first load (from fixtures).
   - Wire the EventSource: when Live toggle is ON, connect to
     /api/continuous/stream. When toggled OFF, close it cleanly.
   - Confirm Cmd+Shift+T shortcut is wired (from Prompt 6).

3. src/components/audit-run/SQLPanel.tsx
   - Verify 40ms/char typing works smoothly in a real browser.
   - Verify caret blinks during typing and disappears when first row arrives.
   - Verify SQL keywords (SELECT, FROM, WHERE, JOIN, ON) are colored
     var(--color-sea) via a simple highlight pass.

4. src/components/finding-detail/BlastRadiusModal.tsx
   - Verify the Three.js graph from Prompt 5 renders (63 nodes).
   - Verify the Framer Motion scale-in entry animation plays.
   - Verify the Export PNG button downloads a file.

5. src/app/ledger/page.tsx
   - Verify SHA-256 hashes display as 4 rows × 16 chars in Geist Mono.
   - Verify at least 4 entries are seeded from fixtures.
   - Verify the EvidencePack right rail opens on row click.

6. src/app/schema/page.tsx
   - Verify 5 swimlanes render with join edges on first load.
   - Verify hovering a join edge shows confidence label.
   - Verify clicking two columns activates the "Generate SQL" button.

7. src/app/playground/page.tsx
   - Verify ?join= query param pre-populates the SQL editor.
   - Verify "Run" button fires the audit SSE stream.

──────────────────────────────────────────
BRAND CHECK
──────────────────────────────────────────
Run /brand-check to catch:
- Inline hex values (#RRGGBB or rgb()) — replace with CSS variables.
- Wrong font imports (anything not Geist or Geist Mono).
- console.log / console.error left in production code.
- Tailwind classes with hardcoded colors (e.g. text-yellow-400) —
  replace with arbitrary [var(--color-gold)] form.
- Missing cn() usage for conditional class merging.

Fix every finding. Re-run /brand-check until it passes.

──────────────────────────────────────────
PERFORMANCE CHECK
──────────────────────────────────────────
- Run pnpm build. Zero TypeScript errors. Zero warnings about large chunks.
- If any JS chunk > 150kb gzipped, identify the culprit and apply
  dynamic import: const Module = await import('heavy-lib').
- Open Chrome DevTools → Performance tab → record a cold load of /:
  LCP < 2.5s. No layout shifts. No janky animation.

──────────────────────────────────────────
QUICKSTART REFRESH
──────────────────────────────────────────
Update QUICKSTART.md (or README.md if that's the main readme):
- Add 3 badges: build passing, license, hackathon.
- Add one full-width screenshot of the Cockpit.
- Add one GIF or screenshot of the SQL typing animation.
- Make the "Getting Started" section 3 commands max.

──────────────────────────────────────────
ACCEPTANCE
──────────────────────────────────────────
- pnpm build exits 0.
- /brand-check passes.
- Every demo-path page loads in < 1s (localhost, fixture mode).
- Zero console errors in DevTools on the demo path.
- Zero hydration warnings.
```

**Acceptance:** `/brand-check` passes. Zero console errors. Every page
loads under 1s. `pnpm build` exits clean.

---

## ⚓ Prompt 9 — Three Clean Runs: Demo Rehearsal + Record (2h)

> **Goal:** Three clean 3-minute runs with no intervention. One recorded
> MP4. Pre-flight checklist signed off. Demo is bulletproof.

```
Drive the full demo rehearsal pipeline. Three clean runs, then record.

──────────────────────────────────────────
SETUP
──────────────────────────────────────────
1. Ensure .env.local contains:
   QM_FIXTURES=on
   QM_CONTINUOUS_INTERVAL=5
   QM_DEMO=true

2. Run: pnpm demo (or pnpm dev with the above vars)

3. Open http://localhost:3000 at 1440×900 Chrome (no extensions).

4. Open docs/demo-script.md and keep it visible.

──────────────────────────────────────────
REHEARSAL — 3 CLEAN RUNS
──────────────────────────────────────────
For each run, walk every beat in docs/demo-script.md:

  00:00 Cold open — landing page loads, hero animates
  00:10 Enter Cockpit — 4 KPI cards, live pulse
  00:20 Continuous Mode ON — toggle, confirm green pulse
  00:30 QM Copilot — type a question, SQL streams, rows appear ★
  01:00 Zombie Hunter — click run, SQL types itself, rows pop in ★
  01:40 Blast Radius — open modal, 63-node graph renders ★
  02:20 Live Trigger — Cmd+Shift+T, coral glow finding appears ★
  02:45 MCP Kicker — show terminal (pre-staged), tool chain output ★
  02:55 Close — ledger entry visible, "Enter Cockpit" on landing

For each beat marked ★, verify:
  - It works without touching any config.
  - It takes ≤ the target time ± 5s.
  - The visual payoff is obvious (no explaining needed).

If any rehearsal requires hand-holding, stop, fix it, restart the
run counter from 0. Do NOT "accept" a rehearsal that needed fixing.
Three fully clean runs means three runs where nothing was touched.

Document any failure and its fix in docs/demo-script.md under
"Known Failure Modes + Fallbacks".

──────────────────────────────────────────
RECORDING
──────────────────────────────────────────
After three clean rehearsals:
1. Two warmup runs (not recorded). Muscle memory only.
2. Record the third clean run:
   - macOS: QuickTime → New Screen Recording → select Chrome window
   - Or: Loom desktop app (hides the Loom UI during recording)
   - Crop to exactly the browser window. No dock visible.
3. Export as MP4. Save to public/demo.mp4.
4. Upload to YouTube (unlisted). Capture the URL.
5. Add the URL to docs/bounty-strategy.md demo video row.

──────────────────────────────────────────
PRE-FLIGHT CHECKLIST
──────────────────────────────────────────
Add or update this checklist in docs/demo-script.md:

Demo Day Pre-Flight:
  [ ] pnpm demo starts without errors
  [ ] Landing page: all 6 sections render
  [ ] Cockpit: 4 KPI cards visible above fold
  [ ] Sources top bar: 5 chips showing (fixture mode: all healthy)
  [ ] Continuous Mode: green pulse active
  [ ] Live Feed: 3–5 items pre-seeded
  [ ] QM Copilot: send a test question, get rows back
  [ ] Blast Radius: open Mark Reyes modal, 63 nodes render
  [ ] Cmd+Shift+T: coral glow finding triggers within 2s
  [ ] MCP terminal tab: pre-staged with the three-tool output visible
  [ ] Browser zoom: 100%
  [ ] Do Not Disturb: ON
  [ ] Second monitor: off (or mirrored, not extended)

──────────────────────────────────────────
ACCEPTANCE
──────────────────────────────────────────
- public/demo.mp4 exists (or YouTube URL in bounty-strategy.md).
- Pre-flight checklist is in docs/demo-script.md and all items
  are checked off.
- "Known Failure Modes + Fallbacks" section exists in demo-script.md
  with at least one entry per ★ beat.
```

**Acceptance:** A clean MP4 demo. Pre-flight checklist signed off.
Every ★ beat has a documented fallback.

---

## ⚓ Prompt 10 — Raise the Colors: Submit + Promote (1.5h)

> **Goal:** Four bounty submissions, four URLs, everything live.
> `docs/bounty-strategy.md` has all four rows filled.

```
Drive the final submission and promotion pipeline.
Do not skip steps. Report each URL immediately after capturing it.

──────────────────────────────────────────
STEP 0 — FINAL SELF-SCORE
──────────────────────────────────────────
Run /score-self. If any criterion is below 8/10, list what to fix.
If anything is fixable in under 30 minutes, fix it before continuing.
If not, document it in docs/bounty-strategy.md under "Known Gaps".

──────────────────────────────────────────
STEP 1 — TRACK 1 SUBMISSION
──────────────────────────────────────────
Submit the Track 1 entry:
  Form: https://forms.gle/iLRYXPsGHFTj7xaeA

Fill in:
  Project name: Quartermaster
  Track: Track 1 (Enterprise Agent / Coral)
  GitHub repo URL: [from git remote -v]
  Demo video URL: [from docs/bounty-strategy.md demo row]
  One-paragraph description:
    "Quartermaster is a local-first SaaS audit agent that uses
     Coral's federated SQL to join Deel, Okta, GitHub, Slack, and
     Stripe in a single query — finding zombie accounts, ghost seats,
     shadow IT, and compliance drift in under 2 seconds. The QM Copilot
     translates natural language to federated SQL. Blast Radius maps
     every system a user touches. Continuous Mode surfaces new findings
     live. Everything runs on your machine. PII never leaves."
  Team: [your name + email]

After submitting, capture the confirmation URL or email.
Paste into docs/bounty-strategy.md Track 1 row.

──────────────────────────────────────────
STEP 2 — CAPTAIN'S LOG SUBMIT
──────────────────────────────────────────
If the blog post from Prompt 3 isn't published yet, publish it now:
  - Go to dev.to/new or hashnode.com → New Article
  - Paste docs/captains-log.md
  - Tags: coral, sql, saas, security, hackathon
  - Publish. Capture permalink.
  - Paste into docs/bounty-strategy.md Captain's Log row.

──────────────────────────────────────────
STEP 3 — DISCORD #show-and-tell
──────────────────────────────────────────
Post to the Coral Discord #show-and-tell channel.

Draft (6–8 lines, paste and send):
  "⚓ Quartermaster — one SQL query across 5 SaaS sources to find
   zombie accounts, ghost seats, and shadow IT.

   Found 7 zombie accounts and $4,820/mo of waste in 1.4s.
   Everything local. No ETL. No warehouse. PII stays on your machine.

   Demo: [DEMO_VIDEO_URL]
   Repo: [GITHUB_URL]

   Built with Coral's federated SQL (5 sources: Deel, Okta, GitHub,
   Slack, Stripe). Also submitting a Deel source spec PR to the catalog.

   Honest note: would love to add scheduling/alerting next — the
   continuous mode is currently polling only.

   @withcoral"

──────────────────────────────────────────
STEP 4 — LINKEDIN POST
──────────────────────────────────────────
Draft a LinkedIn post (4–6 sentences).
Lead with the product, not the hackathon.

  "Built a tool that joins your Deel, Okta, GitHub, Slack, and Stripe
   data in a single SQL query — no ETL, no warehouse — to surface zombie
   accounts, ghost seats, and shadow IT in under 2 seconds.

   It's called Quartermaster. It runs locally. PII never leaves your machine.
   You can ask it questions in plain English and it compiles them to
   federated SQL using Claude.

   Open source: [GITHUB_URL]
   Demo: [DEMO_VIDEO_URL]

   Built on @withcoral's federated SQL engine."

Publish. Capture URL. Paste into bounty-strategy.md Tell the Tale row.

──────────────────────────────────────────
STEP 5 — X/TWITTER THREAD
──────────────────────────────────────────
Post a thread. First tweet must stand alone as the hook.

Tweet 1 (hook):
  "Found 7 zombie accounts and $4,820/mo of waste in 1.4s with one
   SQL query. Local. No ETL. No warehouse. PII never leaves. ↓"

Tweet 2:
  "Quartermaster joins Deel + Okta + GitHub + Slack + Stripe in a
   *single* federated SQL query using @withcoral. No pipelines.
   No data copies. The SQL does the work."

Tweet 3:
  "5 built-in audits:
   → QM-01 Zombie Account Hunter
   → QM-02 Permission Drift
   → QM-03 Ghost-Seat Spend
   → QM-04 Shadow-IT Detector
   → QM-05 Compliance Ledger"

Tweet 4:
  "QM Copilot: ask 'who left last month and still has GitHub admin?'
   → Claude compiles to federated SQL → Coral executes across 5 sources
   → results in 1.4s → GPT narrates the findings. All local."

Tweet 5:
  "Blast Radius: click any finding → force-directed graph of every
   repo, channel, secret, and service that account touches.
   One terminated employee. 63 systems. [screenshot]"

Tweet 6 (CTA):
  "Open source. Runs in fixture mode offline.
   Repo: [GITHUB_URL]
   Demo: [DEMO_VIDEO_URL]
   Full build post: [BLOG_URL]"

Post thread. Capture URL of first tweet. Paste into bounty-strategy.md.

──────────────────────────────────────────
STEP 6 — UPDATE bounty-strategy.md
──────────────────────────────────────────
Update the table to show all four bounties submitted:

| Bounty          | Submitted  | URL       | Status    |
|-----------------|------------|-----------|-----------|
| Track 1         | 2026-05-30 | [url]     | submitted |
| Chart New Waters| 2026-05-30 | [pr url]  | submitted |
| Captain's Log   | 2026-05-30 | [blog url]| submitted |
| Tell the Tale   | 2026-05-30 | [post url]| submitted |

──────────────────────────────────────────
ACCEPTANCE
──────────────────────────────────────────
- Four bounty submission URLs exist.
- docs/bounty-strategy.md table has all four rows filled with real URLs.
- Discord post is live.
- LinkedIn post is live.
- Twitter thread is posted (first tweet URL captured).
- Run /judge one final time. Target: no criterion below 8/10.
```

**Acceptance:** Four bounty submission URLs. `docs/bounty-strategy.md`
has all four rows filled. `/judge` returns no criterion below 8/10.

---

## Using the design skills

To maximize UI quality on Prompt 1, add these skills to your Claude Code
environment before running it:

```bash
npx skills add alchaincyf/huashu-design
npx skills add nextlevelbuilder/ui-ux-pro-max-skill
npx skills add BowTiedSwan/animejs-skills
npx skills add leonxlnx/taste-skill
```

Reference material when building:
- https://21st.dev/home — component inspiration
- https://animejs.com/ — anime.js docs
- https://spline.design/ — 3D scene editor
- https://reactflow.dev/ — flow/graph diagrams
- https://github.com/VoltAgent/awesome-claude-design — design patterns

---

## How to run this

- Run prompts sequentially. Don't skip.
- After each prompt: `/sprint-status`
- After Prompts 1, 5, 8: `/brand-check`
- Before Prompt 10: `/judge`
- After Prompt 10: `/score-self`

Total estimated time: **~16 hours** across all 10 prompts (excluding
Prompt 4 live Coral integration, which depends on sandbox access and
may take longer if API tokens need provisioning).

Good luck. ⚓
