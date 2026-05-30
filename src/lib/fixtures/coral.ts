/**
 * Quartermaster — Coral fixture rows for each audit.
 *
 * Returned by `coral/client.ts` when `QM_FIXTURES=on`. Shapes mirror
 * what a real Coral federation result would look like; finding-shaped
 * objects are also produced for the orchestrator's `runAudit` loop.
 */

function randomUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
import type {
  AuditId,
  ConnectionStatus,
  EvidenceItem,
  Finding,
  Severity,
  SourceKey,
} from "@/lib/types";

export interface CoralFixtureResult {
  rows: Array<Record<string, unknown>>;
  durationMs: number;
  sourcesUsed: SourceKey[];
  rowsScanned: number;
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60_000).toISOString();
}

// --- raw row fixtures --------------------------------------------------------

const QM_01_ROWS: Array<Record<string, unknown>> = [
  {
    work_email: "mark.reyes@acme.io",
    github_handle: "mreyes",
    github_role: "admin",
    slack_user_id: "U017MARK",
    okta_status: "ACTIVE",
    linear_email: "mark.reyes@acme.io",
  },
  {
    work_email: "priya.shah@acme.io",
    github_handle: "pshah-acme",
    github_role: "member",
    slack_user_id: "U021PRIYA",
    okta_status: "ACTIVE",
    linear_email: null,
  },
  {
    work_email: "dan.kowalski@acme.io",
    github_handle: null,
    github_role: null,
    slack_user_id: "U042DAN",
    okta_status: "ACTIVE",
    linear_email: "dan.kowalski@acme.io",
  },
  {
    work_email: "lily.tran@acme.io",
    github_handle: "lily-tran",
    github_role: "member",
    slack_user_id: null,
    okta_status: null,
    linear_email: null,
  },
];

const QM_02_ROWS: Array<Record<string, unknown>> = [
  {
    work_email: "j.park@acme.io",
    app_name: "GitHub Enterprise",
    role: "admin",
    last_used_at: daysAgo(112),
    github_role: "admin",
  },
  {
    work_email: "ana.silva@acme.io",
    app_name: "AWS Production",
    role: "owner",
    last_used_at: daysAgo(187),
    github_role: null,
  },
];

const QM_03_ROWS: Array<Record<string, unknown>> = [
  {
    work_email: "marie.chen@acme.io",
    product__name: "Linear Pro",
    monthly_usd: 25,
    commits_30d: 0,
    started_at: daysAgo(220),
  },
  {
    work_email: "owen.fisher@acme.io",
    product__name: "Figma Org",
    monthly_usd: 45,
    commits_30d: 0,
    started_at: daysAgo(310),
  },
  {
    work_email: "sam.haines@acme.io",
    product__name: "Notion Team",
    monthly_usd: 18,
    commits_30d: 0,
    started_at: daysAgo(140),
  },
];

const QM_04_ROWS: Array<Record<string, unknown>> = [
  {
    charge_id: "ch_3MQK8Y2eZvKYlo2C",
    vendor: "FRAMER.COM",
    amount_usd: 240,
    payer: "design-ops@acme.io",
    slack_channel: "design",
    slack_author: "ravi.menon@acme.io",
  },
  {
    charge_id: "ch_3MQK91L2eZvKYlo2C",
    vendor: "SPLINE.DESIGN",
    amount_usd: 60,
    payer: "design-ops@acme.io",
    slack_channel: "design",
    slack_author: "ravi.menon@acme.io",
  },
  {
    charge_id: "ch_3MQKAB2eZvKYlo2C",
    vendor: "VERCEL PRO",
    amount_usd: 240,
    payer: "platform@acme.io",
    slack_channel: "eng-infra",
    slack_author: "noah.patel@acme.io",
  },
];

const QM_05_ROWS: Array<Record<string, unknown>> = [
  {
    work_email: "mark.reyes@acme.io",
    full_name: "Mark Reyes",
    termination_date: daysAgo(10),
    okta_status: "ACTIVE",
    okta_last_login: daysAgo(2),
    github_handle: "mreyes",
    github_last_active: daysAgo(1),
    slack_user_id: "U017MARK",
    slack_deleted: false,
    last_stripe_cancel: null,
    stripe_subs: 2,
  },
  {
    work_email: "priya.shah@acme.io",
    full_name: "Priya Shah",
    termination_date: daysAgo(35),
    okta_status: "ACTIVE",
    okta_last_login: daysAgo(20),
    github_handle: "pshah-acme",
    github_last_active: daysAgo(28),
    slack_user_id: "U021PRIYA",
    slack_deleted: false,
    last_stripe_cancel: daysAgo(34),
    stripe_subs: 1,
  },
];

const FIXTURE_BY_AUDIT: Record<AuditId, CoralFixtureResult> = {
  "QM-01": { rows: QM_01_ROWS, durationMs: 1420, sourcesUsed: ["deel", "okta", "github", "slack", "linear"], rowsScanned: 4821 },
  "QM-02": { rows: QM_02_ROWS, durationMs: 910, sourcesUsed: ["deel", "okta", "github"], rowsScanned: 1932 },
  "QM-03": { rows: QM_03_ROWS, durationMs: 2050, sourcesUsed: ["deel", "stripe", "github"], rowsScanned: 6710 },
  "QM-04": { rows: QM_04_ROWS, durationMs: 1180, sourcesUsed: ["stripe", "slack"], rowsScanned: 3300 },
  "QM-05": { rows: QM_05_ROWS, durationMs: 3420, sourcesUsed: ["deel", "okta", "github", "slack", "stripe"], rowsScanned: 9120 },
};

export function fixtureCoralForAudit(id: AuditId): CoralFixtureResult {
  const f = FIXTURE_BY_AUDIT[id];
  return {
    rows: f.rows.map((r) => ({ ...r })),
    durationMs: f.durationMs,
    sourcesUsed: [...f.sourcesUsed],
    rowsScanned: f.rowsScanned,
  };
}

/** Generic copilot fallback when running fixture mode without an API key. */
export function fixtureCoralForQuestion(question: string): CoralFixtureResult {
  const lower = question.toLowerCase();
  if (lower.includes("ghost") || lower.includes("seat") || lower.includes("spend")) {
    return fixtureCoralForAudit("QM-03");
  }
  if (lower.includes("shadow") || lower.includes("vendor") || lower.includes("stripe")) {
    return fixtureCoralForAudit("QM-04");
  }
  if (lower.includes("permission") || lower.includes("admin")) {
    return fixtureCoralForAudit("QM-02");
  }
  if (lower.includes("compliance") || lower.includes("soc2") || lower.includes("evidence")) {
    return fixtureCoralForAudit("QM-05");
  }
  return fixtureCoralForAudit("QM-01");
}

// --- finding-shaped fixtures ------------------------------------------------

function rowToFinding(
  auditId: AuditId,
  row: Record<string, unknown>,
): Finding {
  const severity: Severity =
    auditId === "QM-01" || auditId === "QM-04"
      ? "P0"
      : auditId === "QM-02" || auditId === "QM-03"
        ? "P1"
        : "P2";

  const targetName = (row["full_name"] as string | undefined)
    ?? (row["work_email"] as string | undefined)
    ?? (row["vendor"] as string | undefined)
    ?? "Unknown";

  const targetEmail = (row["work_email"] as string | undefined)
    ?? (row["payer"] as string | undefined)
    ?? undefined;

  return {
    id: `FND-${randomUUID().slice(0, 8).toUpperCase()}`,
    auditId,
    severity,
    targetName,
    targetEmail,
    rationale: rationaleFor(auditId, row),
    evidence: evidenceFor(auditId, row),
    draftedActions: [],
    sources: sourcesFor(auditId),
    detectedIso: minutesAgo(Math.floor(Math.random() * 30) + 1),
  };
}

function rationaleFor(auditId: AuditId, row: Record<string, unknown>): string {
  switch (auditId) {
    case "QM-01":
      return `Terminated employee still active on ${[row["github_handle"] && "GitHub", row["slack_user_id"] && "Slack", row["okta_status"] && "Okta", row["linear_email"] && "Linear"].filter(Boolean).join(", ") || "downstream systems"}.`;
    case "QM-02":
      return `${row["role"]} role on ${row["app_name"]} unused since ${row["last_used_at"]}.`;
    case "QM-03":
      return `${row["product__name"]} seat costs $${row["monthly_usd"]}/mo, zero commits in 30 days.`;
    case "QM-04":
      return `Off-list vendor ${row["vendor"]} charged $${row["amount_usd"]}, mentioned in #${row["slack_channel"]}.`;
    case "QM-05":
      return `Termination ${row["termination_date"]} — ${row["stripe_subs"]} Stripe subscriptions still attached.`;
    default:
      return "Finding produced by federated SQL.";
  }
}

function evidenceFor(auditId: AuditId, row: Record<string, unknown>): EvidenceItem[] {
  const out: EvidenceItem[] = [];
  if (row["github_handle"]) {
    out.push({ source: "github" as SourceKey, title: "GitHub membership", detail: `@${row["github_handle"]} (${row["github_role"] ?? "member"})` });
  }
  if (row["slack_user_id"]) {
    out.push({ source: "slack" as SourceKey, title: "Slack member", detail: String(row["slack_user_id"]) });
  }
  if (row["okta_status"]) {
    out.push({ source: "okta" as SourceKey, title: "Okta status", detail: String(row["okta_status"]) });
  }
  if (row["product__name"]) {
    out.push({ source: "stripe" as SourceKey, title: row["product__name"] as string, detail: `$${row["monthly_usd"]}/mo` });
  }
  if (row["vendor"]) {
    out.push({ source: "stripe" as SourceKey, title: String(row["vendor"]), detail: `Charge ${row["charge_id"]}` });
  }
  if (auditId === "QM-05") {
    out.push({ source: "deel" as SourceKey, title: "Termination", detail: String(row["termination_date"]) });
  }
  return out;
}

function sourcesFor(auditId: AuditId): SourceKey[] {
  switch (auditId) {
    case "QM-01": return ["deel", "okta", "github", "slack", "linear"];
    case "QM-02": return ["deel", "okta", "github"];
    case "QM-03": return ["deel", "stripe", "github"];
    case "QM-04": return ["stripe", "slack"];
    case "QM-05": return ["deel", "okta", "github", "slack", "stripe"];
  }
}

export function fixtureFindingsForAudit(id: AuditId): Finding[] {
  return fixtureCoralForAudit(id).rows.map((row) => rowToFinding(id, row));
}

// --- connection health fixtures --------------------------------------------

export function fixtureSourceHealth(): ConnectionStatus[] {
  return [
    { source: "deel",   status: "healthy", rowsCached: 412,  lastSyncIso: minutesAgo(3),  ttlMs: 15 * 60_000 },
    { source: "okta",   status: "healthy", rowsCached: 1284, lastSyncIso: minutesAgo(4),  ttlMs: 10 * 60_000 },
    { source: "github", status: "healthy", rowsCached: 9821, lastSyncIso: minutesAgo(6),  ttlMs: 10 * 60_000 },
    { source: "slack",  status: "healthy", rowsCached: 6402, lastSyncIso: minutesAgo(2),  ttlMs: 5 * 60_000 },
    { source: "stripe", status: "healthy", rowsCached: 1108, lastSyncIso: minutesAgo(9),  ttlMs: 30 * 60_000 },
  ];
}
