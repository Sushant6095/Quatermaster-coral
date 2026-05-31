"use client";

/**
 * PosturePanel — the left-column metrics on the Cockpit Overview.
 *
 * Vercel usage-card style: each metric shows a value, a delta pill, and a
 * sparkline (scaleY-animated bars, compositor-friendly). Neutral + blue
 * accent + coral for risk — no gold.
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
  valueClass?: string;
  delta?: { good: boolean; text: string };
  sublabel?: string;
  /** Sparkline bar heights, 0–1 (static so SSR/CSR match). */
  spark: number[];
  /** Sparkline color class. */
  barClass: string;
}

function buildRows(s: CockpitStats): MetricRow[] {
  return [
    {
      label: "Risk Score",
      value: String(s.riskScore),
      valueClass: "text-[var(--color-coral)]",
      delta: { good: false, text: `+${s.riskDeltaPct}%` },
      sublabel: "Composite across 5 audits",
      spark: [0.3, 0.34, 0.4, 0.38, 0.48, 0.55, 0.6, 0.58, 0.7, 0.76, 0.86, 1],
      barClass: "bg-[var(--color-coral)]",
    },
    {
      label: "Zombie Accounts",
      value: String(s.zombieAccounts),
      delta: { good: s.zombieDelta <= 0, text: `${s.zombieDelta} today` },
      sublabel: "Terminated employees · active seats",
      spark: [0.5, 0.72, 0.42, 0.82, 0.6, 0.9, 0.55, 0.7, 0.86, 0.6, 0.78, 0.66],
      barClass: "bg-[var(--color-accent)]",
    },
    {
      label: "Ghost Spend / mo",
      value: `$${s.ghostSpendUsdMonthly.toLocaleString()}`,
      delta: {
        good: s.ghostSpendDeltaUsd <= 0,
        text: `$${Math.abs(s.ghostSpendDeltaUsd)} wk`,
      },
      sublabel: "Unused SaaS licenses",
      spark: [0.9, 0.86, 0.8, 0.82, 0.7, 0.72, 0.64, 0.6, 0.62, 0.54, 0.5, 0.47],
      barClass: "bg-[var(--color-accent)]",
    },
    {
      label: "Open Findings",
      value: String(s.openFindings),
      sublabel: `${s.openP0} P0 · ${s.openP1} P1`,
      spark: [0.4, 0.5, 0.44, 0.6, 0.55, 0.5, 0.66, 0.6, 0.72, 0.6, 0.7, 0.74],
      barClass: "bg-[var(--color-accent)]",
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
      <div className="divide-y divide-[var(--color-border)]/60">
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
    <div className="px-4 py-3.5">
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
                "flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium",
                row.delta.good
                  ? "bg-[var(--color-success)]/12 text-[var(--color-success)]"
                  : "bg-[var(--color-coral)]/12 text-[var(--color-coral)]"
              )}
            >
              <DeltaIcon className="h-2.5 w-2.5" />
              {row.delta.text}
            </span>
          )}
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-2.5 flex h-6 items-end gap-[3px]">
        {row.spark.map((h, b) => (
          <motion.div
            key={b}
            className={cn(
              "flex-1 origin-bottom rounded-[1px]",
              row.barClass,
              b === row.spark.length - 1 ? "opacity-100" : "opacity-30"
            )}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1 + index * 0.06 + b * 0.02,
            }}
            style={{ height: `${Math.max(8, h * 100)}%` }}
          />
        ))}
      </div>

      {row.sublabel && (
        <span className="mt-2 block text-[11px] text-[var(--color-text-dim)]">
          {row.sublabel}
        </span>
      )}
    </div>
  );
}
