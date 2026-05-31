"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { MessageSquare, Radio, GitFork, Terminal, LayoutGrid } from "lucide-react";

interface FeatureDef {
  number: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  visual: React.ReactNode;
}

// ── Mini visuals ─────────────────────────────────────────────────

function CopilotVisual() {
  const [step, setStep] = useState(0);
  const messages = [
    { role: "user", text: "Show me zombie accounts" },
    { role: "bot", text: "SELECT work_email FROM deel.directory WHERE…" },
    { role: "bot", text: "Found 7 results · $1,240/mo exposure" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % (messages.length + 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-2 p-4 rounded-[var(--radius-md)] bg-[var(--color-code-bg)] border border-[var(--color-border)] text-[11px] font-mono min-h-[120px]">
      {messages.slice(0, step).map((m, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2",
            m.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <span
            className={cn(
              "rounded-[var(--radius-sm)] px-2 py-1 max-w-[85%] leading-relaxed",
              m.role === "user"
                ? "bg-[var(--color-gold)]/15 text-[var(--color-gold)]"
                : "bg-[var(--color-surface)] text-[var(--color-sea)]"
            )}
          >
            {m.text}
          </span>
        </div>
      ))}
      {step <= messages.length && (
        <span className="text-[var(--color-text-dim)] animate-caret">▋</span>
      )}
    </div>
  );
}

function ContinuousVisual() {
  const items = [
    { color: "var(--color-coral)", text: "QM-01 · zombie@corp.com flagged", time: "just now" },
    { color: "var(--color-gold)", text: "QM-03 · $240/mo ghost seat · Figma", time: "2m ago" },
    { color: "var(--color-sea)", text: "QM-02 · admin drift · alice@corp.com", time: "14m ago" },
  ];

  return (
    <div className="flex flex-col gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-code-bg)] border border-[var(--color-border)] text-[10px] font-mono min-h-[120px]">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="h-2 w-2 rounded-full bg-[var(--color-lime)] animate-breath"
          aria-hidden="true"
        />
        <span className="text-[var(--color-text-dim)]">Continuous mode · live</span>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2 py-1.5 animate-row-in"
          style={{ animationDelay: `${i * 400}ms` }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          <span className="flex-1 text-[var(--color-text-muted)]">{item.text}</span>
          <span className="text-[var(--color-text-dim)]">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

function BlastRadiusVisual() {
  const nodes = [
    { x: 50, y: 50, r: 10, color: "var(--color-coral)", label: "alice@" },
    { x: 20, y: 20, r: 6, color: "var(--color-sea)", label: "Okta" },
    { x: 80, y: 15, r: 6, color: "var(--color-gold)", label: "GitHub" },
    { x: 85, y: 75, r: 6, color: "var(--color-lime)", label: "Slack" },
    { x: 15, y: 80, r: 5, color: "var(--color-sea)", label: "Deel" },
    { x: 50, y: 90, r: 5, color: "var(--color-text-dim)", label: "Stripe" },
    { x: 30, y: 55, r: 4, color: "var(--color-text-dim)", label: "repo-1" },
    { x: 70, y: 45, r: 4, color: "var(--color-text-dim)", label: "repo-2" },
  ];
  const center = nodes[0];

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-code-bg)] border border-[var(--color-border)] overflow-hidden min-h-[120px] p-2">
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Blast radius graph">
        {nodes.slice(1).map((node, i) => (
          <line
            key={i}
            x1={center.x}
            y1={center.y}
            x2={node.x}
            y2={node.y}
            stroke={node.color}
            strokeWidth="0.6"
            strokeOpacity="0.4"
          />
        ))}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} fillOpacity="0.2" />
            <circle cx={node.x} cy={node.y} r={node.r * 0.6} fill={node.color} fillOpacity="0.8" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function MCPVisual() {
  const lines = [
    { text: "$ claude code", color: "var(--color-text-dim)" },
    { text: "> run_audit({ id: 'QM-01' })", color: "var(--color-sea)" },
    { text: "✓ 7 zombies found", color: "var(--color-lime)" },
    { text: "> draft_remediation({ finding: ... })", color: "var(--color-sea)" },
    { text: "✓ Slack message drafted", color: "var(--color-lime)" },
  ];

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-code-bg)] border border-[var(--color-border)] p-3 min-h-[120px] font-mono text-[10px]">
      <div className="flex items-center gap-1 mb-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-coral)]" aria-hidden="true" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-gold)]" aria-hidden="true" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lime)]" aria-hidden="true" />
        <span className="ml-2 text-[var(--color-text-dim)]">quartermaster mcp</span>
      </div>
      {lines.map((line, i) => (
        <div
          key={i}
          className="leading-relaxed"
          style={{ color: line.color }}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}

function SchemaVisual() {
  const swimlanes = ["Deel", "Okta", "GitHub", "Slack", "Stripe"];
  const tables = [
    ["directory", "payroll"],
    ["users", "apps"],
    ["commits", "members"],
    ["users", "channels"],
    ["charges", "subs"],
  ];

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-code-bg)] border border-[var(--color-border)] p-3 min-h-[120px] overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {swimlanes.map((lane, i) => (
          <div key={lane} className="flex flex-col gap-1.5">
            <span className="text-[9px] font-mono font-semibold text-[var(--color-sea)] px-1">
              {lane}
            </span>
            {(tables[i] ?? []).map((tbl) => (
              <div
                key={tbl}
                className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[9px] font-mono text-[var(--color-text-muted)] whitespace-nowrap"
              >
                {tbl}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES: FeatureDef[] = [
  {
    number: "01",
    title: "QM Copilot",
    tagline: "Natural language → federated SQL",
    description:
      "Ask in plain English. Copilot compiles it to Coral SQL using the live schema catalog as grounding, streams the results, and narrates what it found.",
    icon: <MessageSquare className="w-5 h-5" />,
    visual: <CopilotVisual />,
  },
  {
    number: "02",
    title: "Continuous Mode",
    tagline: "Audits that never stop watching",
    description:
      "A polling tick re-runs every named audit on a configurable interval and surfaces new findings in a live feed — no manual triggers needed.",
    icon: <Radio className="w-5 h-5" />,
    visual: <ContinuousVisual />,
  },
  {
    number: "03",
    title: "Blast Radius",
    tagline: "Every system one account touches",
    description:
      "Interactive force-directed graph showing every resource linked to a flagged identity — from Okta groups to GitHub repos to Stripe subscriptions.",
    icon: <GitFork className="w-5 h-5" />,
    visual: <BlastRadiusVisual />,
  },
  {
    number: "04",
    title: "Quartermaster as MCP Server",
    tagline: "Callable from Claude Code",
    description:
      "Our audits are themselves an MCP server. Claude Code can call run_audit, get_findings, and draft_remediation as first-class tools.",
    icon: <Terminal className="w-5 h-5" />,
    visual: <MCPVisual />,
  },
  {
    number: "05",
    title: "Schema Graph",
    tagline: "Visual swimlanes of all source tables",
    description:
      "Auto-detected join keys between sources, rendered as an interactive swimlane diagram. See exactly how Coral connects your data before you query.",
    icon: <LayoutGrid className="w-5 h-5" />,
    visual: <SchemaVisual />,
  },
];

interface FeatureRowProps {
  feature: FeatureDef;
  index: number;
}

function FeatureRow({ feature, index }: FeatureRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const isEven = index % 2 === 0;

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    async function runAnim() {
      const { animate } = await import("animejs");
      if (cancelled || !rowRef.current) return;

      animate(rowRef.current, {
        opacity: [0, 1],
        translateX: [isEven ? -40 : 40, 0],
        ease: "outExpo",
        duration: 900,
      });
    }

    runAnim();
    return () => {
      cancelled = true;
    };
  }, [visible, isEven]);

  return (
    <div
      ref={rowRef}
      className={cn(
        "grid gap-8 md:grid-cols-2 md:gap-16 items-center",
        !isEven && "md:direction-rtl"
      )}
      style={{ opacity: 0 }}
    >
      {/* Copy — alternate left/right */}
      <div className={cn("flex flex-col gap-4", !isEven && "md:order-2")}>
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-gold)]"
          >
            {feature.icon}
          </span>
          <span className="font-mono text-xs text-[var(--color-text-dim)]">
            {feature.number}
          </span>
        </div>

        <div>
          <h3 className="mb-1 text-xl font-semibold text-[var(--color-text)]">
            {feature.title}
          </h3>
          <p className="mb-3 text-sm font-medium text-[var(--color-gold)]">
            {feature.tagline}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>

      {/* Visual */}
      <div className={cn(!isEven && "md:order-1")}>{feature.visual}</div>
    </div>
  );
}

export function LandingDifferentiators() {
  return (
    <section
      aria-labelledby="differentiators-heading"
      className="py-20 md:py-32"
    >
      <div className="mx-auto max-w-5xl px-6">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block text-xs font-mono font-medium tracking-widest text-[var(--color-text-dim)] uppercase">
            Five Killer Features
          </span>
          <h2
            id="differentiators-heading"
            className="text-[clamp(1.75rem,4vw,3rem)] font-light text-[var(--color-text)]"
          >
            Built different.{" "}
            <span className="text-[var(--color-coral)]">Audits at the REPL.</span>
          </h2>
        </div>

        {/* Feature rows */}
        <div className="flex flex-col gap-20 md:gap-28">
          {FEATURES.map((feature, i) => (
            <FeatureRow key={feature.number} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
