"use client";

/**
 * PosturePanel — the left-column "Usage" analog on the Cockpit Overview.
 *
 * Vercel usage-list style: compact metric rows, each with a value, an
 * optional delta pill, and a thin fill bar that animates in via scaleX
 * (compositor-friendly — no layout-bound width animation).
 */

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { CockpitStats } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export interface PosturePanelProps {
  stats: CockpitStats;
}

interface MetricRow {
  label: string;
  value: string;
  /** 0–100 fill for the usage bar. */
  pct: number;
  /** Bar fill color class. */
  bar: string;
  /** Value color class (defaults to primary text). */
  valueClass?: string;
  /** Delta pill — `good` drives lime (down/good) vs coral (up/bad). */
  delta?: { good: boolean; text: string };
  sublabel?: string;
}

/** Denominators that turn raw counts into a sensible 0–100 bar fill. */
const ZOMBIE_BAR_SCALE = 7;
const GHOST_SPEND_CEILING = 8000;
const FINDINGS_CEILING = 30;

function buildRows(s: CockpitStats): MetricRow[] {
  return [
    {
      label: "Risk Score",
      value: String(s.riskScore),
      pct: s.riskScore,
      bar: "bg-[var(--color-coral)]",
      valueClass: "text-[var(--color-coral)]",
      delta: { good: false, text: `+${s.riskDeltaPct}%` },
      sublabel: "Composite across 5 audits",
    },
    {
      label: "Zombie Accounts",
      value: String(s.zombieAccounts),
      pct: Math.min(100, s.zombieAccounts * ZOMBIE_BAR_SCALE),
      bar: "bg-[var(--color-gold)]",
      delta: { good: s.zombieDelta <= 0, text: `${s.zombieDelta} today` },
      sublabel: "Terminated employees · active seats",
    },
    {
      label: "Ghost Spend / mo",
      value: `$${s.ghostSpendUsdMonthly.toLocaleString()}`,
      pct: Math.min(100, (s.ghostSpendUsdMonthly / GHOST_SPEND_CEILING) * 100),
      bar: "bg-[var(--color-gold)]",
      delta: {
        good: s.ghostSpendDeltaUsd <= 0,
        text: `$${Math.abs(s.ghostSpendDeltaUsd)} wk`,
      },
      sublabel: "Unused SaaS licenses",
    },
    {
      label: "Open Findings",
      value: String(s.openFindings),
      pct: Math.min(100, (s.openFindings / FINDINGS_CEILING) * 100),
      bar: "bg-[var(--color-sea)]",
      sublabel: `${s.openP0} P0 · ${s.openP1} P1`,
    },
  ];
}

export function PosturePanel({ stats }: PosturePanelProps) {
  const rows = buildRows(stats);

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-[13px] font-medium text-[var(--color-text)]">
          Posture
        </h2>
        <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">
          Last 30 days
        </span>
      </div>
      <div className="space-y-4 px-4 py-4">
        {rows.map((row, i) => (
          <MetricRowView key={row.label} row={row} index={i} />
        ))}
      </div>
    </section>
  );
}

function MetricRowView({ row, index }: { row: MetricRow; index: number }) {
  const DeltaIcon = row.delta?.good ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] text-[var(--color-text-muted)]">
          {row.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[15px] font-semibold tracking-tight tabular-nums",
              row.valueClass ?? "text-[var(--color-text)]"
            )}
          >
            {row.value}
          </span>
          {row.delta && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[10px] font-medium",
                row.delta.good
                  ? "bg-[var(--color-lime)]/10 text-[var(--color-lime)]"
                  : "bg-[var(--color-coral)]/10 text-[var(--color-coral)]"
              )}
            >
              <DeltaIcon className="h-2.5 w-2.5" />
              {row.delta.text}
            </span>
          )}
        </div>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-[var(--color-border)]/50">
        <motion.div
          className={cn("h-full w-full origin-left rounded-full", row.bar)}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: row.pct / 100 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.15 + index * 0.08,
          }}
        />
      </div>

      {row.sublabel && (
        <span className="block text-[11px] text-[var(--color-text-dim)]">
          {row.sublabel}
        </span>
      )}
    </div>
  );
}
