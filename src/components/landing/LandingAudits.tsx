"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface AuditDef {
  id: string;
  name: string;
  description: string;
  sources: string[];
  sql: string;
  findingsCount: number;
  severity: "critical" | "high" | "medium";
}

const AUDITS: AuditDef[] = [
  {
    id: "QM-01",
    name: "Zombie Account Hunter",
    description:
      "Inactive employees still holding active accounts or admin roles across Deel, Okta, GitHub, and Slack.",
    sources: ["Deel", "Okta", "GitHub", "Slack"],
    sql: `SELECT d.work_email, o.status, g.login
FROM deel.directory d
LEFT JOIN okta.users o ON o.email = d.work_email
LEFT JOIN github.members g ON g.email = d.work_email
WHERE d.is_active = false
  AND (o.status = 'ACTIVE' OR g.login IS NOT NULL)`,
    findingsCount: 7,
    severity: "critical",
  },
  {
    id: "QM-02",
    name: "Permission Drift",
    description:
      "Active employees holding elevated admin permissions unused for 90+ days.",
    sources: ["Okta", "GitHub"],
    sql: `SELECT a.user_email, a.app_name, a.role, a.last_used_at
FROM okta.app_assignments a
WHERE a.role = 'admin'
  AND a.last_used_at < NOW() - INTERVAL '90 days'
ORDER BY a.last_used_at ASC`,
    findingsCount: 12,
    severity: "high",
  },
  {
    id: "QM-03",
    name: "Ghost-Seat Spend",
    description:
      "Paid SaaS seats with zero activity in 30 days — quantified in $/mo.",
    sources: ["Stripe", "GitHub"],
    sql: `SELECT s.product_name, s.monthly_amount_cents / 100.0 AS monthly_usd,
       s.customer_email
FROM stripe.subscriptions s
WHERE s.customer_email NOT IN (
  SELECT DISTINCT author_email FROM github.commits
  WHERE committed_at > NOW() - INTERVAL '30 days'
)`,
    findingsCount: 4,
    severity: "high",
  },
  {
    id: "QM-04",
    name: "Shadow-IT Detector",
    description:
      "Off-list Stripe charges plus Slack mentions of unapproved SaaS tools.",
    sources: ["Stripe", "Slack"],
    sql: `SELECT c.amount_cents / 100.0 AS usd, c.statement_descriptor,
       c.created_at
FROM stripe.charges c
WHERE c.statement_descriptor NOT IN (
  SELECT vendor_name FROM approved_vendors
)
ORDER BY c.amount_cents DESC`,
    findingsCount: 3,
    severity: "medium",
  },
  {
    id: "QM-05",
    name: "Compliance Ledger",
    description:
      "SOC2 evidence pack per terminated employee — cross-checked across all five sources.",
    sources: ["Deel", "Okta", "GitHub", "Slack", "Stripe"],
    sql: `SELECT t.work_email, o.status AS okta_status,
       g.login AS github_login, s.message_count AS slack_msgs
FROM deel.directory t
LEFT JOIN okta.users o ON o.email = t.work_email
LEFT JOIN github.members g ON g.email = t.work_email
LEFT JOIN slack.users s ON s.email = t.work_email
WHERE t.termination_date IS NOT NULL`,
    findingsCount: 2,
    severity: "medium",
  },
];

const SEVERITY_COLORS: Record<AuditDef["severity"], string> = {
  critical: "var(--color-coral)",
  high: "var(--color-gold)",
  medium: "var(--color-sea)",
};

const SEVERITY_LABELS: Record<AuditDef["severity"], string> = {
  critical: "P0 Critical",
  high: "P1 High",
  medium: "P2 Medium",
};

interface AuditCardProps {
  audit: AuditDef;
  index: number;
}

function AuditCard({ audit, index }: AuditCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const sqlRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [sqlText, setSqlText] = useState("");

  useEffect(() => {
    const el = cardRef.current;
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

  // Type-writer SQL reveal
  useEffect(() => {
    if (!visible) return;

    let i = 0;
    const sql = audit.sql;
    const delay = index * 150;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setSqlText(sql.slice(0, i));
        if (i >= sql.length) clearInterval(interval);
      }, 14);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [visible, audit.sql, index]);

  const severityColor = SEVERITY_COLORS[audit.severity];

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-card)]/80 p-6 backdrop-blur-md",
        "transition-all duration-300 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-card-hover)]",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      )}
      style={{
        transitionDelay: visible ? `${index * 80}ms` : "0ms",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-xs font-semibold"
            style={{ color: severityColor }}
          >
            {audit.id}
          </span>
          <h3 className="text-base font-semibold text-[var(--color-text)]">
            {audit.name}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="rounded-[var(--radius-pill)] border px-2 py-0.5 text-[10px] font-medium"
            style={{
              borderColor: `${severityColor}40`,
              color: severityColor,
              backgroundColor: `${severityColor}10`,
            }}
          >
            {SEVERITY_LABELS[audit.severity]}
          </span>
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-text-dim)]">
            {audit.findingsCount} findings
          </span>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
        {audit.description}
      </p>

      {/* Source chips */}
      <div className="flex flex-wrap gap-1.5">
        {audit.sources.map((src) => (
          <span
            key={src}
            className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-dim)]"
          >
            {src}
          </span>
        ))}
      </div>

      {/* SQL snippet */}
      <div className="rounded-[var(--radius-md)] bg-[var(--color-code-bg)] border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-coral)]/60" aria-hidden="true" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]/60" aria-hidden="true" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-lime)]/60" aria-hidden="true" />
          <span className="ml-2 text-[10px] text-[var(--color-text-dim)]">coral.sql</span>
        </div>
        <pre className="overflow-x-auto p-3 text-[11px] leading-relaxed">
          <code
            ref={sqlRef}
            className="font-mono text-[var(--color-sea)]"
            aria-label={`SQL for ${audit.name}`}
          >
            {sqlText}
            {visible && sqlText.length < audit.sql.length && (
              <span className="animate-caret text-[var(--color-gold)]">▋</span>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

export function LandingAudits() {
  return (
    <section
      id="audits"
      aria-labelledby="audits-heading"
      className="py-20 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="mb-12 flex flex-col gap-3">
          <span className="text-xs font-mono font-medium tracking-widest text-[var(--color-text-dim)] uppercase">
            Five Named Audits
          </span>
          <h2
            id="audits-heading"
            className="text-[clamp(1.75rem,4vw,3rem)] font-light text-[var(--color-text)]"
          >
            Every audit ships with{" "}
            <span className="text-[var(--color-gold)]">SQL you can read.</span>
          </h2>
          <p className="max-w-xl text-base text-[var(--color-text-muted)]">
            No black-box ML. No vendor lock-in. Pure federated SQL joining your
            live sources — open in the playground, fork them freely.
          </p>
        </div>

        {/* 2-col grid on desktop */}
        <div className="grid gap-4 md:grid-cols-2">
          {AUDITS.map((audit, i) => (
            <AuditCard key={audit.id} audit={audit} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
