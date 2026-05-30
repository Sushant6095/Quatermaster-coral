"use client";

/**
 * /copilot — QM Copilot (the agent surface).
 *
 * Demo-path screen. Natural-language → federated SQL via Coral schema
 * catalog. Streams compile → validate → execute → narrate events back
 * from the orchestrator (`/api/copilot/ask`).
 *
 * State held locally in this client component because each thread is
 * short-lived and we don't want a round-trip per keystroke.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ChevronDown, Plus, Sparkles, Square } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CopilotTurn, SourceKey } from "@/lib/types";

interface ThreadMeta {
  sourcesUsed: SourceKey[];
  rowsScanned: number;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  durationMs: number;
}

const EMPTY_META: ThreadMeta = {
  sourcesUsed: [],
  rowsScanned: 0,
  tokensIn: 0,
  tokensOut: 0,
  costCents: 0,
  durationMs: 0,
};

const SAMPLE_PROMPTS: string[] = [
  "Find me people who left in the last 30 days and still have GitHub commits.",
  "Which Stripe charges this month aren't on our approved-vendor list?",
  "Show contractors with admin role on any repo whose last activity was over 60 days ago.",
  "How much are we paying for SaaS seats with no login in 30 days?",
];

export default function CopilotPage() {
  const [turns, setTurns] = useState<CopilotTurn[]>([]);
  const [draft, setDraft] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [meta, setMeta] = useState<ThreadMeta>(EMPTY_META);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the chat to bottom whenever turns change.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns]);

  const submit = useCallback(async (question: string): Promise<void> => {
    const trimmed = question.trim();
    if (!trimmed || busy) return;

    setDraft("");
    setBusy(true);

    const userTurn: CopilotTurn = {
      role: "user",
      content: trimmed,
      timestampIso: new Date().toISOString(),
    };
    const assistantTurn: CopilotTurn = {
      role: "assistant",
      content: "Compiling SQL…",
      timestampIso: new Date().toISOString(),
    };
    setTurns((prev) => [...prev, userTurn, assistantTurn]);

    try {
      const res = await fetch("/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.body) {
        throw new Error("No response stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentSql: string | undefined;
      let currentRows: Array<Record<string, unknown>> | undefined;
      let currentSummary: string | undefined;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data:")) continue;
          const json = part.slice(5).trim();
          if (!json) continue;
          try {
            const evt = JSON.parse(json) as {
              event: string;
              data?: unknown;
            };
            if (evt.event === "compile" && typeof evt.data === "object" && evt.data) {
              const d = evt.data as { sql?: string };
              if (d.sql) currentSql = d.sql;
            }
            if (evt.event === "execute" && typeof evt.data === "object" && evt.data) {
              const d = evt.data as {
                rows?: Array<Record<string, unknown>>;
                meta?: ThreadMeta;
              };
              if (d.rows) currentRows = d.rows;
              if (d.meta) setMeta(d.meta);
            }
            if (evt.event === "narrate" && typeof evt.data === "object" && evt.data) {
              const d = evt.data as { summary?: string };
              if (d.summary) currentSummary = d.summary;
            }
            if (evt.event === "done") {
              setTurns((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: "assistant",
                  content: currentSummary ?? "Done.",
                  sql: currentSql,
                  rows: currentRows,
                  timestampIso: new Date().toISOString(),
                };
                return next;
              });
            }
          } catch {
            // ignore malformed event
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: `I couldn't compile that. ${msg}`,
          timestampIso: new Date().toISOString(),
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const newThread = (): void => {
    setTurns([]);
    setMeta(EMPTY_META);
    setDraft("");
  };

  return (
    <div className="flex h-[calc(100vh-52px)]">
      {/* Chat column */}
      <div className="flex flex-1 flex-col">
        {/* Page header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-[var(--color-gold)]" />
            <h1 className="text-xl font-semibold tracking-tight">QM Copilot</h1>
            <span className="rounded-pill border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              schema-grounded
            </span>
          </div>
          <button
            onClick={newThread}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/60 px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          >
            <Plus className="h-3.5 w-3.5" />
            New thread
          </button>
        </div>

        {/* Scrollable thread */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          {turns.length === 0 ? (
            <EmptyHero onPick={(q) => submit(q)} />
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              <AnimatePresence initial={false}>
                {turns.map((t, i) => (
                  <motion.div
                    key={`${t.timestampIso}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TurnBubble turn={t} streaming={busy && i === turns.length - 1} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit(draft);
              }}
              className="flex items-end gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2 focus-within:border-[var(--color-gold)]"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(draft);
                  }
                }}
                placeholder="Ask a question or paste SQL…"
                rows={1}
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  busy
                    ? "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                    : "bg-[var(--color-gold)] text-black hover:bg-[var(--color-gold-hover)] disabled:opacity-40"
                )}
              >
                {busy ? <Square className="h-3.5 w-3.5" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </form>
            <p className="mt-2 text-[11px] text-[var(--color-text-dim)]">
              Enter to send · Shift+Enter for newline · Schema-grounded · Results are read-only.
            </p>
          </div>
        </div>
      </div>

      {/* Right rail — "This thread" meta */}
      <aside className="hidden w-[320px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6 lg:block">
        <ThreadRail meta={meta} hasTurns={turns.length > 0} />
      </aside>
    </div>
  );
}

interface EmptyHeroProps {
  onPick: (prompt: string) => void;
}

function EmptyHero({ onPick }: EmptyHeroProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center pt-16 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <Sparkles className="h-5 w-5 text-[var(--color-gold)]" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">
        What do you want to audit?
      </h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Ask in plain English. Quartermaster compiles your question to federated SQL
        across your five connected sources — locally, in under a second.
      </p>
      <div className="mt-8 grid w-full gap-2">
        {SAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="group flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/60 px-4 py-3 text-left text-sm text-[var(--color-text-muted)] hover:border-[var(--color-gold)]/40 hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          >
            <span>{p}</span>
            <ArrowUp className="h-4 w-4 rotate-45 text-[var(--color-text-dim)] group-hover:text-[var(--color-gold)]" />
          </button>
        ))}
      </div>
    </div>
  );
}

interface TurnBubbleProps {
  turn: CopilotTurn;
  streaming: boolean;
}

function TurnBubble({ turn, streaming }: TurnBubbleProps) {
  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--color-card)] px-4 py-2.5 text-sm">
          {turn.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-card)] text-[10px] font-bold text-[var(--color-gold)]">
          Q
        </div>
        <span>Quartermaster</span>
        <span>·</span>
        <span className="font-mono">
          {new Date(turn.timestampIso).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Compile shimmer */}
      {streaming && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <span className="font-mono text-[var(--color-sea)]">{turn.content}</span>
          <span className="animate-caret font-mono text-[var(--color-sea)]">▌</span>
        </div>
      )}

      {/* Final summary */}
      {!streaming && (
        <p className="text-sm leading-relaxed text-[var(--color-text)]">
          {turn.content}
        </p>
      )}

      {/* SQL panel (collapsible) */}
      {turn.sql && <SqlAccordion sql={turn.sql} />}

      {/* Results table */}
      {turn.rows && turn.rows.length > 0 && (
        <ResultsMini rows={turn.rows} />
      )}
    </div>
  );
}

interface SqlAccordionProps {
  sql: string;
}

function SqlAccordion({ sql }: SqlAccordionProps) {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <span className="font-mono">{open ? "Hide SQL" : "Show SQL"}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <pre className="overflow-x-auto px-3 pb-3 font-mono text-[11px] leading-relaxed text-[var(--color-text)]">
          {sql}
        </pre>
      )}
    </div>
  );
}

interface ResultsMiniProps {
  rows: Array<Record<string, unknown>>;
}

function ResultsMini({ rows }: ResultsMiniProps) {
  const cols = Object.keys(rows[0] ?? {});
  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border)]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
            {cols.slice(0, 4).map((c) => (
              <th
                key={c}
                className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((r, i) => (
            <tr
              key={i}
              className="border-b border-[var(--color-border)] last:border-0"
            >
              {cols.slice(0, 4).map((c) => (
                <td key={c} className="px-3 py-2 font-mono text-[11px]">
                  {String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 6 && (
        <div className="px-3 py-2 text-[10px] text-[var(--color-text-dim)]">
          + {rows.length - 6} more rows
        </div>
      )}
    </div>
  );
}

interface ThreadRailProps {
  meta: ThreadMeta;
  hasTurns: boolean;
}

function ThreadRail({ meta, hasTurns }: ThreadRailProps) {
  if (!hasTurns) {
    return (
      <div className="text-xs text-[var(--color-text-muted)]">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)]">
          This thread
        </div>
        <p>
          Each query Quartermaster runs is executed locally by Coral against your
          connected sources. You&apos;ll see exactly what was scanned, how many
          tokens were used, and the cost — right here.
        </p>
      </div>
    );
  }
  return (
    <div className="text-xs">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)]">
        This thread
      </div>
      <div className="space-y-4">
        <Metric label="Sources used" value={meta.sourcesUsed.join(" · ") || "—"} />
        <Metric label="Rows scanned" value={meta.rowsScanned.toLocaleString()} />
        <Metric
          label="Tokens"
          value={`${meta.tokensIn.toLocaleString()} in · ${meta.tokensOut.toLocaleString()} out`}
        />
        <Metric
          label="Duration"
          value={meta.durationMs ? `${(meta.durationMs / 1000).toFixed(2)}s` : "—"}
        />
        <div className="border-t border-[var(--color-border)] pt-4">
          <Metric
            label="Cost"
            value={meta.costCents ? `${meta.costCents.toFixed(3)}¢` : "—"}
            valueClassName="text-[var(--color-gold)] font-mono"
          />
        </div>
      </div>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function Metric({ label, value, valueClassName }: MetricProps) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-dim)]">
        {label}
      </div>
      <div className={cn("mt-0.5 text-sm text-[var(--color-text)]", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
