"use client";

/**
 * AuditTile — one card per named audit in the Cockpit grid.
 *
 * Shape:
 *  - top row: category-tinted icon + title + 1-line description
 *  - footer:  mono stat line  +  gold "Run now →" affordance
 *  - hover:   gold border, slight lift, button flips to filled
 */

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { AuditDefinition, AuditCategory } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export interface AuditTileProps extends AuditDefinition {
  /** Lucide icon component (already resolved by the parent). */
  icon: LucideIcon;
  /** Stagger index for entry animation. */
  index?: number;
  /** Optional click handler — wires to the audit run. */
  onRun?: (id: AuditDefinition["id"]) => void;
}

const CATEGORY_TINT: Record<AuditCategory, string> = {
  Security: "text-[var(--color-coral)] bg-[var(--color-coral)]/10",
  Spend: "text-[var(--color-gold)] bg-[var(--color-gold)]/10",
  Compliance: "text-[var(--color-sea)] bg-[var(--color-sea)]/10",
};

/** Relative "Xm ago / Xh ago / Xd ago" from an ISO timestamp. */
function relativeTime(iso?: string): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function AuditTile({
  id,
  name,
  category,
  description,
  icon: Icon,
  lastRunIso,
  lastFindingCount,
  avgDurationMs,
  index = 0,
  onRun,
}: AuditTileProps) {
  const durationSec = avgDurationMs ? (avgDurationMs / 1000).toFixed(1) : "—";

  return (
    <motion.div
      initial={{ y: 8 }}
      animate={{ y: 0 }}
      transition={{
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1 + index * 0.05,
      }}
      whileHover={{ y: -2 }}
      className={cn(
        "group flex flex-col gap-4 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] p-5",
        "transition-colors hover:border-[var(--color-gold)]/70"
      )}
    >
      {/* Header row: icon + audit id pill */}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            CATEGORY_TINT[category]
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
          {id}
        </span>
      </div>

      {/* Title + description */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[16px] font-medium text-[var(--color-text)]">
          {name}
        </h3>
        <p className="line-clamp-1 text-[12px] text-[var(--color-text-muted)]">
          {description}
        </p>
      </div>

      {/* Footer: stat line + Run now */}
      <div className="mt-2 flex items-end justify-between border-t border-[var(--color-border)] pt-4">
        <div className="font-mono text-[11px] text-[var(--color-text-muted)]">
          Last run {relativeTime(lastRunIso)} ·{" "}
          {lastFindingCount ?? 0}f · Avg {durationSec}s
        </div>
        <button
          type="button"
          onClick={() => onRun?.(id)}
          className={cn(
            "flex items-center gap-1 rounded-md border border-transparent px-2.5 py-1 text-[12px] font-medium",
            "text-[var(--color-gold)] transition-colors",
            "group-hover:border-[var(--color-gold)] group-hover:bg-[var(--color-gold)] group-hover:text-[var(--color-bg)]"
          )}
        >
          Run now
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
