"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { LedgerEntry as LedgerEntryType } from "@/lib/types";

interface LedgerEntryProps {
  entry: LedgerEntryType;
  selected?: boolean;
  onClick?: (entry: LedgerEntryType) => void;
  /** Visual classification: revoked | active | verified. Defaults to "revoked". */
  tone?: "revoked" | "active" | "verified";
  /** Hide the trailing connector — pass true for the final row. */
  isLast?: boolean;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mn = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${mn} UTC`;
}

function dotColor(tone: NonNullable<LedgerEntryProps["tone"]>): string {
  if (tone === "revoked") return "var(--color-gold)";
  if (tone === "active") return "var(--color-coral)";
  return "var(--color-lime)";
}

export function LedgerEntry({
  entry,
  selected,
  onClick,
  tone = "revoked",
  isLast,
}: LedgerEntryProps) {
  const color = dotColor(tone);

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[10px] top-5 h-full w-[2px] bg-[var(--color-border)]"
        />
      )}

      <button
        type="button"
        onClick={() => onClick?.(entry)}
        className={cn(
          "group relative w-full text-left",
          "flex items-start gap-4 rounded-[10px] border px-3 py-3 transition-colors",
          "pl-7",
          selected
            ? "border-[var(--color-gold)]/60 bg-[var(--color-card-hover)]"
            : "border-transparent hover:bg-[var(--color-card)]/60 hover:border-[var(--color-border)]"
        )}
      >
        {/* Dot */}
        <span
          aria-hidden
          className={cn(
            "absolute left-[4px] top-4 h-[14px] w-[14px] rounded-full ring-2 ring-[var(--color-bg)]",
            "transition-transform group-hover:scale-110"
          )}
          style={{ background: color }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-[var(--radius-pill)] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                "bg-[var(--color-bg)] ring-1 ring-inset"
              )}
              style={{ color, boxShadow: `inset 0 0 0 1px ${color}40` }}
            >
              {tone === "revoked" ? "REVOKED" : tone === "active" ? "ACTIVE" : "VERIFIED"}
            </span>
            <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
              {formatTimestamp(entry.timestampIso)}
            </span>
            <span className="font-mono text-[11px] text-[var(--color-gold)]">
              {entry.id}
            </span>
          </div>
          <p className="mt-1.5 text-[14px] leading-[1.45] text-[var(--color-text)]">
            {entry.action}
          </p>
          <a
            className={cn(
              "mt-1 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider",
              "text-[var(--color-gold)] opacity-70 transition-opacity hover:opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            Evidence
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </button>
    </div>
  );
}
