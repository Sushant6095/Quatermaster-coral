"use client";

/**
 * /docs — the product showcase. Vercel-docs composition (left section nav,
 * prose + diagrams, right "on this page" TOC) on the light landing theme.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { QMLogo } from "@/components/brand/QMLogo";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MermaidDiagram } from "@/components/docs/MermaidDiagram";
import { mockAudits } from "@/lib/fixtures/cockpit";
import { cn } from "@/lib/utils/cn";

interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: "overview", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "federation", label: "Coral federation" },
  { id: "audits", label: "The five audits" },
  { id: "copilot", label: "QM Copilot" },
  { id: "continuous", label: "Continuous Mode" },
  { id: "blast-radius", label: "Blast Radius" },
  { id: "mcp", label: "MCP server" },
  { id: "quickstart", label: "Quickstart" },
];

const CHART_SYSTEM = `flowchart TB
    subgraph UI["Browser — Next.js 16 · React 19 · Three.js"]
        direction LR
        LP["Landing"] & CK["Risk Cockpit"] & CP["QM Copilot"] & AR["Audit Runner"] & BR["Blast Radius"]
    end
    subgraph API["Next.js API Routes — Node 22 · better-sqlite3"]
        direction LR
        R1["audits/run — SSE"]
        R2["copilot/ask — SSE"]
        R3["continuous/stream — SSE"]
        R5["ledger — SHA-256"]
    end
    subgraph CORAL["Coral — Apache DataFusion over MCP stdio"]
        FE["Federated Executor"]
        SC["Schema Catalog"]
        LC["Local Row Cache + TTL"]
        FE --- SC
        FE --- LC
    end
    subgraph CLAUDE["Claude Sonnet 4.6 — Anthropic SDK"]
        SA["SQL Author"]
        FN["Finding Narrator"]
        RD["Remediation Drafter"]
    end
    subgraph SOURCES["Data Sources"]
        D[("Deel")]
        O[("Okta")]
        G[("GitHub")]
        S[("Slack")]
        ST[("Stripe")]
    end
    UI -->|"HTTP + SSE"| API
    API -->|"MCP stdio"| CORAL
    API -->|"Anthropic SDK"| CLAUDE
    CORAL -->|"REST APIs"| SOURCES`;

const CHART_FEDERATION = `flowchart LR
    subgraph DEEL["Deel — HRIS"]
        D1["directory — work_email KEY"]
        D2["contracts — status, term_date"]
    end
    subgraph OKTA["Okta — Identity"]
        O1["users — email KEY, status"]
        O2["app_assignments — role, last_used"]
    end
    subgraph GITHUB["GitHub — Code"]
        G1["members — email KEY, role"]
        G2["commits — author__email KEY"]
    end
    subgraph SLACK["Slack — Chat"]
        SL1["members — profile__email KEY"]
    end
    subgraph STRIPE["Stripe — Billing"]
        ST1["customers — email KEY"]
        ST2["subscriptions — monthly_amount"]
    end
    subgraph CORAL["Coral — DataFusion — MCP stdio"]
        JOIN["JOIN on LOWER email"]
        EXEC["Federated SELECT — under 1.4s"]
        JOIN --> EXEC
    end
    OUT["7 zombie accounts — 4820/mo at risk"]
    D1 & O1 & G1 & SL1 & ST1 -->|"email join KEY"| JOIN
    D2 & O2 & G2 & ST2 --> EXEC
    EXEC --> OUT`;

const CHART_COPILOT = `sequenceDiagram
    autonumber
    actor U as User
    participant C as Copilot UI
    participant CL as Claude Sonnet 4.6
    participant V as SQL Validator
    participant CR as Coral Engine
    U->>C: "Find zombies with GitHub commits"
    C->>CL: compileSQL(question + schemaCatalog)
    Note over CL: Grounded on Coral schema catalog
    CL-->>C: SELECT ... reasoning
    C->>V: validateSQL(sql)
    alt Validation fails — up to 3 retries
        V-->>C: Unknown schema
        C->>CL: recompile with error feedback
        CL-->>C: revised SQL
    end
    V-->>C: valid — SELECT/WITH only
    C->>CR: executeSQL over MCP stdio
    CR-->>C: rows, durationMs, sourcesUsed
    C->>CL: narrateFindings(rows)
    CL-->>C: summary + perRowRationales
    C-->>U: SSE done — 5 sources, 4820 rows`;

const CHART_CONTINUOUS = `flowchart LR
    subgraph LOOP["Continuous Loop — every 30s"]
        direction TB
        T["Tick starts"]
        RQ["runAudit QM-01"]
        DIFF{"Diff vs cache"}
        CACHE[("Map of email to Finding")]
        NEW["Net-new findings"]
        EMIT["Emit to EventEmitter"]
        WAIT["Wait interval"]
        T --> RQ --> DIFF
        DIFF -->|"no change"| WAIT
        DIFF -->|"new rows"| NEW --> EMIT --> WAIT
        CACHE --> DIFF
        WAIT --> T
    end
    subgraph CLIENT["Cockpit Client"]
        ES["EventSource — Live ON"]
        LF["LiveFeed — max 50"]
        ES --> LF
    end
    EMIT --> ES`;

const CHART_BLAST = `flowchart TB
    PE["Input: mark.reyes@acme.corp"]
    subgraph QUERIES["Coral reachability queries — parallel"]
        Q1["github.members — repos"]
        Q2["slack.members — channels"]
        Q3["github.repository_secrets"]
        Q5["stripe.customers — billing"]
    end
    subgraph GRAPH["Graph"]
        NODES["47 nodes — person, repo, channel, secret"]
        EDGES["60 edges — admin, member, reads-secret"]
    end
    PE --> Q1 & Q2 & Q3 & Q5
    Q1 & Q2 & Q3 & Q5 --> NODES & EDGES`;

const AUDIT_BLURB: Record<string, string> = {
  "QM-01": "Inactive employees still holding active accounts or admin roles.",
  "QM-02": "Active employees with elevated permissions unused 90+ days.",
  "QM-03": "Paid seats with zero activity in 30 days, quantified in $/mo.",
  "QM-04": "Off-list Stripe charges correlated with Slack mentions.",
  "QM-05": "SOC2 evidence pack assembled per terminated employee.",
};

export default function DocsPage() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  // Smooth anchor scrolling for the duration of this page.
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  // Scrollspy — highlight the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp-light min-h-screen bg-[var(--lp-surface)] text-[var(--lp-ink)]">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-[var(--lp-border)] bg-[var(--lp-surface)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[var(--lp-ink)]"
            aria-label="Quartermaster home"
          >
            <QMLogo size={22} />
            <span className="font-bold tracking-tight">QUARTERMASTER</span>
            <span className="ml-1 rounded-[var(--radius-pill)] border border-[var(--lp-border)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--lp-ink-dim)]">
              Docs
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/Sushant6095/Quatermaster-coral"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--lp-ink-soft)] transition-colors hover:text-[var(--lp-ink)]"
              aria-label="GitHub"
            >
              <BrandLogo name="github" size={18} />
            </a>
            <Link
              href="/cockpit"
              className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--lp-ink)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Enter Cockpit
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-6">
        {/* Left section nav */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="sticky top-20 flex flex-col gap-0.5 py-10">
            <span className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--lp-ink-dim)]">
              Product
            </span>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  active === s.id
                    ? "bg-[var(--lp-surface-2)] font-medium text-[var(--lp-ink)]"
                    : "text-[var(--lp-ink-soft)] hover:text-[var(--lp-ink)]"
                )}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 py-10">
          <article className="max-w-3xl">
            <Section id="overview" title="Quartermaster">
              <p className="lead">
                Quartermaster joins your HRIS, identity provider, code platform,
                chat, and billing — in a single federated SQL query — to find
                zombie accounts, ghost seats, shadow IT, and compliance drift.
              </p>
              <p>
                The agent (Claude Sonnet 4.6 over MCP) drives a conversational
                interface, narrates findings, and drafts remediation. The SQL
                does the joins. Everything runs on your machine.{" "}
                <strong>PII never leaves.</strong>
              </p>
              <StatRow />
            </Section>

            <Section id="architecture" title="Architecture">
              <p>
                A Next.js frontend talks to API routes over HTTP + SSE. Those
                routes call Coral (Apache DataFusion over MCP stdio) for
                federated SQL and Claude for authoring, narration, and
                remediation. Coral caches source rows locally and joins them at
                query time.
              </p>
              <MermaidDiagram chart={CHART_SYSTEM} caption="Full system — browser → API → Coral + Claude → sources" />
            </Section>

            <Section id="federation" title="Coral federation">
              <p>
                The core trick: five sources, one query. Coral federates over
                MCP and joins on a normalized <Code>LOWER(email)</Code> key —
                no warehouse, no ETL, no data movement.
              </p>
              <MermaidDiagram chart={CHART_FEDERATION} caption="Five sources joined on email in one federated SELECT" />
            </Section>

            <Section id="audits" title="The five audits">
              <p>
                Five named, reproducible audits. Each is a SQL template plus the
                source rows it touched — no black box.
              </p>
              <div className="not-prose mt-6 grid gap-3 sm:grid-cols-2">
                {mockAudits.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-[var(--radius-lg)] border border-[var(--lp-border)] bg-[var(--lp-surface)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[var(--lp-ink-dim)]">
                        {a.id}
                      </span>
                      <span className="rounded-[var(--radius-pill)] border border-[var(--lp-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--lp-ink-soft)]">
                        {a.category}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[15px] font-semibold text-[var(--lp-ink)]">
                      {a.name}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--lp-ink-soft)]">
                      {AUDIT_BLURB[a.id] ?? a.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {a.sources.map((src) => (
                        <BrandLogo key={src} name={src} size={16} colored title={src} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="copilot" title="QM Copilot">
              <p>
                Chat that compiles natural language to federated SQL, grounded
                on Coral&apos;s schema catalog. Invalid SQL is fed back to Claude
                and recompiled — up to three retries — before it ever executes.
              </p>
              <MermaidDiagram chart={CHART_COPILOT} caption="NL → validated SQL → execute → narrate, streamed over SSE" />
            </Section>

            <Section id="continuous" title="Continuous Mode">
              <p>
                Quartermaster polls sources on a tick, diffs results against a
                local cache, and streams only net-new findings into the
                Cockpit&apos;s live feed.
              </p>
              <MermaidDiagram chart={CHART_CONTINUOUS} caption="Tick → diff → emit net-new findings over SSE" />
            </Section>

            <Section id="blast-radius" title="Blast Radius">
              <p>
                For any account, parallel Coral reachability queries build an
                interactive force-directed graph of every system it touches —
                repos, channels, secrets, services.
              </p>
              <MermaidDiagram chart={CHART_BLAST} caption="One account → parallel reachability queries → graph" />
            </Section>

            <Section id="mcp" title="MCP server">
              <p>
                Quartermaster&apos;s own audits are exposed as an MCP server —
                Claude Code can call <Code>run_audit</Code>,{" "}
                <Code>get_findings</Code>, and <Code>draft_remediation</Code> as
                tools. The audit engine is both a product and a primitive.
              </p>
            </Section>

            <Section id="quickstart" title="Quickstart">
              <p>
                No tokens needed — fixture mode ships canned source data so the
                full demo runs offline:
              </p>
              <CodeBlock>QM_FIXTURES=on pnpm demo</CodeBlock>
              <p className="mt-4">
                Then open the{" "}
                <Link href="/cockpit" className="underline decoration-[var(--lp-border)] underline-offset-4 hover:text-[var(--lp-ink)]">
                  Risk Cockpit
                </Link>{" "}
                and toggle Continuous Mode.
              </p>
            </Section>
          </article>
        </main>

        {/* Right TOC */}
        <aside className="hidden w-48 shrink-0 xl:block">
          <div className="sticky top-20 py-10">
            <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--lp-ink-dim)]">
              On this page
            </span>
            <ul className="flex flex-col gap-1.5 border-l border-[var(--lp-border)]">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={cn(
                      "-ml-px block border-l-2 pl-3 text-[12px] transition-colors",
                      active === s.id
                        ? "border-[var(--lp-gold)] text-[var(--lp-ink)]"
                        : "border-transparent text-[var(--lp-ink-dim)] hover:text-[var(--lp-ink-soft)]"
                    )}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-[var(--lp-border)] py-10 first:border-t-0 first:pt-0 [&_p]:mt-4 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-[var(--lp-ink-soft)] [&_.lead]:text-[18px] [&_.lead]:text-[var(--lp-ink)] [&_strong]:text-[var(--lp-ink)] [&_strong]:font-semibold"
    >
      <h2 className="text-[26px] font-bold tracking-tight text-[var(--lp-ink)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[var(--lp-surface-2)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--lp-ink)]">
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--lp-border)] bg-[#0A0A0A]">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="ml-2 text-[11px] text-white/40">bash</span>
      </div>
      <pre className="overflow-x-auto px-4 py-4">
        <code className="font-mono text-[13px] text-[var(--color-sea)]">
          <span className="mr-2 text-white/40">$</span>
          {children}
        </code>
      </pre>
    </div>
  );
}

function StatRow() {
  const stats = [
    { value: "5", label: "sources federated" },
    { value: "1.4s", label: "query execution" },
    { value: "$4,820/mo", label: "waste surfaced" },
    { value: "0", label: "PII bytes leaked" },
  ];
  return (
    <div className="not-prose mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-[var(--radius-lg)] border border-[var(--lp-border)] bg-[var(--lp-surface)] p-4"
        >
          <div className="text-[22px] font-bold tracking-tight text-[var(--lp-ink)]">
            {s.value}
          </div>
          <div className="mt-1 text-[12px] text-[var(--lp-ink-dim)]">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
