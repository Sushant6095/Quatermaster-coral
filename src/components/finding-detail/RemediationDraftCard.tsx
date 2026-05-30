"use client";

import { useState } from "react";
import { MessageSquare, FileText, ListChecks, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { RemediationChannel, RemediationDraft } from "@/lib/types";

interface RemediationDraftCardProps {
  draft: RemediationDraft;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

interface ChannelMeta {
  label: string;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function getChannelMeta(channel: RemediationChannel): ChannelMeta {
  switch (channel) {
    case "slack-dm":
      return { label: "Slack DM", color: "var(--color-coral)", Icon: MessageSquare };
    case "jira":
      return { label: "Jira ticket", color: "var(--color-gold)", Icon: FileText };
    case "checklist":
      return { label: "Checklist", color: "var(--color-text-muted)", Icon: ListChecks };
  }
}

export function RemediationDraftCard({
  draft,
  onApprove,
  onReject,
}: RemediationDraftCardProps) {
  const [approved, setApproved] = useState<boolean>(draft.approved ?? false);
  const [rejected, setRejected] = useState<boolean>(draft.rejected ?? false);
  const [editing, setEditing] = useState<boolean>(false);
  const [body, setBody] = useState<string>(draft.body);

  const meta = getChannelMeta(draft.channel);
  const { Icon } = meta;

  function handleApprove(): void {
    setApproved(true);
    onApprove?.(draft.id);
  }

  function handleReject(): void {
    setRejected(true);
    onReject?.(draft.id);
  }

  return (
    <motion.div
      animate={{ opacity: approved || rejected ? 0.6 : 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-[10px] border bg-[var(--color-card)]",
        "border-[var(--color-border)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2 py-0.5",
              "font-mono text-[10px] uppercase tracking-wider"
            )}
            style={{
              color: meta.color,
              background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
            }}
          >
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
          <span className="text-[13px] font-medium text-[var(--color-text)]">
            {draft.title}
          </span>
        </div>
        {approved && (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-[var(--color-lime)]">
            <Check className="h-3 w-3" /> Sent
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-3">
        {editing ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className={cn(
              "w-full resize-none rounded-md border px-3 py-2",
              "border-[var(--color-border)] bg-[var(--color-code-bg)]",
              "font-mono text-[12px] leading-[1.5] text-[var(--color-text)]",
              "focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]"
            )}
          />
        ) : (
          <pre
            className={cn(
              "whitespace-pre-wrap rounded-md border px-3 py-2",
              "border-[var(--color-border)]/60 bg-[var(--color-code-bg)]/60",
              "font-mono text-[12px] leading-[1.5] text-[var(--color-text)]"
            )}
          >
            {body}
          </pre>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <button
          type="button"
          onClick={handleReject}
          disabled={approved || rejected}
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider",
            "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            "transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          disabled={approved || rejected}
          className={cn(
            "rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider",
            "border-[var(--color-border)] text-[var(--color-text)]",
            "hover:bg-[var(--color-card-hover)] hover:border-[var(--color-border-strong)]",
            "transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {editing ? "Save" : "Edit"}
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={approved || rejected}
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider",
            "bg-[var(--color-gold)] text-[var(--color-bg)]",
            "hover:bg-[var(--color-gold-hover)] transition-colors",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {approved ? "Approved" : "Approve"}
        </button>
      </div>
    </motion.div>
  );
}
