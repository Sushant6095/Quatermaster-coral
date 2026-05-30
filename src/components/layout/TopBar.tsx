"use client";

import { useEffect, useState } from "react";
import { Search, Activity, Zap, MessageSquare, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Top bar — 52px, persistent across all routes.
 *
 * Composition (left → right):
 *   - Workspace switcher  (acme-corp ▾)
 *   - ⌘K command palette  (centered)
 *   - Continuous Mode toggle  ●Live
 *   - 5/5 sources healthy  ⚡
 *   - QM Copilot trigger  ⌘J
 *   - Avatar
 */
export function TopBar() {
  const [continuous, setContinuous] = useState(true);
  const [sourcesHealthy, setSourcesHealthy] = useState(5);
  const [sourcesTotal, setSourcesTotal] = useState(5);
  const [sourceDegraded, setSourceDegraded] = useState(false);

  // Poll /api/sources/health every 30s — amber dot when any source degrades.
  useEffect(() => {
    function pollHealth(): void {
      fetch("/api/sources/health")
        .then((r) => r.json() as Promise<{ ok: boolean; sources?: Array<{ status: string }> }>)
        .then((data) => {
          if (!data.ok || !data.sources) return;
          const healthy = data.sources.filter((s) => s.status === "healthy").length;
          setSourcesTotal(data.sources.length);
          setSourcesHealthy(healthy);
          setSourceDegraded(healthy < data.sources.length);
        })
        .catch(() => undefined);
    }
    pollHealth();
    const timer = setInterval(pollHealth, 30_000);
    return () => clearInterval(timer);
  }, []);

  // ⌘K hook
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // TODO: open command palette (Agent integrate)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        window.location.href = "/copilot";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5">
      {/* Workspace switcher */}
      <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--color-card)]">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-card)] text-[10px] font-bold text-[var(--color-gold)]">
          A
        </span>
        <span className="font-medium">acme-corp</span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
      </button>

      {/* ⌘K search — centered */}
      <div className="flex-1">
        <button
          className="mx-auto flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/60 px-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">
            Search audits, findings, employees…
          </span>
          <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Continuous Mode */}
      <button
        onClick={() => setContinuous((v) => !v)}
        className={cn(
          "group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          continuous
            ? "text-[var(--color-lime)]"
            : "text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
        )}
        title="Toggle Continuous Mode"
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            continuous && !sourceDegraded
              ? "bg-[var(--color-lime)] animate-breath"
              : continuous && sourceDegraded
                ? "bg-[var(--color-gold)]"
                : "bg-[var(--color-text-dim)]"
          )}
        />
        <span>{continuous ? "Live" : "Paused"}</span>
      </button>

      {/* Sources health */}
      <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-[var(--color-text-muted)]">
        <Zap
          className={cn(
            "h-3.5 w-3.5",
            sourceDegraded ? "text-[var(--color-gold)]" : "text-[var(--color-lime)]"
          )}
        />
        <span>
          <span
            className={cn(
              "font-semibold",
              sourceDegraded ? "text-[var(--color-gold)]" : "text-[var(--color-text)]"
            )}
          >
            {sourcesHealthy}/{sourcesTotal}
          </span>{" "}
          sources
        </span>
      </div>

      {/* Copilot trigger */}
      <button
        onClick={() => (window.location.href = "/copilot")}
        className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/60 px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
        title="Open QM Copilot"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <kbd className="font-mono text-[10px]">⌘J</kbd>
      </button>

      {/* Avatar */}
      <div className="ml-1 h-8 w-8 rounded-full border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-gold-deep)] to-[var(--color-coral-deep)]" />
    </header>
  );
}
