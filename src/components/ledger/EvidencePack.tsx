"use client";

import { FileDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { LedgerEntry } from "@/lib/types";

interface EvidencePackProps {
  entry: LedgerEntry;
  /** Pack title (defaults to entry actor / action). */
  title?: string;
  eventCount?: number;
  sourceCount?: number;
  daysSinceOffboarding?: number;
  onExport?: () => void;
}

/** Split a 64-char hex signature into rows of 16 chars for fingerprint display. */
function chunkSignature(sig: string): string[] {
  const padded = sig.padEnd(64, "0").slice(0, 64);
  const out: string[] = [];
  for (let i = 0; i < padded.length; i += 16) {
    out.push(padded.slice(i, i + 16));
  }
  return out;
}

export function EvidencePack({
  entry,
  title,
  eventCount = 14,
  sourceCount = 4,
  daysSinceOffboarding = 14,
  onExport,
}: EvidencePackProps) {
  const sigRows = chunkSignature(entry.signatureSha256);
  const packTitle = title ?? entry.action.split("—")[0]?.trim() ?? "Evidence Pack";

  return (
    <aside
      className={cn(
        "flex w-[320px] shrink-0 flex-col overflow-hidden rounded-[10px] border",
        "border-[var(--color-border)] bg-[var(--color-surface)]"
      )}
    >
      {/* Header */}
      <div className="border-b border-[var(--color-border)] px-4 py-4">
        <h3 className="text-[15px] font-semibold leading-tight text-[var(--color-text)]">
          {packTitle} — Evidence Pack
        </h3>
        <p className="mt-1 font-mono text-[11px] text-[var(--color-text-muted)]">
          {eventCount} events · {sourceCount} sources · {daysSinceOffboarding}d since offboarding
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Fields */}
        <div className="space-y-3">
          <Field label="Affected principal" value={entry.principalEmail ?? "—"} mono />
          <Field label="IP at last access" value={entry.ipAddress ?? "—"} mono />
        </div>

        {/* Signature */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            Immutable signature (SHA-256)
          </div>
          <div
            className={cn(
              "mt-1.5 rounded-md border px-3 py-2",
              "border-[var(--color-border)]/60 bg-[var(--color-code-bg)]"
            )}
          >
            {sigRows.map((row, i) => (
              <div
                key={i}
                className="font-mono text-[11px] leading-[1.5] text-[var(--color-gold)]"
              >
                {row}
              </div>
            ))}
          </div>
        </div>

        {/* Raw payload */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            Raw event payload
          </div>
          <pre
            className={cn(
              "mt-1.5 max-h-[260px] overflow-auto whitespace-pre rounded-md border px-3 py-2",
              "border-[var(--color-border)]/60 bg-[var(--color-code-bg)]",
              "font-mono text-[11px] leading-[1.5] text-[var(--color-text)]"
            )}
          >
            {JSON.stringify(entry.rawPayload, null, 2)}
          </pre>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="border-t border-[var(--color-border)] p-3">
        <button
          type="button"
          onClick={onExport}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5",
            "bg-[var(--color-gold)] text-[var(--color-bg)] font-semibold text-[13px]",
            "hover:bg-[var(--color-gold-hover)] transition-colors"
          )}
        >
          <FileDown className="h-4 w-4" />
          Export PDF (4 pages)
        </button>
      </div>
    </aside>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 break-all text-[13px] text-[var(--color-text)]",
          mono && "font-mono text-[12px]"
        )}
      >
        {value}
      </div>
    </div>
  );
}
