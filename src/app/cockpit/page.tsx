"use client";

/**
 * /cockpit — the Risk Cockpit "Overview" screen.
 *
 * Vercel Overview composition: a narrow left rail (Posture metrics →
 * Continuous Mode alerts → Recent runs) beside a wide right column
 * (active-audit grid + live feed). Client component so Continuous Mode
 * and the simulated Live Feed hold local state without a round-trip.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { AuditTile } from "@/components/cockpit/AuditTile";
import { LiveFeed } from "@/components/cockpit/LiveFeed";
import { PosturePanel } from "@/components/cockpit/PosturePanel";
import { AlertsPanel } from "@/components/cockpit/AlertsPanel";
import { RecentRuns } from "@/components/cockpit/RecentRuns";
import {
  mockAudits,
  mockCockpitStats,
  mockLiveFeed,
} from "@/lib/fixtures/cockpit";
import { useTimelineReveal } from "@/lib/anime/useAnime";
import type { AuditId, Finding } from "@/lib/types";

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
  const router = useRouter();
  const revealRef = useTimelineReveal<HTMLDivElement>({ stagger: 70 });
  const stats = mockCockpitStats;
  const [continuous, setContinuous] = useState<boolean>(true);
  const [liveFeed, setLiveFeed] = useState<Finding[]>(mockLiveFeed);
  const [runningAll, setRunningAll] = useState<boolean>(false);

  /** Re-check source connection health. */
  async function refreshSources(): Promise<void> {
    try {
      const res = await fetch("/api/sources/health");
      const data = (await res.json()) as {
        ok?: boolean;
        sources?: Array<{ status: string }>;
      };
      const sources = data.sources ?? [];
      const healthy = sources.filter((s) => s.status === "healthy").length;
      toast.success("Sources refreshed", {
        description: sources.length
          ? `${healthy}/${sources.length} sources healthy.`
          : "Connection health re-checked.",
      });
    } catch (err) {
      toast.error("Refresh failed", {
        description: err instanceof Error ? err.message : "Could not reach sources.",
      });
    }
  }

  /** Run every named audit through the streaming runner. */
  async function runAllAudits(): Promise<void> {
    if (runningAll) return;
    setRunningAll(true);
    const ids = mockAudits.map((a) => a.id);
    const tid = toast.loading(`Running audits… 0/${ids.length}`);
    try {
      for (let i = 0; i < ids.length; i++) {
        const res = await fetch("/api/audits/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ auditId: ids[i] }),
        });
        // Drain the SSE stream so each audit actually completes server-side.
        const reader = res.body?.getReader();
        if (reader) {
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
        }
        toast.loading(`Running audits… ${i + 1}/${ids.length}`, { id: tid });
      }
      toast.success(`All ${ids.length} audits complete`, {
        id: tid,
        description: "New findings stream into the live feed below.",
      });
    } catch (err) {
      toast.error("Run failed", {
        id: tid,
        description: err instanceof Error ? err.message : "Audit run errored.",
      });
    } finally {
      setRunningAll(false);
    }
  }

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
    <div ref={revealRef} className="mx-auto max-w-[1400px] px-6 py-6">
      {/* Top row — breadcrumb-style title + global controls */}
      <header
        data-animate
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-baseline gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text)]">
            Cockpit
          </h1>
          <span className="text-[13px] text-[var(--color-text-dim)]">
            Overview
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshSources}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={runAllAudits}
            disabled={runningAll}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-text)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            {runningAll ? "Running…" : "Run All"}
          </button>
        </div>
      </header>

      {/* Two-column Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left rail */}
        <aside className="space-y-4">
          <PosturePanel stats={stats} />
          <AlertsPanel
            continuous={continuous}
            onToggle={() => setContinuous((v) => !v)}
          />
          <RecentRuns audits={mockAudits} />
        </aside>

        {/* Right column */}
        <div className="min-w-0 space-y-6">
          <section>
            <div data-animate className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.8px] text-[var(--color-text-muted)]">
                Active Audits
              </h2>
              <a
                href="/audits"
                className="text-[12px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                View all →
              </a>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {mockAudits.map((a, i) => (
                <AuditTile
                  key={a.id}
                  {...a}
                  icon={AUDIT_ICONS[a.id]}
                  index={i}
                  onRun={(auditId) => router.push(`/audits/${auditId}`)}
                />
              ))}
            </div>
          </section>

          {continuous && (
            <section>
              <div data-animate className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-medium uppercase tracking-[0.8px] text-[var(--color-text-muted)]">
                  Live Feed
                </h2>
                <span className="font-mono text-[11px] text-[var(--color-text-dim)]">
                  {liveFeed.length} recent
                </span>
              </div>
              <LiveFeed items={liveFeed} isLive={continuous} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
