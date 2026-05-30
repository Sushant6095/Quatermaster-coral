"use client";

import { useEffect, useState } from "react";
import { Search, MessageSquare, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SourcesHealth {
  ok: boolean;
  sources?: Array<{ status: string }>;
}

export function TopBar() {
  const [continuous, setContinuous] = useState(true);
  const [sourcesHealthy, setSourcesHealthy] = useState(5);
  const [sourcesTotal, setSourcesTotal] = useState(5);
  const [sourceDegraded, setSourceDegraded] = useState(false);

  // Poll /api/sources/health every 30s — amber state for degraded sources.
  useEffect(() => {
    function pollHealth(): void {
      fetch("/api/sources/health")
        .then((r) => r.json() as Promise<SourcesHealth>)
        .then((data) => {
          if (!data.ok || !data.sources) return;
          const healthy = data.sources.filter(
            (s) => s.status === "healthy"
          ).length;
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

  // ⌘K / ⌘J keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // TODO: open command palette
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
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      {/* Workspace switcher */}
      <button
        type="button"
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors hover:bg-[var(--color-card)]"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-gold)] text-[10px] font-bold text-[var(--color-bg)]">
          A
        </span>
        <span className="font-medium text-[var(--color-text)]">acme-corp</span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-dim)]" />
      </button>

      {/* ⌘K search — centered */}
      <div className="flex flex-1 justify-center">
        <button
          type="button"
          className="flex h-9 w-full max-w-[420px] items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/40 px-3 transition-colors hover:bg-[var(--color-card)]/70"
          aria-label="Open command palette (⌘K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-dim)]" />
          <span className="flex-1 text-left text-[13px] text-[var(--color-text-dim)]">
            Search...
          </span>
          <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-dim)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {/* Continuous Mode / Live toggle */}
        <button
          type="button"
          onClick={() => setContinuous((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
            continuous && !sourceDegraded
              ? "border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 text-[var(--color-lime)]"
              : continuous && sourceDegraded
                ? "border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                : "border-[var(--color-border)] bg-transparent text-[var(--color-text-dim)] hover:bg-[var(--color-card)]"
          )}
          title="Toggle Continuous Mode"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              continuous && !sourceDegraded
                ? "animate-breath bg-[var(--color-lime)]"
                : continuous && sourceDegraded
                  ? "bg-[var(--color-gold)]"
                  : "bg-[var(--color-text-dim)]"
            )}
          />
          {continuous ? "Live" : "Paused"}
        </button>

        {/* Sources health */}
        <div className="flex items-center gap-1 text-[12px] text-[var(--color-text-muted)]">
          <span
            className={cn(
              "font-medium",
              sourceDegraded
                ? "text-[var(--color-gold)]"
                : "text-[var(--color-text)]"
            )}
          >
            {sourcesHealthy}/{sourcesTotal}
          </span>
          <span> sources</span>
        </div>

        {/* Copilot icon button */}
        <button
          type="button"
          onClick={() => (window.location.href = "/copilot")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          title="Open QM Copilot (⌘J)"
        >
          <MessageSquare className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--color-gold-deep)] to-[var(--color-coral-deep)]" />
      </div>
    </header>
  );
}
