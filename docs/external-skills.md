# External Claude skills — manual install

These are third-party Claude Code skills you (or your teammate) should install
**locally** on your machine. They can't be installed from inside this Cowork
session — you have to run the commands yourself.

Once installed, they live in `~/.claude/skills/` and become available to every
Claude Code session on your machine (not just this repo).

## Install everything in one shot

```bash
# Run from anywhere — these are global Claude skills
npx skills add alchaincyf/huashu-design
npx skills add nextlevelbuilder/ui-ux-pro-max-skill
npx skills add BowTiedSwan/animejs-skills
npx skills add leonxlnx/taste-skill
npx skills add Manavarya09/design-extract

# CAD skills (the user flagged this as mandatory)
# See https://www.cadskills.xyz/#installation for the exact install instructions
# at install-time — they distribute multiple skills via a single bundle.
```

After install, verify with:

```bash
ls ~/.claude/skills/
```

You should see folders for each of the above.

## Per-skill use guide

| Skill | When to invoke | Pairs well with |
|---|---|---|
| `huashu-design` | Refined typography + Asian-design sensibility for hero typography and tables | `@brand-keeper` |
| `ui-ux-pro-max-skill` | Comprehensive UI/UX critique, accessibility, hierarchy | `/brand-check` |
| `animejs-skills` | Anime.js patterns for staggered counters, SVG morphs | The Cockpit Risk Score transition |
| `taste-skill` | Aesthetic judgment / "is this beautiful?" | Before recording the demo video |
| `design-extract` | Extract a design from a screenshot or Figma frame | Converting Stitch PNGs to React JSX |
| CAD skills (mandatory) | Per cadskills.xyz docs — use for any 3D or precise-geometry work | Spline ship integration |

## Inspiration sites (no install — for reference)

These don't have installers. They're for *patterns*. The `@ui-inspiration`
project skill maps each Quartermaster screen to its inspiration source.

- [motionsites.ai](https://motionsites.ai/) — animated component patterns
- [vibecodecomponents.com](https://vibecodecomponents.com/) — free components
- [21st.dev/home](https://21st.dev/home) — shadcn-style components
- [thefinch.design](https://thefinch.design/) — design patterns
- [spline.design](https://spline.design/) — create the 3D ship scene here
- [draftly.space/3d-builder](https://www.draftly.space/3d-builder) — 3D builder
- [reactflow.dev](https://reactflow.dev/) — Blast Radius + Schema Graph (npm: `@xyflow/react`, already installed)
- [animejs.com](https://animejs.com/) — animation library (npm: `animejs`, already installed)
- [higgsfield.ai/cli](https://higgsfield.ai/cli) — video generation
- [seedance2.ai](https://seedance2.ai/) — stylized motion shots
- [github.com/VoltAgent/awesome-claude-design](https://github.com/VoltAgent/awesome-claude-design) — the curated awesome list — browse for more

## Workflow once installed

```bash
cd ~/Downloads/quartermaster
claude

# Use a project agent (in this repo's .claude/agents/)
> @brand-keeper

# Use a global skill (from ~/.claude/skills/)
> "use ui-ux-pro-max-skill to review the Cockpit page"

# Pair them
> @brand-keeper @ui-ux-pro-max-skill — sweep src/app/cockpit/page.tsx
```

## If a skill fails to install

- `npx skills add` errors → check the GitHub URL is current; some skills move repos.
- The `npx skills` CLI is part of the Anthropic skill marketplace tooling.
  If `skills` is unrecognized, run `npm install -g @anthropic-ai/skills-cli`
  (check the actual package name on docs.anthropic.com).
