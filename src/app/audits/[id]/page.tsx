"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { Github, MessageSquare, KeyRound, Briefcase, CreditCard, Zap, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { AUDITS } from "@/lib/audits/registry";
import { SQLPanel } from "@/components/audit-run/SQLPanel";
import { ResultGrid } from "@/components/audit-run/ResultGrid";
import { FindingSlideOver } from "@/components/finding-detail/FindingSlideOver";
import { BlastRadiusModal } from "@/components/finding-detail/BlastRadiusModal";
import type { AuditId, Finding, SourceKey } from "@/lib/types";

const SOURCE_CHIP: Record<SourceKey, { label: string; color: string }> = {
  deel: { label: "Deel", color: "var(--color-lime)" },
  okta: { label: "Okta", color: "var(--color-sea)" },
  github: { label: "GitHub", color: "var(--color-text)" },
  slack: { label: "Slack", color: "var(--color-coral)" },
  stripe: { label: "Stripe", color: "var(--color-gold)" },
  linear: { label: "Linear", color: "var(--color-sea)" },
};

const COLUMNS = [
  { key: "severity", label: "Severity" },
  { key: "targetName", label: "Account" },
  { key: "targetEmail", label: "Email", mono: true },
  { key: "department", label: "Dept" },
  { key: "rationale", label: "Rationale" },
];

interface AuditRunPageProps {
  params: Promise<{ id: string }>;
}

export default function AuditRunPage({ params }: AuditRunPageProps) {
  const { id } = use(params);
  const auditId = id as AuditId;
  const def = AUDITS[auditId];

  const [sql, setSql] = useState(def?.sqlTemplate ?? "");
  const [streaming, setStreaming] = useState(false);
  const [rows, setRows] = useState<Finding[]>([]);
  const [running, setRunning] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState("00:00.0");
  const [selected, setSelected] = useState<Finding | null>(null);
  const [blastOpen, setBlastOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const ms = Date.now() - startRef.current;
      const tenths = Math.floor(ms / 100);
      const secs = Math.floor(tenths / 10);
      const mins = Math.floor(secs / 60);
      setElapsed(
        `${String(mins).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}.${tenths % 10}`
      );
    }, 100);
  }, [stopTimer]);

  // Auto-run when page loads
  useEffect(() => {
    void startRun();
    return () => {
      abortRef.current?.abort();
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditId]);

  async function startRun(): Promise<void> {
    if (!def) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setRunning(true);
    setStreaming(true);
    setRows([]);
    setDurationMs(0);
    setErrorMsg("");
    setSql(def.sqlTemplate);
    startTimer();

    try {
      const resp = await fetch("/api/audits/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ auditId }),
        signal: ctrl.signal,
      });
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let sqlDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          try {
            const evt = JSON.parse(raw) as { event: string; data: unknown };
            if (evt.event === "sql") {
              const d = evt.data as { sql: string };
              setSql(d.sql);
            } else if (evt.event === "row") {
              if (!sqlDone) { sqlDone = true; setStreaming(false); }
              setRows((prev) => [...prev, evt.data as Finding]);
            } else if (evt.event === "done") {
              const d = evt.data as { durationMs: number };
              setDurationMs(d.durationMs);
              setStreaming(false);
              stopTimer();
              setRunning(false);
            } else if (evt.event === "error") {
              const d = evt.data as { message: string };
              setErrorMsg(d.message);
              // Don't stop — fixture rows still stream in after this event.
            }
          } catch {
            // malformed frame — skip
          }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setErrorMsg(err instanceof Error ? err.message : "Run failed — falling back to fixtures");
      setStreaming(false);
      stopTimer();
    } finally {
      if (!abortRef.current?.signal.aborted) setRunning(false);
    }
  }

  if (!def) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
        Unknown audit: {auditId}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 px-6 py-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text)]">
            {def.name}
          </h1>
          <span
            className={cn(
              "rounded-[var(--radius-pill)] px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider",
              "bg-[var(--color-card)] text-[var(--color-gold)] ring-1 ring-inset ring-[var(--color-border)]"
            )}
          >
            {def.id}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Source chips */}
          <div className="flex items-center gap-1.5">
            {def.sources.map((s) => {
              const chip = SOURCE_CHIP[s];
              return (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1",
                    "bg-[var(--color-card)] ring-1 ring-inset ring-[var(--color-border)]",
                    "font-mono text-[11px] uppercase tracking-wider"
                  )}
                  style={{ color: chip.color }}
                >
                  {chip.label}
                </span>
              );
            })}
          </div>

          {/* Live indicator / Re-run */}
          {running ? (
            <div className="flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 animate-breath rounded-full bg-[var(--color-lime)]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-lime)]">
                Running
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void startRun()}
              className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/60 px-3 py-1.5 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-gold)]/40 hover:text-[var(--color-gold)] transition-colors"
            >
              <Play className="h-3 w-3" />
              Re-run
            </button>
          )}

          <span className="font-mono text-[13px] text-[var(--color-text-muted)]">{elapsed}</span>
        </div>
      </header>

      {/* Error banner */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-[8px] border border-[var(--color-coral)]/40 bg-[var(--color-coral)]/10 px-4 py-2.5 text-[13px] text-[var(--color-coral)]"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-panel layout */}
      <div className="grid flex-1 gap-4 lg:grid-cols-[45fr_55fr] min-h-[520px]">
        <SQLPanel
          sql={sql}
          streaming={streaming}
          filename={`${def.id}.sql`}
          onRerun={() => void startRun()}
        />
        <ResultGrid
          rows={rows as unknown as Array<Record<string, unknown>>}
          columns={COLUMNS}
          severityKey="severity"
          durationSec={durationMs > 0 ? durationMs / 1000 : 1.4}
          sourcesJoined={def.sources.length}
          onRowClick={(row) => setSelected(row as unknown as Finding)}
        />
      </div>

      {/* Finding detail */}
      {selected && (
        <FindingSlideOver
          finding={selected}
          open={!!selected && !blastOpen}
          onOpenChange={(o) => { if (!o) setSelected(null); }}
          blastRadiusNodes={47}
          onBlastRadius={() => setBlastOpen(true)}
        />
      )}
      {selected && blastOpen && (
        <BlastRadiusModal
          open={blastOpen}
          onClose={() => setBlastOpen(false)}
          findingId={selected.id}
          targetName={selected.targetName}
        />
      )}
    </div>
  );
}
