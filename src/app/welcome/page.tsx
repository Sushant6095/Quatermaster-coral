"use client";

/**
 * /welcome — first-run onboarding.
 *
 * Create a local-first workspace (or continue as guest) and a short guided
 * tour of how to use Quartermaster. Standalone (no dashboard chrome / gate).
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  PlayCircle,
  AlertTriangle,
  ScrollText,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { QMLogo } from "@/components/brand/QMLogo";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    title: "Risk Cockpit",
    body: "Your posture at a glance — risk score, KPIs, and a live feed of new findings.",
  },
  {
    icon: MessageSquare,
    title: "Ask the Copilot",
    body: "Type a question in plain English; it compiles to federated SQL and runs it.",
  },
  {
    icon: PlayCircle,
    title: "Run an audit",
    body: "Five named audits join HRIS, Okta, GitHub, Slack & Stripe in one query.",
  },
  {
    icon: AlertTriangle,
    title: "Review findings",
    body: "Inspect evidence, open the Blast Radius, then snooze or resolve.",
  },
  {
    icon: ScrollText,
    title: "Approve & log",
    body: "Approve drafted remediations — every action is signed into the Ledger.",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { create, continueAsGuest } = useWorkspace();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");

  function handleCreate(e: FormEvent): void {
    e.preventDefault();
    create({ name, email, org });
    router.push("/cockpit");
  }

  function handleGuest(): void {
    continueAsGuest();
    router.push("/cockpit");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        {/* Brand */}
        <div className="mb-10 flex items-center gap-2.5 text-[var(--color-text)]">
          <QMLogo size={24} />
          <span className="font-semibold tracking-tight">QUARTERMASTER</span>
          <span className="ml-1 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
            Local-first
          </span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left: intro + guide */}
          <div>
            <h1 className="text-[clamp(1.9rem,4vw,2.8rem)] font-semibold leading-tight tracking-tight">
              Set up your workspace.
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-text-muted)]">
              Quartermaster runs entirely in your browser — your workspace and
              everything you save stay on this device.{" "}
              <span className="text-[var(--color-text)]">PII never leaves.</span>
            </p>

            <div className="mt-8 space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-dim)]">
                How it works
              </span>
              <ol className="space-y-2.5">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <li
                      key={s.title}
                      className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40 p-3"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-accent)]">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[var(--color-text-dim)]">
                            0{i + 1}
                          </span>
                          <span className="text-[13px] font-medium text-[var(--color-text)]">
                            {s.title}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                          {s.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Right: create workspace */}
          <div className="lg:sticky lg:top-12 lg:self-start">
            <form
              onSubmit={handleCreate}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]/50 p-6"
            >
              <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                Create your workspace
              </h2>
              <p className="mt-1 text-[12.5px] text-[var(--color-text-muted)]">
                No account needed — this stays on your device.
              </p>

              <div className="mt-5 space-y-3">
                <Field label="Your name" value={name} onChange={setName} placeholder="Jordan Vale" autoFocus />
                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
                <Field label="Workspace name" value={org} onChange={setOrg} placeholder="acme-corp" />
              </div>

              <button
                type="submit"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-text)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-90"
              >
                Create workspace
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="mt-4 flex items-center gap-3 text-[11px] text-[var(--color-text-dim)]">
                <span className="h-px flex-1 bg-[var(--color-border)]" />
                or
                <span className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              <button
                type="button"
                onClick={handleGuest}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
              >
                Continue as guest
              </button>
              <p className="mt-3 text-center text-[11px] text-[var(--color-text-dim)]">
                Guest mode loads a demo workspace — perfect for a quick look.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}

function Field({ label, value, onChange, placeholder, type = "text", autoFocus }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)]/60"
      />
    </label>
  );
}
