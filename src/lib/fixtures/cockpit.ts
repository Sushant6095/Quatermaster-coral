/**
 * Quartermaster — Cockpit fixtures
 *
 * Mock data for the Risk Cockpit. Loaded directly by the page so the
 * screen renders without any backend wired up. Numbers match the
 * design reference in stitch_project_quartermaster_compliance_dashboard.
 */

import type {
  AuditDefinition,
  CockpitStats,
  Finding,
} from "@/lib/types";

/** Helper — ISO timestamp N minutes ago. */
function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

/** Helper — ISO timestamp N hours ago. */
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60_000).toISOString();
}

/** Helper — ISO timestamp N days ago. */
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60_000).toISOString();
}

export const mockCockpitStats: CockpitStats = {
  riskScore: 72,
  riskDeltaPct: 12,
  zombieAccounts: 7,
  zombieDelta: -2,
  ghostSpendUsdMonthly: 4820,
  ghostSpendDeltaUsd: -320,
  openFindings: 18,
  openP0: 3,
  openP1: 5,
};

export const mockAudits: AuditDefinition[] = [
  {
    id: "QM-01",
    name: "Zombie Account Hunter",
    category: "Security",
    description: "Detects active seats belonging to terminated employees",
    sources: ["deel", "okta", "github", "slack"],
    sqlTemplate: "",
    lastRunIso: minutesAgo(12),
    lastFindingCount: 4,
    avgDurationMs: 1400,
  },
  {
    id: "QM-02",
    name: "Permission Drift",
    category: "Security",
    description: "Flags privilege escalation outside approved roles",
    sources: ["okta", "github"],
    sqlTemplate: "",
    lastRunIso: hoursAgo(1),
    lastFindingCount: 2,
    avgDurationMs: 900,
  },
  {
    id: "QM-03",
    name: "Ghost-Seat Spend",
    category: "Spend",
    description: "Tracks unused SaaS licenses costing $/mo",
    sources: ["stripe", "okta", "linear"],
    sqlTemplate: "",
    lastRunIso: hoursAgo(3),
    lastFindingCount: 8,
    avgDurationMs: 2100,
  },
  {
    id: "QM-04",
    name: "Shadow-IT Detector",
    category: "Spend",
    description: "Surfaces off-list vendor charges with Slack context",
    sources: ["stripe", "slack"],
    sqlTemplate: "",
    lastRunIso: minutesAgo(12),
    lastFindingCount: 3,
    avgDurationMs: 1100,
  },
  {
    id: "QM-05",
    name: "Compliance Ledger",
    category: "Compliance",
    description: "Validates SOC2 control adherence across all sources",
    sources: ["deel", "okta", "github", "slack", "stripe"],
    sqlTemplate: "",
    lastRunIso: daysAgo(1),
    lastFindingCount: 24,
    avgDurationMs: 3400,
  },
];

/**
 * Live-feed fixtures. Timestamps approximate 14:02 → 13:40 to mirror
 * the demo voiceover; tags are intentionally varied across P0/P1/P2.
 */
export const mockLiveFeed: Finding[] = [
  {
    id: "FND-1001",
    auditId: "QM-01",
    severity: "P0",
    targetName: "Mark Reyes",
    targetEmail: "mark.reyes@acme.io",
    rationale: "admin role retained after termination on 2026-05-20",
    evidence: [],
    draftedActions: [],
    sources: ["deel", "okta", "github"],
    detectedIso: minutesAgo(2),
  },
  {
    id: "FND-1002",
    auditId: "QM-03",
    severity: "P1",
    targetName: "Marie Chen",
    targetEmail: "marie.chen@acme.io",
    rationale: "unused Linear seat $25/mo, zero activity in 47 days",
    evidence: [],
    draftedActions: [],
    sources: ["linear", "stripe"],
    detectedIso: minutesAgo(3),
  },
  {
    id: "FND-1003",
    auditId: "QM-04",
    severity: "P0",
    targetName: "3 new shadow-IT charges in #design",
    rationale: "Figma, Framer, Spline charges off the approved vendor list",
    evidence: [],
    draftedActions: [],
    sources: ["stripe", "slack"],
    detectedIso: minutesAgo(6),
  },
  {
    id: "FND-1004",
    auditId: "QM-02",
    severity: "P2",
    targetName: "Permission drift detected for J. Park",
    rationale: "GitHub admin scope expanded outside approved IAM template",
    evidence: [],
    draftedActions: [],
    sources: ["okta", "github"],
    detectedIso: minutesAgo(14),
  },
  {
    id: "FND-1005",
    auditId: "QM-02",
    severity: "P1",
    targetName: "Unrotated GitHub admin token",
    rationale: "PAT older than 180 days with org:admin scope",
    evidence: [],
    draftedActions: [],
    sources: ["github"],
    detectedIso: minutesAgo(19),
  },
  {
    id: "FND-1006",
    auditId: "QM-05",
    severity: "P2",
    targetName: "Guest invited to internal Slack channel",
    rationale: "external guest in #engineering-private without approval",
    evidence: [],
    draftedActions: [],
    sources: ["slack"],
    detectedIso: minutesAgo(24),
  },
];
