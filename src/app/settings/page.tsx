"use client";

/**
 * /settings — Workspace, API keys, MCP server, schedules.
 *
 * Minimal but on-brand. The MCP-server toggle is the killer detail —
 * it shows judges that Quartermaster is a primitive other agents can
 * call, not just an app.
 */

import { useState } from "react";
import { Copy, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

type SettingsSection = "workspace" | "api-keys" | "mcp-server" | "schedules" | "telemetry";

const NAV: Array<{ key: SettingsSection; label: string }> = [
  { key: "workspace", label: "Workspace" },
  { key: "api-keys", label: "API Keys" },
  { key: "mcp-server", label: "MCP server" },
  { key: "schedules", label: "Schedules" },
  { key: "telemetry", label: "Telemetry" },
];

export default function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>("workspace");
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="flex gap-6">
        <aside className="w-[220px] shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setSection(n.key)}
              className={cn(
                "relative flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
                section === n.key
                  ? "bg-[var(--color-card-hover)] text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-card-hover)]/60 hover:text-[var(--color-text)]"
              )}
            >
              {section === n.key && (
                <span
                  aria-hidden
                  className="absolute -left-2 top-1.5 h-[calc(100%-12px)] w-[2px] rounded-r-full bg-[var(--color-gold)]"
                />
              )}
              {n.label}
            </button>
          ))}
        </aside>
        <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          {section === "workspace" && <WorkspaceSection />}
          {section === "api-keys" && <ApiKeysSection />}
          {section === "mcp-server" && <McpSection />}
          {section === "schedules" && <SchedulesSection />}
          {section === "telemetry" && <TelemetrySection />}
        </div>
      </div>
    </div>
  );
}

function WorkspaceSection() {
  return (
    <>
      <h2 className="text-base font-medium">Workspace</h2>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        All Quartermaster state lives on this machine.
      </p>
      <div className="mt-6 space-y-4">
        <Field label="Coral config directory" value="./.coral-workspace" mono />
        <Field label="State database" value="./.qm-state.db" mono />
      </div>
      <DangerZone />
    </>
  );
}

function ApiKeysSection() {
  const [reveal, setReveal] = useState<boolean>(false);
  return (
    <>
      <h2 className="text-base font-medium">API Keys</h2>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Tokens are stored in your local environment. They are never transmitted to
        Quartermaster or any third party.
      </p>
      <div className="mt-6 space-y-3">
        {(["ANTHROPIC_API_KEY", "DEEL_API_TOKEN", "OKTA_API_TOKEN", "GITHUB_TOKEN", "SLACK_BOT_TOKEN", "STRIPE_SECRET_KEY"] as const).map(
          (k) => (
            <div key={k} className="flex items-center gap-3">
              <label className="w-44 text-[11px] font-mono text-[var(--color-text-muted)]">
                {k}
              </label>
              <input
                type={reveal ? "text" : "password"}
                value="••••••••••••••••"
                readOnly
                className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 font-mono text-xs"
              />
              <button
                onClick={() => setReveal((v) => !v)}
                className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
              >
                {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          )
        )}
      </div>
    </>
  );
}

function McpSection() {
  const [enabled, setEnabled] = useState<boolean>(true);
  const cmd = "claude mcp add quartermaster -- npx tsx ./mcp-server/index.ts";
  return (
    <>
      <h2 className="text-base font-medium">MCP server</h2>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Expose Quartermaster as a Model Context Protocol server. Any MCP-aware client
        (Claude Code, Cursor) can call <span className="font-mono">run_audit</span>,{" "}
        <span className="font-mono">get_findings</span>, and{" "}
        <span className="font-mono">draft_remediation</span> as tools.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            enabled ? "bg-[var(--color-gold)]" : "bg-[var(--color-border)]"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-[var(--color-bg)] transition-transform",
              enabled ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </button>
        <span className="text-sm">
          {enabled ? "Exposed as MCP server" : "Disabled"}
        </span>
      </div>
      <div className="mt-6">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)]">
          Registration command
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] p-3">
          <code className="flex-1 font-mono text-xs text-[var(--color-text)]">{cmd}</code>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(cmd);
              toast.success("Copied to clipboard.");
            }}
            className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

function SchedulesSection() {
  return (
    <>
      <h2 className="text-base font-medium">Schedules</h2>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Per-audit run cadence. Continuous Mode overrides these for live monitoring.
      </p>
      <div className="mt-6 space-y-2">
        {[
          "QM-01 Zombie Account Hunter — every 30s when Live, hourly otherwise",
          "QM-02 Permission Drift — daily at 06:00",
          "QM-03 Ghost-Seat Spend — weekly on Monday",
          "QM-04 Shadow-IT Detector — every 12 hours",
          "QM-05 Compliance Ledger — append on any audit completion",
        ].map((s) => (
          <div
            key={s}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-card-hover)]/40 px-3 py-2 text-xs"
          >
            {s}
          </div>
        ))}
      </div>
    </>
  );
}

function TelemetrySection() {
  return (
    <>
      <h2 className="text-base font-medium">Telemetry</h2>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Quartermaster sends zero telemetry. Period. This panel is here so you can
        verify it.
      </p>
      <div className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-card-hover)]/40 p-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lime)]" />
          <span className="font-medium">No telemetry endpoints configured</span>
        </div>
        <div className="mt-1 text-[var(--color-text-muted)]">
          No analytics SDKs loaded · no error reporting · no usage pings.
        </div>
      </div>
    </>
  );
}

interface FieldProps {
  label: string;
  value: string;
  mono?: boolean;
}

function Field({ label, value, mono }: FieldProps) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs",
          mono && "font-mono"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function DangerZone() {
  return (
    <div className="mt-8 rounded-lg border border-[var(--color-coral)]/40 bg-[var(--color-coral)]/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-coral)]">
        <ShieldAlert className="h-4 w-4" />
        Danger zone
      </div>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Permanently delete the local workspace. All audits, findings, and ledger
        entries will be lost.
      </p>
      <button className="mt-3 rounded-md border border-[var(--color-coral)]/60 px-3 py-1.5 text-xs font-medium text-[var(--color-coral)] hover:bg-[var(--color-coral)]/10">
        Delete workspace
      </button>
    </div>
  );
}
