"use client";

/**
 * RecentRuns — the left-column "Recent Previews" analog on the Cockpit.
 *
 * A terse, monochrome list of the most recently executed audits, sorted
 * newest-first. Each row links straight to that audit's run view.
 */

import Link from "next/link";
import type { AuditDefinition } from "@/lib/types";
import { RelativeTime } from "./Time";

export interface RecentRunsProps {
  audits: AuditDefinition[];
  /** Max rows to show. */
  limit?: number;
}

export function RecentRuns({ audits, limit = 5 }: RecentRunsProps) {
  const recent = audits
    .filter((a) => Boolean(a.lastRunIso))
    .slice()
    .sort(
      (a, b) =>
        new Date(b.lastRunIso ?? 0).getTime() -
        new Date(a.lastRunIso ?? 0).getTime()
    )
    .slice(0, limit);

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-[13px] font-medium text-[var(--color-text)]">
          Recent runs
        </h2>
      </div>
      <ul>
        {recent.map((a) => (
          <li key={a.id}>
            <Link
              href={`/audits/${a.id}`}
              className="flex items-center justify-between gap-2 border-b border-[var(--color-border)]/50 px-4 py-2.5 text-[12px] transition-colors last:border-b-0 hover:bg-[var(--color-card)]/60"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-[10px] text-[var(--color-text-dim)]">
                  {a.id}
                </span>
                <span className="truncate text-[var(--color-text-muted)]">
                  {a.name}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] text-[var(--color-text-dim)]">
                <RelativeTime iso={a.lastRunIso} /> · {a.lastFindingCount ?? 0}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
