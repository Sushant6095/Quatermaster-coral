"use client";

/**
 * AlertsPanel — the left-column "Alerts" analog on the Cockpit Overview.
 *
 * Maps Vercel's "Get alerted for anomalies" card onto Quartermaster's
 * Continuous Mode: a breathing status dot, a one-line pitch, and the
 * toggle that drives the Live Feed's EventSource on the page.
 */

import { cn } from "@/lib/utils/cn";

export interface AlertsPanelProps {
  continuous: boolean;
  onToggle: () => void;
}

export function AlertsPanel({ continuous, onToggle }: AlertsPanelProps) {
  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40 p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            continuous
              ? "animate-breath bg-[var(--color-lime)]"
              : "bg-[var(--color-text-dim)]"
          )}
        />
        <h2 className="text-[13px] font-medium text-[var(--color-text)]">
          Continuous Mode
        </h2>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
        {continuous
          ? "Polling every source on a tick and surfacing new drift the moment it appears."
          : "Monitoring is paused. Enable to poll your sources and stream new findings into the feed."}
      </p>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={continuous}
        className={cn(
          "mt-3 inline-flex w-full items-center justify-center rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
          continuous
            ? "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
            : "bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
        )}
      >
        {continuous ? "Pause monitoring" : "Enable Continuous Mode"}
      </button>
    </section>
  );
}
