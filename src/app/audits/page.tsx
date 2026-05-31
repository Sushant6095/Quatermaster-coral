"use client";

/**
 * /audits — Audits Library (index).
 *
 * Lists all five named audits with sources, category, and quick-run.
 * Reuses the fixtures from the Cockpit so labels and stats stay
 * consistent between the two surfaces.
 */

import Link from "next/link";
import { useState } from "react";
import {
  ShieldAlert,
  KeyRound,
  Wallet,
  EyeOff,
  ScrollText,
  ArrowRight,
  History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mockAudits } from "@/lib/fixtures/cockpit";
import { cn } from "@/lib/utils/cn";
import type { AuditCategory, AuditId, SourceKey } from "@/lib/types";
import { useTimelineReveal } from "@/lib/anime/useAnime";

const AUDIT_ICONS: Record<AuditId, LucideIcon> = {
  "QM-01": ShieldAlert,
  "QM-02": KeyRound,
  "QM-03": Wallet,
  "QM-04": EyeOff,
  "QM-05": ScrollText,
};

const CATEGORY_FILTERS: Array<{ key: "all" | AuditCategory; label: string }> = [
  { key: "all", label: "All" },
  { key: "Security", label: "Security" },
  { key: "Spend", label: "Spend" },
  { key: "Compliance", label: "Compliance" },
];

const CATEGORY_TONE: Record<AuditCategory, string> = {
  Security: "text-[var(--color-coral)] bg-[var(--color-coral)]/10 border-[var(--color-coral)]/30",
  Spend: "text-[var(--color-gold)] bg-[var(--color-gold)]/10 border-[var(--color-gold)]/30",
  Compliance: "text-[var(--color-sea)] bg-[var(--color-sea)]/10 border-[var(--color-sea)]/30",
};

const SOURCE_LABELS: Record<SourceKey, string> = {
  deel: "Deel",
  okta: "Okta",
  github: "GitHub",
  slack: "Slack",
  stripe: "Stripe",
  linear: "Linear",
};

function formatRelative(iso: string | undefined): string {
  if (!iso) return "Never run";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AuditsLibraryPage() {
  const gridRef = useTimelineReveal<HTMLDivElement>({ stagger: 60, y: 18 });
  const [filter, setFilter] = useState<"all" | AuditCategory>("all");

  const filtered =
    filter === "all" ? mockAudits : mockAudits.filter((a) => a.category === filter);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audits</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Five federated SQL audits over your connected sources.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/60 p-1">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-[var(--color-card)] text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div ref={gridRef} className="flex flex-col gap-4">
        {filtered.map((audit) => {
          const Icon = AUDIT_ICONS[audit.id];
          return (
            <div
              key={audit.id}
              data-animate
              className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition-colors hover:border-[var(--color-gold)]/40 hover:bg-[var(--color-card-hover)]"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex flex-1 items-start gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                      CATEGORY_TONE[audit.category]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-gold)]">
                        {audit.id}
                      </span>
                      <span
                        className={cn(
                          "rounded-pill border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                          CATEGORY_TONE[audit.category]
                        )}
                      >
                        {audit.category}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-lg font-medium tracking-tight">
                      {audit.name}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {audit.description}
                    </p>
                    {/* Source chips */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {audit.sources.map((s) => (
                        <span
                          key={s}
                          className="rounded-pill border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]"
                        >
                          {SOURCE_LABELS[s]}
                        </span>
                      ))}
                    </div>
                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-4 text-[11px] text-[var(--color-text-muted)]">
                      <span>
                        Last run{" "}
                        <span className="text-[var(--color-text)]">
                          {formatRelative(audit.lastRunIso)}
                        </span>
                      </span>
                      <span>·</span>
                      <span>
                        <span className="text-[var(--color-text)]">
                          {audit.lastFindingCount ?? 0}
                        </span>{" "}
                        findings
                      </span>
                      <span>·</span>
                      <span>
                        Avg{" "}
                        <span className="text-[var(--color-text)] font-mono">
                          {((audit.avgDurationMs ?? 1400) / 1000).toFixed(1)}s
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Link
                    href={`/audits/${audit.id}`}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--color-gold)] px-4 py-2 text-xs font-medium text-black hover:bg-[var(--color-gold-hover)]"
                  >
                    Run audit
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/ledger"
                    className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    <History className="h-3 w-3" />
                    View history
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
