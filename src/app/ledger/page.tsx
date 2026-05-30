"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Calendar,
  Github,
  MessageSquare,
  KeyRound,
  Briefcase,
  CreditCard,
  CircleDot,
  Server,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LedgerEntry } from "@/components/ledger/LedgerEntry";
import { EvidencePack } from "@/components/ledger/EvidencePack";
import type { SourceKey, LedgerEntry as LedgerEntryType } from "@/lib/types";

interface SourceChip {
  key: SourceKey | "system";
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SOURCE_CHIPS: SourceChip[] = [
  { key: "github", label: "GitHub", Icon: Github, color: "var(--color-text)" },
  { key: "slack", label: "Slack", Icon: MessageSquare, color: "var(--color-coral)" },
  { key: "okta", label: "Okta", Icon: KeyRound, color: "var(--color-sea)" },
  { key: "deel", label: "Deel", Icon: Briefcase, color: "var(--color-lime)" },
  { key: "stripe", label: "Stripe", Icon: CreditCard, color: "var(--color-gold)" },
  { key: "linear", label: "Linear", Icon: CircleDot, color: "var(--color-sea)" },
  { key: "system", label: "System", Icon: Server, color: "var(--color-text-muted)" },
];

function toneFor(entry: LedgerEntryType): "revoked" | "active" | "verified" {
  if (entry.source === "system") return "verified";
  return "revoked";
}

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [activeSources, setActiveSources] = useState<Set<string>>(
    new Set(SOURCE_CHIPS.map((s) => s.key))
  );
  const [selectedId, setSelectedId] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/ledger?limit=100")
      .then((r) => r.json())
      .then((data: { ok: boolean; entries?: LedgerEntryType[] }) => {
        if (data.ok && Array.isArray(data.entries)) {
          setEntries(data.entries);
          setSelectedId(data.entries[0]?.id ?? "");
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (!activeSources.has(e.source)) return false;
      if (!q) return true;
      return (
        e.action.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        (e.principalEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, activeSources, entries]);

  const selected =
    filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? entries[0];

  function handleExport(): void {
    if (exporting) return;
    setExporting(true);
    fetch("/api/ledger/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principalEmail: selected?.principalEmail,
        limit: 50,
      }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const blob = await res.blob();
        const disposition = res.headers.get("content-disposition") ?? "";
        const match = /filename="([^"]+)"/.exec(disposition);
        const filename = match?.[1] ?? "quartermaster-evidence.html";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => undefined)
      .finally(() => setExporting(false));
  }

  function toggleSource(key: string): void {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col gap-5 px-6 py-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[var(--color-text)]">
            Compliance Ledger
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-text-muted)]">
            Auditor-grade evidence trail. Local. SOC2 / ISO 27001 exportable.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || entries.length === 0}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium",
            "bg-[var(--color-gold)] text-black hover:opacity-90 transition-opacity",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export Evidence Pack
        </button>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={cn(
            "flex flex-1 min-w-[260px] items-center gap-2 rounded-md border px-3 py-2",
            "border-[var(--color-border)] bg-[var(--color-card)]/60",
            "focus-within:border-[var(--color-gold)]/60"
          )}
        >
          <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search event ID, principal, or action"
            className={cn(
              "w-full bg-transparent text-[13px] outline-none",
              "placeholder:text-[var(--color-text-dim)]"
            )}
          />
        </div>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[13px]",
            "border-[var(--color-border)] bg-[var(--color-card)]/60 text-[var(--color-text)]",
            "hover:bg-[var(--color-card-hover)] hover:border-[var(--color-border-strong)] transition-colors"
          )}
        >
          <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
          May 1 – May 27
        </button>
        <div className="flex flex-wrap items-center gap-1.5">
          {SOURCE_CHIPS.map(({ key, label, Icon, color }) => {
            const active = activeSources.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSource(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 transition-colors",
                  "font-mono text-[11px] uppercase tracking-wider ring-1 ring-inset",
                  active
                    ? "bg-[var(--color-card)] ring-[var(--color-border-strong)]"
                    : "bg-transparent ring-[var(--color-border)] opacity-50 hover:opacity-80"
                )}
                style={{ color }}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_320px] min-h-[560px]">
        {/* Timeline */}
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-[10px] border",
            "border-[var(--color-border)] bg-[var(--color-surface)]"
          )}
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
              Event Timeline
            </span>
            <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
              Showing {filtered.length} events
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-[var(--color-text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading events…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-[var(--color-text-muted)]">
                No events match the current filters.
              </div>
            ) : (
              filtered.map((entry, idx) => (
                <LedgerEntry
                  key={entry.id}
                  entry={entry}
                  tone={toneFor(entry)}
                  selected={selected?.id === entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  isLast={idx === filtered.length - 1}
                />
              ))
            )}
            {!loading && filtered.length > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider",
                    "text-[var(--color-gold)] hover:bg-[var(--color-card)]/60 transition-colors"
                  )}
                >
                  Load previous events
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Evidence pack */}
        {selected && <EvidencePack entry={selected} />}
      </div>
    </div>
  );
}
