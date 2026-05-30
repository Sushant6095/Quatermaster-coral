"use client";

/**
 * /sources — Sources & Connections.
 *
 * Health + last-sync + row counts for each connected source. Re-sync
 * and manage actions. Fixture mode populates 5 healthy sources.
 */

import { useEffect, useState } from "react";
import { RefreshCw, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ConnectionStatus, SourceKey } from "@/lib/types";

const SOURCE_LABELS: Record<SourceKey, string> = {
  deel: "Deel",
  okta: "Okta",
  github: "GitHub",
  slack: "Slack",
  stripe: "Stripe",
  linear: "Linear",
};

const STATUS_TONE: Record<ConnectionStatus["status"], string> = {
  healthy: "bg-[var(--color-lime)]",
  degraded: "bg-[var(--color-gold)]",
  failing: "bg-[var(--color-coral)]",
  disconnected: "bg-[var(--color-text-dim)]",
};

const STATUS_LABEL: Record<ConnectionStatus["status"], string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  failing: "Failing",
  disconnected: "Disconnected",
};

function formatRelative(iso: string | undefined): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<ConnectionStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const res = await fetch("/api/sources/health");
        const json = (await res.json()) as { ok: boolean; sources: ConnectionStatus[] };
        if (!cancelled) setSources(json.sources ?? []);
      } catch {
        if (!cancelled) setSources([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Connected via Coral. Federated locally. PII never leaves this machine.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {sources.map((s) => (
            <div
              key={s.source}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {SOURCE_LABELS[s.source]}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        STATUS_TONE[s.status],
                        s.status === "healthy" && "animate-breath"
                      )}
                    />
                    <span className="text-[var(--color-text-muted)]">
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
                  {s.source}
                </span>
              </div>

              <div className="mt-4 space-y-1 text-[11px] text-[var(--color-text-muted)]">
                <div>
                  Last sync{" "}
                  <span className="text-[var(--color-text)]">
                    {formatRelative(s.lastSyncIso)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text)] font-mono">
                    {s.rowsCached.toLocaleString()}
                  </span>{" "}
                  rows cached
                </div>
                <div>
                  TTL{" "}
                  <span className="font-mono text-[var(--color-text)]">
                    {Math.floor(s.ttlMs / 60_000)}m
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]">
                  <RefreshCw className="h-3 w-3" />
                  Re-sync
                </button>
                <button className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                  <Settings2 className="h-3 w-3" />
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
