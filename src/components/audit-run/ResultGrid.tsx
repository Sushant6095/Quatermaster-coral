"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { Severity } from "@/lib/types";

interface ResultGridProps {
  rows: Array<Record<string, unknown>>;
  columns: Array<{ key: string; label: string; mono?: boolean }>;
  /** Severity is read from row[severityKey]. */
  severityKey?: string;
  /** Footer summary tuning. */
  durationSec?: number;
  sourcesJoined?: number;
  costCents?: number;
  /** When provided, the click target on each row. */
  onRowClick?: (row: Record<string, unknown>) => void;
}

function SeverityPill({ severity }: { severity: Severity }) {
  if (severity === "P0") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5",
          "bg-[var(--color-coral)]/15 text-[var(--color-coral)]",
          "font-mono text-[11px] font-semibold tracking-wider",
          "ring-1 ring-inset ring-[var(--color-coral)]/40"
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-coral)]" />
        P0
      </span>
    );
  }
  if (severity === "P1") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5",
          "text-[var(--color-gold)]",
          "font-mono text-[11px] font-semibold tracking-wider",
          "ring-1 ring-inset ring-[var(--color-gold)]/50"
        )}
      >
        P1
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5",
        "text-[var(--color-text-muted)]",
        "font-mono text-[11px] font-semibold tracking-wider"
      )}
    >
      P2
    </span>
  );
}

export function ResultGrid({
  rows,
  columns,
  severityKey = "severity",
  durationSec = 1.4,
  sourcesJoined = 4,
  costCents = 0.003,
  onRowClick,
}: ResultGridProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[10px] border",
        "border-[var(--color-border)] bg-[var(--color-card)]/60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
            Findings
          </span>
          <span
            className={cn(
              "rounded-[var(--radius-pill)] bg-[var(--color-coral)]/15 px-2 py-0.5",
              "font-mono text-[10px] font-semibold text-[var(--color-coral)]"
            )}
          >
            {rows.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
          <span className="font-mono">Streaming</span>
          <span className="h-1.5 w-1.5 animate-breath rounded-full bg-[var(--color-lime)]" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 bg-[var(--color-surface)]/80 backdrop-blur">
            <tr>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                Sev
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={true}>
              {rows.map((row, idx) => {
                const severity = (row[severityKey] as Severity) ?? "P2";
                return (
                  <motion.tr
                    key={String(row.id ?? idx)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: idx * 0.2,
                      ease: "easeOut",
                    }}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-b border-[var(--color-border)]/60 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-[var(--color-card-hover)]"
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.2,
                          delay: idx * 0.2 + 0.15,
                          ease: "easeOut",
                        }}
                        className="inline-block"
                      >
                        <SeverityPill severity={severity} />
                      </motion.span>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-2.5 text-[13px] text-[var(--color-text)]",
                          col.mono && "font-mono text-[12px]"
                        )}
                      >
                        {String(row[col.key] ?? "")}
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/40 px-4 py-2 font-mono text-[12px] text-[var(--color-text-muted)]">
        {rows.length} findings in {durationSec.toFixed(1)}s · joined{" "}
        {sourcesJoined} sources · token cost ≈ {costCents.toFixed(3)}¢
      </div>
    </div>
  );
}
