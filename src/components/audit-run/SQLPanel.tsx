"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, RotateCw, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SQLPanelProps {
  sql: string;
  streaming?: boolean;
  filename?: string;
  onCopy?: () => void;
  onRerun?: () => void;
}

/* ----------------------------------------------------------------
   Minimal regex highlighter — keeps us in a single client component
   without server-only shiki. Brand colors only.
   ---------------------------------------------------------------- */

const KEYWORDS = [
  "WITH","AS","SELECT","FROM","WHERE","JOIN","LEFT","RIGHT","INNER","OUTER",
  "ON","AND","OR","NOT","IN","IS","NULL","TRUE","FALSE","ORDER","BY","GROUP",
  "HAVING","LIMIT","ASC","DESC","UNION","ALL","CASE","WHEN","THEN","ELSE",
  "END","INTERVAL","DAY","CURRENT_DATE","CURRENT_TIMESTAMP","DISTINCT","COUNT",
  "SUM","AVG","MIN","MAX","COALESCE","CAST","DATE","DATEDIFF",
];

const SOURCES = ["deel", "okta", "github", "slack", "stripe", "linear"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlight(sql: string): string {
  const lines = sql.split("\n");
  return lines
    .map((line) => {
      // Comment line
      const commentIdx = line.indexOf("--");
      let head = line;
      let tail = "";
      if (commentIdx >= 0) {
        head = line.slice(0, commentIdx);
        tail = line.slice(commentIdx);
      }

      let out = escapeHtml(head);

      // Strings ('...')
      out = out.replace(
        /'([^']*)'/g,
        `<span style="color:var(--color-gold)">'$1'</span>`
      );

      // Numbers
      out = out.replace(
        /\b(\d+(?:\.\d+)?)\b/g,
        `<span style="color:var(--color-sea)">$1</span>`
      );

      // Keywords
      const kwRe = new RegExp(
        `\\b(${KEYWORDS.join("|")})\\b`,
        "g"
      );
      out = out.replace(
        kwRe,
        `<span style="color:var(--color-sea);font-weight:600">$1</span>`
      );

      // Known source names (e.g. github.repo_collaborators)
      const srcRe = new RegExp(`\\b(${SOURCES.join("|")})\\b`, "g");
      out = out.replace(
        srcRe,
        `<span style="color:var(--color-coral)">$1</span>`
      );

      if (tail) {
        out += `<span style="color:var(--color-text-dim);font-style:italic">${escapeHtml(tail)}</span>`;
      }

      return out;
    })
    .join("\n");
}

export function SQLPanel({
  sql,
  streaming,
  filename = "QM-01.sql",
  onCopy,
  onRerun,
}: SQLPanelProps) {
  const [copied, setCopied] = useState(false);

  // Character-by-character typing animation — 40ms per char when streaming.
  // Snaps to full SQL immediately when streaming stops (first row arrived).
  const [displayedLen, setDisplayedLen] = useState(streaming ? 0 : sql.length);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (streaming) {
      setDisplayedLen(0);
      intervalRef.current = setInterval(() => {
        setDisplayedLen((prev) => {
          if (prev >= sql.length) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 40);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedLen(sql.length);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [streaming, sql]);

  const visibleSql = sql.slice(0, displayedLen);
  const html = useMemo(() => highlight(visibleSql), [visibleSql]);

  function handleCopy(): void {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(sql);
    }
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[10px] border",
        "border-[var(--color-border)] bg-[var(--color-code-bg)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-coral)]/70" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]/70" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-lime)]/70" />
          <span className="ml-3 font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
            {filename}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] uppercase tracking-wider",
              "text-[var(--color-text-muted)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]",
              "transition-colors"
            )}
            aria-label="Copy SQL"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[var(--color-lime)]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onRerun}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] uppercase tracking-wider",
              "text-[var(--color-text-muted)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]",
              "transition-colors"
            )}
            aria-label="Re-run audit"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Re-run
          </button>
        </div>
      </div>

      {/* Code */}
      <pre
        className={cn(
          "flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-[1.5]",
          "text-[var(--color-text)]"
        )}
      >
        <code dangerouslySetInnerHTML={{ __html: html }} />
        {streaming && displayedLen < sql.length && (
          <span className="animate-caret ml-0.5 inline-block text-[var(--color-gold)]">
            █
          </span>
        )}
      </pre>
    </div>
  );
}
