"use client";

import { X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils/cn";
import type { Finding, Severity } from "@/lib/types";
import { EvidenceCard } from "./EvidenceCard";
import { RemediationDraftCard } from "./RemediationDraftCard";

interface FindingSlideOverProps {
  finding: Finding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blastRadiusNodes?: number;
  onBlastRadius?: () => void;
  onSnooze?: () => void;
  onResolve?: () => void;
  onApprove?: (remediationId: string) => void;
  onReject?: (remediationId: string) => void;
}

function severityLabel(s: Severity): string {
  if (s === "P0") return "P0 — Critical";
  if (s === "P1") return "P1 — High";
  return "P2 — Info";
}

function severityToneClass(s: Severity): string {
  if (s === "P0")
    return "bg-[var(--color-coral)]/15 text-[var(--color-coral)] ring-[var(--color-coral)]/40";
  if (s === "P1")
    return "bg-[var(--color-gold)]/15 text-[var(--color-gold)] ring-[var(--color-gold)]/40";
  return "bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)] ring-[var(--color-text-muted)]/40";
}

function offboardedDays(finding: Finding): number | undefined {
  // Naive heuristic — pulled from rationale text or detected age.
  const m = /(\d+)\s*days/.exec(finding.rationale);
  return m ? Number(m[1]) : undefined;
}

export function FindingSlideOver({
  finding,
  open,
  onOpenChange,
  blastRadiusNodes = 47,
  onBlastRadius,
  onSnooze,
  onResolve,
  onApprove,
  onReject,
}: FindingSlideOverProps) {
  const days = offboardedDays(finding);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPortal forceMount>
            <DialogOverlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </DialogOverlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "fixed right-0 top-0 z-50 flex h-screen w-[640px] max-w-[100vw] flex-col",
                  "border-l border-[var(--color-border)] bg-[var(--color-surface)]",
                  "shadow-[0_0_60px_rgba(0,0,0,0.5)] outline-none"
                )}
              >
                {/* Header */}
                <div className="relative border-b border-[var(--color-border)] px-6 py-5">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-md",
                      "text-[var(--color-text-muted)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]",
                      "transition-colors"
                    )}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-0.5 ring-1 ring-inset",
                      "font-mono text-[11px] font-semibold tracking-wider",
                      severityToneClass(finding.severity)
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {severityLabel(finding.severity)}
                  </span>
                  <DialogTitle asChild>
                    <h2 className="mt-3 text-[22px] font-bold leading-tight text-[var(--color-text)]">
                      {finding.targetName}
                    </h2>
                  </DialogTitle>
                  <div className="mt-1 flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]">
                    {finding.department && <span>{finding.department}</span>}
                    {finding.targetEmail && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[12px]">
                          {finding.targetEmail}
                        </span>
                      </>
                    )}
                    {typeof days === "number" && (
                      <>
                        <span>·</span>
                        <span>Offboarded {days} days ago</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {/* Why this matters */}
                  <section>
                    <h3 className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      Why this matters
                    </h3>
                    <div
                      className={cn(
                        "mt-2 rounded-[10px] border bg-[var(--color-card)] px-4 py-3",
                        "border-[var(--color-border)]"
                      )}
                    >
                      <p className="text-[14px] leading-[1.55] text-[var(--color-text)]">
                        {finding.rationale}
                      </p>
                    </div>
                  </section>

                  {/* Evidence */}
                  <section className="mt-6">
                    <h3 className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      Evidence ({finding.evidence.length})
                    </h3>
                    <div className="mt-2 space-y-2">
                      {finding.evidence.map((e, i) => (
                        <EvidenceCard key={`${e.source}-${i}`} item={e} />
                      ))}
                    </div>
                  </section>

                  {/* Blast radius */}
                  <section className="mt-6">
                    <button
                      type="button"
                      onClick={onBlastRadius}
                      className={cn(
                        "group flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-3",
                        "bg-[var(--color-coral)] text-[var(--color-bg)] font-semibold",
                        "hover:bg-[var(--color-coral-deep)] transition-colors"
                      )}
                    >
                      <Zap className="h-4 w-4" />
                      View Blast Radius ({blastRadiusNodes} nodes)
                    </button>
                  </section>

                  {/* Drafted actions */}
                  <section className="mt-6 pb-4">
                    <h3 className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      Drafted actions
                    </h3>
                    <div className="mt-2 space-y-3">
                      {finding.draftedActions.map((d) => (
                        <RemediationDraftCard
                          key={d.id}
                          draft={d}
                          onApprove={onApprove}
                          onReject={onReject}
                        />
                      ))}
                    </div>
                  </section>
                </div>

                {/* Sticky footer */}
                <div
                  className={cn(
                    "sticky bottom-0 flex items-center justify-between gap-3 border-t px-6 py-3",
                    "border-[var(--color-border)] bg-[var(--color-surface)]"
                  )}
                >
                  <button
                    type="button"
                    onClick={onSnooze}
                    className={cn(
                      "rounded-md border px-4 py-2 text-[13px] font-medium",
                      "border-[var(--color-border)] text-[var(--color-text)]",
                      "hover:bg-[var(--color-card)] hover:border-[var(--color-border-strong)]",
                      "transition-colors"
                    )}
                  >
                    Snooze 7 days
                  </button>
                  <button
                    type="button"
                    onClick={onResolve}
                    className={cn(
                      "rounded-md px-4 py-2 text-[13px] font-semibold",
                      "bg-[var(--color-gold)] text-[var(--color-bg)]",
                      "hover:bg-[var(--color-gold-hover)] transition-colors"
                    )}
                  >
                    Mark as resolved
                  </button>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
