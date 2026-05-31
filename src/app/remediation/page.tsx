"use client";

/**
 * /remediation — Remediation Center.
 *
 * Inbox of drafted actions awaiting human approval. Filter sidebar
 * on the left, draft cards on the right. Approve / Edit / Reject per
 * card; bulk Approve-all at the top.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Edit3, X, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { AuditId, RemediationChannel, Severity } from "@/lib/types";

interface DraftRow {
  id: string;
  severity: Severity;
  channel: RemediationChannel;
  auditId: AuditId;
  target: string;
  body: string;
  draftedMinutesAgo: number;
  state: "pending" | "approved" | "rejected";
}

const SEED: DraftRow[] = [
  {
    id: "d-001",
    severity: "P0",
    channel: "slack-dm",
    auditId: "QM-01",
    target: "Mark Reyes",
    body: "Mark Reyes (offboarded 14d ago) still holds Owner role on api-core. Please revoke and rotate any keys he had access to.",
    draftedMinutesAgo: 2,
    state: "pending",
  },
  {
    id: "d-002",
    severity: "P1",
    channel: "jira",
    auditId: "QM-01",
    target: "Mark Reyes",
    body: "[SEC-INC] Revoke lingering GitHub Owner access for Mark Reyes (mark.reyes@acme.corp). Confirm in #it-compliance once complete.",
    draftedMinutesAgo: 2,
    state: "pending",
  },
  {
    id: "d-003",
    severity: "P0",
    channel: "checklist",
    auditId: "QM-05",
    target: "Marie Chen",
    body: "Offboarding checklist for Marie Chen — [ ] Slack seat revoked  [ ] Linear seat revoked  [ ] Stripe billing seat removed  [ ] GitHub access reviewed",
    draftedMinutesAgo: 4,
    state: "pending",
  },
  {
    id: "d-004",
    severity: "P1",
    channel: "slack-dm",
    auditId: "QM-03",
    target: "Finance",
    body: "3 Linear Plus seats ($25/mo each) are unused for 45+ days — see Ghost-Seat Spend audit. Recommend cancellation: $75/mo savings.",
    draftedMinutesAgo: 12,
    state: "pending",
  },
  {
    id: "d-005",
    severity: "P2",
    channel: "jira",
    auditId: "QM-02",
    target: "J. Park",
    body: "[SEC-AUDIT] J. Park holds Maintain role on the auth-service repo but no commits in 92 days. Recommend downgrade to Write per least-privilege.",
    draftedMinutesAgo: 18,
    state: "pending",
  },
  {
    id: "d-006",
    severity: "P0",
    channel: "slack-dm",
    auditId: "QM-04",
    target: "#design",
    body: "Detected $230 charge to 'figma-edu' on May 26 — not on the approved-vendor list. Buyer: design-lead@acme.corp. Shadow IT?",
    draftedMinutesAgo: 22,
    state: "pending",
  },
];

const CHANNEL_TONE: Record<RemediationChannel, string> = {
  "slack-dm": "text-[var(--color-coral)] bg-[var(--color-coral)]/10 border-[var(--color-coral)]/30",
  jira: "text-[var(--color-gold)] bg-[var(--color-gold)]/10 border-[var(--color-gold)]/30",
  checklist: "text-[var(--color-text-muted)] bg-[var(--color-card)] border-[var(--color-border)]",
};

const CHANNEL_LABEL: Record<RemediationChannel, string> = {
  "slack-dm": "Slack DM",
  jira: "Jira ticket",
  checklist: "Checklist",
};

const SEVERITY_TONE: Record<Severity, string> = {
  P0: "bg-[var(--color-coral)] text-black",
  P1: "border border-[var(--color-gold)] text-[var(--color-gold)]",
  P2: "border border-[var(--color-border)] text-[var(--color-text-muted)]",
};

function fireConfetti(): void {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    color: string;
    size: number;
  }

  const particles: Particle[] = [];
  const colors = ["#E4B66B", "#E4B66B", "#E8EEF7", "#A8E063"];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      alpha: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 3,
    });
  }

  let frame = 0;

  function draw(): void {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.y += p.vy;
      p.x += p.vx;
      p.alpha -= 0.012;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
    }
    frame++;
    if (frame < 80) {
      requestAnimationFrame(draw);
    } else {
      document.body.removeChild(canvas);
    }
  }

  requestAnimationFrame(draw);
}

export default function RemediationPage() {
  const [drafts, setDrafts] = useState<DraftRow[]>(SEED);
  const [channelFilters, setChannelFilters] = useState<Set<RemediationChannel>>(
    new Set(["slack-dm", "jira", "checklist"])
  );
  const [severityFilters, setSeverityFilters] = useState<Set<Severity>>(
    new Set(["P0", "P1", "P2"])
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  /** Append a signed Ledger entry for an approved draft. */
  const logApproval = (d: DraftRow): void => {
    void fetch("/api/ledger", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: "user",
        action: `Approved drafted action for ${d.target}`,
        source:
          d.channel === "slack-dm" ? "slack" : d.channel === "jira" ? "github" : "system",
        principalEmail: d.target.includes("@") ? d.target : undefined,
        rawPayload: { draftId: d.id, channel: d.channel, body: d.body },
      }),
    }).catch(() => undefined);
  };

  const updateBody = (id: string, body: string): void => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, body } : d)));
  };

  const visible = useMemo(
    () =>
      drafts.filter(
        (d) =>
          d.state === "pending" &&
          channelFilters.has(d.channel) &&
          severityFilters.has(d.severity)
      ),
    [drafts, channelFilters, severityFilters]
  );

  const counts = useMemo(() => {
    const c = { slack: 0, jira: 0, checklist: 0, p0: 0, p1: 0, p2: 0 };
    for (const d of drafts) {
      if (d.state !== "pending") continue;
      if (d.channel === "slack-dm") c.slack++;
      if (d.channel === "jira") c.jira++;
      if (d.channel === "checklist") c.checklist++;
      if (d.severity === "P0") c.p0++;
      if (d.severity === "P1") c.p1++;
      if (d.severity === "P2") c.p2++;
    }
    return c;
  }, [drafts]);

  const updateDraft = (id: string, state: DraftRow["state"]): void => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, state } : d))
    );
  };

  const approveAll = (): void => {
    const targets = visible;
    const ids = targets.map((d) => d.id);
    setDrafts((prev) =>
      prev.map((d) => (ids.includes(d.id) ? { ...d, state: "approved" } : d))
    );
    // Write a signed Ledger entry per approved draft (same as single Approve).
    for (const d of targets) logApproval(d);
    toast.success(`Approved ${ids.length} drafts · written to the Ledger.`);
    if (ids.length >= 10) {
      fireConfetti();
    }
  };

  const toggleSet = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Remediation</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {visible.length} drafts waiting for approval · audits ran 12m ago
          </p>
        </div>
        <button
          onClick={approveAll}
          disabled={visible.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-gold)] px-4 py-2 text-xs font-medium text-black hover:bg-[var(--color-gold-hover)] disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          Approve all visible ({visible.length})
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className="w-[240px] shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <FilterGroup label="Channel">
            <FilterCheckbox
              label={`Slack DM (${counts.slack})`}
              checked={channelFilters.has("slack-dm")}
              onChange={() => setChannelFilters(toggleSet(channelFilters, "slack-dm"))}
            />
            <FilterCheckbox
              label={`Jira ticket (${counts.jira})`}
              checked={channelFilters.has("jira")}
              onChange={() => setChannelFilters(toggleSet(channelFilters, "jira"))}
            />
            <FilterCheckbox
              label={`Checklist (${counts.checklist})`}
              checked={channelFilters.has("checklist")}
              onChange={() => setChannelFilters(toggleSet(channelFilters, "checklist"))}
            />
          </FilterGroup>
          <FilterGroup label="Severity">
            <FilterCheckbox
              label={`P0 (${counts.p0})`}
              checked={severityFilters.has("P0")}
              onChange={() => setSeverityFilters(toggleSet(severityFilters, "P0"))}
            />
            <FilterCheckbox
              label={`P1 (${counts.p1})`}
              checked={severityFilters.has("P1")}
              onChange={() => setSeverityFilters(toggleSet(severityFilters, "P1"))}
            />
            <FilterCheckbox
              label={`P2 (${counts.p2})`}
              checked={severityFilters.has("P2")}
              onChange={() => setSeverityFilters(toggleSet(severityFilters, "P2"))}
            />
          </FilterGroup>
        </aside>

        {/* Draft list */}
        <div className="flex-1 space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((d) => (
              <motion.div
                key={d.id}
                initial={{ y: 8 }}
                animate={{ y: 0 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-pill px-2 py-0.5 text-[10px] font-bold",
                        SEVERITY_TONE[d.severity]
                      )}
                    >
                      {d.severity}
                    </span>
                    <span
                      className={cn(
                        "rounded-pill border px-2 py-0.5 text-[10px] font-medium",
                        CHANNEL_TONE[d.channel]
                      )}
                    >
                      {CHANNEL_LABEL[d.channel]}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      From:{" "}
                      <span className="font-mono text-[var(--color-text)]">
                        {d.auditId}
                      </span>{" "}
                      / {d.target}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    Drafted {d.draftedMinutesAgo}m ago
                  </span>
                </div>
                {editingId === d.id ? (
                  <textarea
                    value={d.body}
                    onChange={(e) => updateBody(d.id, e.target.value)}
                    rows={4}
                    className="mt-3 w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] p-3 font-mono text-[12px] leading-relaxed text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]"
                  />
                ) : (
                  <p className="mt-3 rounded-md bg-[var(--color-code-bg)]/40 p-3 font-mono text-[12px] leading-relaxed text-[var(--color-text)]">
                    {d.body}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateDraft(d.id, "approved");
                      setEditingId(null);
                      toast.success(`Sent ${CHANNEL_LABEL[d.channel]} for ${d.target}.`);
                      logApproval(d);
                    }}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--color-gold)] px-3 py-1.5 text-[11px] font-medium text-black hover:bg-[var(--color-gold-hover)]"
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </button>
                  <button
                    onClick={() => setEditingId(editingId === d.id ? null : d.id)}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
                  >
                    <Edit3 className="h-3 w-3" />
                    {editingId === d.id ? "Done" : "Edit"}
                  </button>
                  <button
                    onClick={() => updateDraft(d.id, "rejected")}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {visible.length === 0 && (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center text-sm text-[var(--color-text-muted)]">
              Nothing to approve. Run an audit ↗
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FilterGroupProps {
  label: string;
  children: React.ReactNode;
}

function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)]">
        {label}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function FilterCheckbox({ label, checked, onChange }: FilterCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-gold)] focus:ring-[var(--color-gold)]"
      />
      <span>{label}</span>
    </label>
  );
}
