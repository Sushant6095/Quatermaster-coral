"use client";

/**
 * AuditTile — one card per named audit in the Cockpit grid.
 *
 * Vercel project-card style: thin border, almost-no fill, generous padding,
 * border color change on hover (no lift), "Run →" link not a button.
 */

import { motion } from "framer-motion";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { AuditDefinition, AuditCategory } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { relativeTime } from "@/lib/utils/time";

export interface AuditTileProps extends AuditDefinition {
  /** Lucide icon component (already resolved by the parent). */
  icon: LucideIcon;
  /** Stagger index for entry animation. */
  index?: number;
  /** Optional click handler — wires to the audit run. */
  onRun?: (id: AuditDefinition["id"]) => void;
}

/** Icon wrapper tint per category */
const CATEGORY_ICON_TINT: Record<AuditCategory, string> = {
  Security: "text-[var(--color-coral)]",
  Spend: "text-[var(--color-gold)]",
  Compliance: "text-[var(--color-sea)]",
};

/** Category badge style per category */
const CATEGORY_BADGE: Record<AuditCategory, string> = {
  Security:
    "border-[var(--color-coral)]/30 text-[var(--color-coral)]",
  Spend:
    "border-[var(--color-gold)]/30 text-[var(--color-gold)]",
  Compliance:
    "border-[var(--color-sea)]/30 text-[var(--color-sea)]",
};

/** Source connector chips per audit */
const AUDIT_SOURCES: Record<string, string[]> = {
  "QM-01": ["Deel", "Okta", "GitHub", "Slack"],
  "QM-02": ["Okta", "GitHub"],
  "QM-03": ["Stripe", "Okta"],
  "QM-04": ["Stripe", "Slack"],
  "QM-05": ["Deel", "Okta", "GitHub", "Slack"],
};

export function AuditTile({
  id,
  name,
  category,
  description,
  icon: Icon,
  lastRunIso,
  lastFindingCount,
  index = 0,
  onRun,
}: AuditTileProps) {
  const sources = AUDIT_SOURCES[id] ?? [];

  return (
    <motion.div
      initial={{ y: 8 }}
      animate={{ y: 0 }}
      transition={{
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1 + index * 0.05,
      }}
      className={cn(
        "group flex flex-col rounded-lg border border-[var(--color-border)]",
        "bg-[var(--color-card)]/40 p-5 transition-colors",
        "cursor-pointer hover:border-[var(--color-border-strong)]"
      )}
      onClick={() => onRun?.(id)}
    >
      {/* Top row: icon + audit ID + category badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-card)]">
            <Icon
              className={cn("h-4 w-4", CATEGORY_ICON_TINT[category])}
            />
          </div>
          <span className="font-mono text-[11px] text-[var(--color-text-dim)]">
            {id}
          </span>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
            CATEGORY_BADGE[category]
          )}
        >
          {category}
        </span>
      </div>

      {/* Name */}
      <h3 className="mt-2.5 text-[15px] font-medium text-[var(--color-text)]">
        {name}
      </h3>

      {/* Description */}
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </p>

      {/* Source chips */}
      {sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {sources.map((src) => (
            <span
              key={src}
              className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-dim)]"
            >
              {src}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <span
          className="text-[12px] text-[var(--color-text-dim)]"
          suppressHydrationWarning
        >
          Last run {relativeTime(lastRunIso)} · {lastFindingCount ?? 0} findings
        </span>
        <Link
          href={`/audits/${id}`}
          className="text-[13px] text-[var(--color-gold)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Run →
        </Link>
      </div>
    </motion.div>
  );
}
