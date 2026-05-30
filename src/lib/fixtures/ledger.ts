import type { LedgerEntry } from "@/lib/types";

/**
 * Deterministic pseudo-SHA-256 — 64 hex chars seeded from id. Avoids
 * a runtime `crypto` import while still rendering convincingly.
 */
function fakeSig(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex: string[] = [];
  let x = h >>> 0;
  for (let i = 0; i < 16; i++) {
    x = Math.imul(x ^ (x >>> 13), 0x5bd1e995) >>> 0;
    hex.push(x.toString(16).padStart(8, "0"));
  }
  return hex.join("").slice(0, 64);
}

export const mockLedgerEntries: LedgerEntry[] = [
  {
    id: "EVT-9218-2B",
    timestampIso: "2026-05-26T14:02:00.000Z",
    actor: "system",
    action:
      "Mark Reyes — GitHub Owner role revoked on quartermaster-inc",
    source: "github",
    principalEmail: "mark.reyes@acme.corp",
    ipAddress: "10.42.18.221",
    signatureSha256: fakeSig("EVT-9218-2B"),
    rawPayload: {
      eventName: "MemberRoleChanged",
      eventTimeUtc: "2026-05-26T14:02:00Z",
      organization: "quartermaster-inc",
      principalEmail: "mark.reyes@acme.corp",
      previousRole: "owner",
      newRole: "none",
      requestId: "rq_5fbA22",
      auditTriggeredBy: "QM-01",
    },
  },
  {
    id: "EVT-9217-1F",
    timestampIso: "2026-05-26T13:58:00.000Z",
    actor: "system",
    action:
      "Marie Chen — Slack workspace seat removed (last-active 31d)",
    source: "slack",
    principalEmail: "marie.chen@acme.corp",
    ipAddress: "10.42.18.221",
    signatureSha256: fakeSig("EVT-9217-1F"),
    rawPayload: {
      eventName: "SeatDeactivated",
      workspace: "acme.slack.com",
      principalEmail: "marie.chen@acme.corp",
      lastActiveDaysAgo: 31,
      auditTriggeredBy: "QM-01",
    },
  },
  {
    id: "EVT-9216-0A",
    timestampIso: "2026-05-26T13:50:00.000Z",
    actor: "system",
    action: "Auto-deprovisioned Stripe seat $25/mo for J. Park",
    source: "stripe",
    principalEmail: "j.park@acme.corp",
    ipAddress: "10.42.18.221",
    signatureSha256: fakeSig("EVT-9216-0A"),
    rawPayload: {
      eventName: "SubscriptionSeatCancelled",
      principalEmail: "j.park@acme.corp",
      seatMonthlyUsd: 25,
      auditTriggeredBy: "QM-03",
    },
  },
  {
    id: "EVT-9215-0B",
    timestampIso: "2026-05-26T13:45:00.000Z",
    actor: "quartermaster",
    action: "Compliance audit QM-01 completed · 0 zombies found",
    source: "system",
    signatureSha256: fakeSig("EVT-9215-0B"),
    rawPayload: {
      eventName: "AuditCompleted",
      auditId: "QM-01",
      findings: 0,
      durationMs: 1432,
    },
  },
  {
    id: "EVT-9214-3C",
    timestampIso: "2026-05-26T12:30:00.000Z",
    actor: "system",
    action: "Adrian Patel — Linear seat removed (3 issues reassigned)",
    source: "linear",
    principalEmail: "adrian.patel@acme.corp",
    ipAddress: "10.42.18.221",
    signatureSha256: fakeSig("EVT-9214-3C"),
    rawPayload: {
      eventName: "SeatRemoved",
      principalEmail: "adrian.patel@acme.corp",
      reassignedIssues: ["SEC-241", "SEC-244", "SUP-118"],
      auditTriggeredBy: "QM-01",
    },
  },
  {
    id: "EVT-9213-7D",
    timestampIso: "2026-05-26T11:15:00.000Z",
    actor: "system",
    action: "Anna Liu — Okta access revoked across 14 apps",
    source: "okta",
    principalEmail: "anna.liu@acme.corp",
    ipAddress: "10.42.18.221",
    signatureSha256: fakeSig("EVT-9213-7D"),
    rawPayload: {
      eventName: "PrincipalDeprovisioned",
      principalEmail: "anna.liu@acme.corp",
      appsRevoked: 14,
      auditTriggeredBy: "QM-01",
    },
  },
  {
    id: "EVT-9212-1A",
    timestampIso: "2026-05-25T18:00:00.000Z",
    actor: "quartermaster",
    action: "Compliance audit QM-05 — generated 12 evidence packs",
    source: "system",
    signatureSha256: fakeSig("EVT-9212-1A"),
    rawPayload: {
      eventName: "AuditCompleted",
      auditId: "QM-05",
      packsGenerated: 12,
      durationMs: 8124,
    },
  },
  {
    id: "EVT-9211-4E",
    timestampIso: "2026-05-25T16:45:00.000Z",
    actor: "system",
    action:
      "T. Sato — GitHub Maintain role downgraded (least-privilege)",
    source: "github",
    principalEmail: "taro.sato@acme.corp",
    ipAddress: "10.42.18.221",
    signatureSha256: fakeSig("EVT-9211-4E"),
    rawPayload: {
      eventName: "MemberRoleChanged",
      principalEmail: "taro.sato@acme.corp",
      previousRole: "maintain",
      newRole: "read",
      auditTriggeredBy: "QM-02",
    },
  },
];
