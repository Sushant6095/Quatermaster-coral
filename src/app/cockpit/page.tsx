"use client";

/**
 * /cockpit — the Risk Cockpit hero screen.
 *
 * Header chrome + KPI row + active-audit grid + (optional) live feed.
 * Client component so the Continuous-Mode toggle and the simulated
 * Live Feed can hold local state without a server round-trip.
 */

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  KeyRound,
  Wallet,
  EyeOff,
  ScrollText,
  RefreshCw,
  PlayCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatCard } from "@/components/cockpit/StatCard";
import { AuditTile } from "@/components/cockpit/AuditTile";
import { LiveFeed } from "@/components/cockpit/LiveFeed";
import {
  mockAudits,
  mockCockpitStats,
  mockLiveFeed,
} from "@/lib/fixtures/cockpit";
import type { AuditId, Finding } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

/** Lucide icon per audit — kept in one place so the grid stays declarative. */
const AUDIT_ICONS: Record<AuditId, LucideIcon> = {
  "QM-01": ShieldAlert,
  "QM-02": KeyRound,
  "QM-03": Wallet,
  "QM-04": EyeOff,
  "QM-05": ScrollText,
};

const MAX_FEED_ITEMS = 50;

export default function CockpitPage() {
  const s = mockCockpitStats;
  // Continuous Mode toggle — when ON we render the live feed below.
  const [continuous, setContinuous] = useState<boolean>(true);
  const [liveFeed, setLiveFeed] = useState<Finding[]>(mockLiveFeed);

  useEffect(() => {
    if (!continuous) return;

    const es = new EventSource("/api/continuous/stream");

    es.onmessage = (event: MessageEvent<string>) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "event" in parsed &&
        (parsed as { event: unknown }).event === "finding" &&
        "data" in parsed
      ) {
        const finding = (parsed as { event: string; data: Finding }).data;
        setLiveFeed((prev) => [finding, ...prev].slice(0, MAX_FEED_ITEMS));
      }
    };

    return () => {
      es.close();
    };
  }, [continuous]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      {/* ---------- Page header ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text)]">
            Risk Cockpit
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            Real-time view of security posture and access drift
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setContinuous((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] font-medium transition-colors",
              continuous
                ? "border-[var(--color-lime)]/40 bg-[var(--color-lime)]/10 text-[var(--color-lime)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
            )}
            aria-pressed={continuous}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                continuous
                  ? "animate-breath bg-[var(--color-lime)]"
                  : "bg-[var(--color-text-dim)]"
              )}
            />
            Continuous Mode
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-[13px] font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-card)]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh now
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-gold)] px-3 py-2 text-[13px] font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-gold-hover)]"
          >
            <PlayCircle className="h-4 w-4" />
            Run All Audits
          </button>
        </div>
      </header>

      {/* ---------- KPI row ---------- */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          label="Risk Score"
          value={String(s.riskScore)}
          tone="coral"
          delta={{ dir: "up", pct: `+${s.riskDeltaPct}% wk` }}
          sublabel="Composite across 5 audits"
        />
        <StatCard
          index={1}
          label="Zombie Accounts"
          value={String(s.zombieAccounts)}
          delta={{ dir: "down", pct: `${s.zombieDelta} today` }}
          sublabel="Terminated employees with active seats"
        />
        <StatCard
          index={2}
          label="Ghost Spend / Month"
          value={`$${s.ghostSpendUsdMonthly.toLocaleString()}`}
          delta={{ dir: "down", usd: `$${Math.abs(s.ghostSpendDeltaUsd)} wk` }}
          sublabel="Unused SaaS licenses"
        />
        <StatCard
          index={3}
          label="Open Findings"
          value={String(s.openFindings)}
          tone="gold"
          sublabel={`${s.openP0} P0 · ${s.openP1} P1`}
        />
      </section>

      {/* ---------- Active Audits ---------- */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-[var(--color-text)]">
            Active Audits
          </h2>
          <a
            href="/audits"
            className="text-[12px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-gold)]"
          >
            View all{" "}
            <span className="ml-0.5 text-[var(--color-gold)]">↗</span>
          </a>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockAudits.map((a, i) => (
            <AuditTile
              key={a.id}
              {...a}
              icon={AUDIT_ICONS[a.id]}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* ---------- Live Feed (only when Continuous Mode is on) ---------- */}
      {continuous && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--color-text)]">
              Live Feed
            </h2>
            <span className="font-mono text-[11px] text-[var(--color-text-dim)]">
              {liveFeed.length} recent
            </span>
          </div>
          <div className="mt-4">
            <LiveFeed items={liveFeed} isLive={continuous} />
          </div>
        </section>
      )}
    </div>
  );
}
