"use client";

import { Github, MessageSquare, CircleDot, CreditCard, KeyRound, Briefcase, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { EvidenceItem, SourceKey } from "@/lib/types";

interface EvidenceCardProps {
  item: EvidenceItem;
}

interface SourceMeta {
  label: string;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function getSourceMeta(source: SourceKey): SourceMeta {
  switch (source) {
    case "github":
      return { label: "GitHub", color: "var(--color-text)", Icon: Github };
    case "slack":
      return { label: "Slack", color: "var(--color-coral)", Icon: MessageSquare };
    case "linear":
      return { label: "Linear", color: "var(--color-sea)", Icon: CircleDot };
    case "stripe":
      return { label: "Stripe", color: "var(--color-gold)", Icon: CreditCard };
    case "okta":
      return { label: "Okta", color: "var(--color-sea)", Icon: KeyRound };
    case "deel":
      return { label: "Deel", color: "var(--color-lime)", Icon: Briefcase };
    default:
      return { label: source, color: "var(--color-text-muted)", Icon: CircleDot };
  }
}

export function EvidenceCard({ item }: EvidenceCardProps) {
  const { label, color, Icon } = getSourceMeta(item.source);
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-[10px] border px-4 py-3 transition-colors",
        "border-[var(--color-border)] bg-[var(--color-card)]",
        "hover:bg-[var(--color-card-hover)] hover:border-[var(--color-border-strong)]"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          "border border-[var(--color-border)] bg-[var(--color-bg)]"
        )}
        style={{ color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[11px] uppercase tracking-wider"
            style={{ color }}
          >
            {label}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">·</span>
          <span className="text-[13px] font-medium text-[var(--color-text)]">
            {item.title}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-[var(--color-text-muted)]">
          {item.detail}
        </p>
      </div>
      {item.externalUrl && (
        <a
          href={item.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "shrink-0 inline-flex items-center gap-1 self-center",
            "font-mono text-[11px] uppercase tracking-wider text-[var(--color-gold)]",
            "opacity-70 transition-opacity hover:opacity-100"
          )}
        >
          Open in {label}
          <ArrowUpRight className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
