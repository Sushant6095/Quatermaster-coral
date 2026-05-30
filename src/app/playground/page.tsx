"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

// ── Static schema explorer data ───────────────────────────────────────────────
const SCHEMA_EXPLORER: Record<string, string[]> = {
  "deel.directory":           ["work_email", "full_name", "department", "is_active", "termination_date"],
  "deel.contracts":           ["work_email", "contract_status", "ended_at"],
  "okta.users":               ["login", "email", "status", "last_login_at", "mfa_enrolled"],
  "okta.app_assignments":     ["user_login", "app_name", "role", "last_used_at"],
  "okta.groups":              ["group_name", "member_login"],
  "github.members":           ["login", "email", "role", "last_active_at"],
  "github.commits":           ["author__email", "repo", "committed_at"],
  "github.tokens":            ["owner__login", "token_type", "scope"],
  "slack.members":            ["id", "profile__email", "profile__display_name", "is_admin", "deleted"],
  "slack.messages":           ["channel_id", "user__profile__email", "text"],
  "slack.channels":           ["id", "name", "num_members"],
  "stripe.charges":           ["id", "amount_cents", "customer__email", "created_at"],
  "stripe.subscriptions":     ["customer__email", "product__name", "status", "monthly_amount_cents"],
  "stripe.customers":         ["id", "email", "name"],
  "linear.issues":            ["id", "title", "state__type", "assignee__email"],
  "linear.users":             ["id", "email", "name", "active"],
};

const SOURCE_COLORS: Record<string, string> = {
  deel:   "var(--color-lime)",
  okta:   "var(--color-sea)",
  github: "var(--color-text)",
  slack:  "var(--color-coral)",
  stripe: "var(--color-gold)",
  linear: "var(--color-text-muted)",
};

// ── SQL keyword highlighting (simple) ────────────────────────────────────────
const KW = ["SELECT", "FROM", "LEFT", "RIGHT", "INNER", "JOIN", "ON", "WHERE", "AND", "OR", "LIMIT", "GROUP", "BY", "ORDER", "HAVING", "AS", "WITH", "LOWER"];

function highlightSQL(sql: string): string {
  const regex = new RegExp(`\\b(${KW.join("|")})\\b`, "gi");
  return sql.replace(regex, (m) => `<span style="color:var(--color-sea);font-weight:600">${m}</span>`);
}

// ── Fixture result rows ───────────────────────────────────────────────────────
type FixtureRow = Record<string, string | number | boolean | null>;

const FIXTURE_ROWS: FixtureRow[] = [
  { work_email: "alice@acme.com",  full_name: "Alice Nguyen",   login: "alice-gh",   role: "admin",  last_active_at: "2024-01-12" },
  { work_email: "bob@acme.com",    full_name: "Bob Patel",      login: "bobp",       role: "member", last_active_at: "2023-11-04" },
  { work_email: "carol@acme.com",  full_name: "Carol Smith",    login: null,         role: null,     last_active_at: null },
  { work_email: "dave@acme.com",   full_name: "Dave Kim",       login: "davekim",    role: "member", last_active_at: "2024-02-28" },
  { work_email: "eve@acme.com",    full_name: "Eve Johansson",  login: "eveJ",       role: "admin",  last_active_at: "2023-09-15" },
];

// ── Join SQL template builder ─────────────────────────────────────────────────
function buildJoinSQL(joinParam: string): string {
  const parts = joinParam.split(",");
  if (parts.length < 2) return `SELECT *\nFROM ${joinParam}\nLIMIT 50;`;
  const [left, right] = parts;
  const leftDot  = left.lastIndexOf(".");
  const rightDot = right.lastIndexOf(".");
  if (leftDot < 0 || rightDot < 0) return `SELECT *\nFROM ${joinParam}\nLIMIT 50;`;
  const leftTable  = left.slice(0, leftDot);
  const leftCol    = left.slice(leftDot + 1);
  const rightTable = right.slice(0, rightDot);
  const rightCol   = right.slice(rightDot + 1);
  return `SELECT *\nFROM ${leftTable}\nLEFT JOIN ${rightTable}\n  ON LOWER(${leftTable}.${leftCol})\n   = LOWER(${rightTable}.${rightCol})\nLIMIT 50;`;
}

// ── Line-number gutter helper ─────────────────────────────────────────────────
function lineNumbers(sql: string): number[] {
  return sql.split("\n").map((_, i) => i + 1);
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────
function PlaygroundInner() {
  const searchParams  = useSearchParams();
  const joinParam     = searchParams.get("join");
  const defaultSQL    = joinParam ? buildJoinSQL(joinParam) : "SELECT *\nFROM deel.directory\nLIMIT 50;";

  const [sql, setSQL]           = useState(defaultSQL);
  const [running, setRunning]   = useState(false);
  const [rows, setRows]         = useState<FixtureRow[] | null>(null);
  const [elapsed, setElapsed]   = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  // Re-build SQL when join param changes (e.g. navigating from Schema)
  useEffect(() => {
    if (joinParam) setSQL(buildJoinSQL(joinParam));
  }, [joinParam]);

  const runQuery = useCallback(() => {
    if (running) return;
    setRunning(true);
    setRows(null);
    const t0 = Date.now();
    // Simulate ~600ms execution with fixture data
    setTimeout(() => {
      setRows(FIXTURE_ROWS);
      setElapsed(Date.now() - t0);
      setRunning(false);
    }, 580);
  }, [running]);

  // ⌘↵ to run
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runQuery();
    }
  }, [runQuery]);

  const lines = lineNumbers(sql);
  const colHeaders = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

  // Group explorer by source
  const sourceGroups = Object.entries(SCHEMA_EXPLORER).reduce<Record<string, string[][]>>((acc, [table, cols]) => {
    const src = table.split(".")[0];
    if (!acc[src]) acc[src] = [];
    acc[src].push([table, ...cols]);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", background: "var(--color-bg)", overflow: "hidden" }}>
      {/* ── Left panel: schema explorer ─── */}
      <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Schema</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {Object.entries(sourceGroups).map(([src, tables]) => {
            const color = SOURCE_COLORS[src] ?? "var(--color-text-muted)";
            return (
              <div key={src}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", marginBottom: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{src}</span>
                </div>
                {tables.map(([fullTable, ...cols]) => {
                  const isOpen = expanded === fullTable;
                  const tname  = fullTable.split(".")[1];
                  return (
                    <div key={fullTable}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : fullTable)}
                        style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "3px 12px 3px 22px", display: "flex", alignItems: "center", gap: 5 }}
                      >
                        <span style={{ fontSize: 9, color: "var(--color-text-dim)", marginRight: 2 }}>{isOpen ? "▾" : "▸"}</span>
                        <span style={{ fontSize: 11, color: "var(--color-text)", fontFamily: "var(--font-geist-mono, monospace)" }}>{tname}</span>
                      </button>
                      {isOpen && (
                        <div style={{ paddingLeft: 32, paddingBottom: 4 }}>
                          {cols.map((col) => (
                            <div key={col} style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "var(--font-geist-mono, monospace)", padding: "1px 0", display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ color: "var(--color-text-dim)" }}>·</span>
                              <span
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  const snippet = `${fullTable}.${col}`;
                                  const ta = textareaRef.current;
                                  if (!ta) return;
                                  const start = ta.selectionStart;
                                  const end   = ta.selectionEnd;
                                  setSQL((s) => s.slice(0, start) + snippet + s.slice(end));
                                }}
                                title="Click to insert"
                              >
                                {col}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Center panel: editor ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--color-border)" }}>
        {/* Editor toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
            {joinParam ? `JOIN: ${joinParam.split(",").map((p) => p.split(".").slice(0, 2).join(".")).join(" × ")}` : "query.sql"}
          </span>
          <button
            onClick={runQuery}
            disabled={running}
            className={cn()}
            style={{
              background: running ? "var(--color-card)" : "var(--color-gold)",
              color: running ? "var(--color-text-muted)" : "var(--color-bg)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "5px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: running ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              letterSpacing: "0.02em",
            }}
          >
            {running ? (
              <>
                <span style={{ width: 10, height: 10, border: "2px solid var(--color-text-muted)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                Running…
              </>
            ) : "Run ⌘↵"}
          </button>
        </div>

        {/* Code editor */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "var(--color-code-bg)" }}>
          {/* Line numbers */}
          <div style={{ width: 36, flexShrink: 0, paddingTop: 12, paddingBottom: 12, background: "var(--color-code-bg)", borderRight: "1px solid var(--color-border)", textAlign: "right", paddingRight: 8, userSelect: "none" }}>
            {lines.map((n) => (
              <div key={n} style={{ fontSize: 11, lineHeight: "1.65", color: "var(--color-text-dim)", fontFamily: "var(--font-geist-mono, monospace)" }}>{n}</div>
            ))}
          </div>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={sql}
            onChange={(e) => setSQL(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            style={{
              flex: 1,
              background: "transparent",
              color: "var(--color-text)",
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: 13,
              lineHeight: 1.65,
              padding: "12px 14px",
              overflowY: "auto",
              caretColor: "var(--color-gold)",
            }}
          />
        </div>

        {/* Status bar */}
        <div style={{ height: 24, flexShrink: 0, borderTop: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", alignItems: "center", padding: "0 14px", gap: 12 }}>
          <span style={{ fontSize: 10, color: "var(--color-text-dim)", fontFamily: "var(--font-geist-mono, monospace)" }}>
            {lines.length} lines
          </span>
          {elapsed !== null && (
            <span style={{ fontSize: 10, color: "var(--color-lime)", fontFamily: "var(--font-geist-mono, monospace)" }}>
              {elapsed}ms · {FIXTURE_ROWS.length} rows
            </span>
          )}
        </div>
      </div>

      {/* ── Right panel: results ─── */}
      <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {rows ? `Results · ${rows.length} rows` : "Results"}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", background: "var(--color-bg)" }}>
          {running && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
              <div style={{ width: 24, height: 24, border: "2px solid var(--color-border)", borderTopColor: "var(--color-gold)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              <span style={{ fontSize: 11, color: "var(--color-text-dim)" }}>Executing query…</span>
            </div>
          )}

          {!running && rows === null && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
              <span style={{ fontSize: 28, opacity: 0.3 }}>⌘↵</span>
              <span style={{ fontSize: 12, color: "var(--color-text-dim)" }}>Run a query to see results</span>
            </div>
          )}

          {!running && rows !== null && rows.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {colHeaders.map((h) => (
                      <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--color-sea)", fontFamily: "var(--font-geist-mono, monospace)", whiteSpace: "nowrap", background: "var(--color-surface)", position: "sticky", top: 0 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: "1px solid var(--color-border)", background: ri % 2 === 0 ? "transparent" : "var(--color-card)" }}>
                      {colHeaders.map((h) => {
                        const val = row[h];
                        return (
                          <td key={h} style={{ padding: "5px 10px", fontSize: 11, fontFamily: "var(--font-geist-mono, monospace)", color: val === null ? "var(--color-text-dim)" : "var(--color-text)", whiteSpace: "nowrap" }}>
                            {val === null ? <span style={{ fontStyle: "italic" }}>NULL</span> : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Export with Suspense (required by Next.js for useSearchParams) ─────────────
export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 56px)", color: "var(--color-text-dim)", fontSize: 13 }}>
        Loading playground…
      </div>
    }>
      <PlaygroundInner />
    </Suspense>
  );
}
