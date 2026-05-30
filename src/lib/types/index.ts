/**
 * Quartermaster — shared types
 *
 * Single source of truth for cross-layer data shapes. The UI imports
 * these and the orchestrator emits matching JSON.
 */

export type Severity = "P0" | "P1" | "P2";

export type SourceKey = "deel" | "okta" | "github" | "slack" | "stripe" | "linear";

export type AuditId = "QM-01" | "QM-02" | "QM-03" | "QM-04" | "QM-05";

export type AuditCategory = "Security" | "Spend" | "Compliance";

export interface AuditDefinition {
  id: AuditId;
  name: string;
  category: AuditCategory;
  description: string;
  sources: SourceKey[];
  sqlTemplate: string;
  lastRunIso?: string;
  lastFindingCount?: number;
  avgDurationMs?: number;
}

export interface Finding {
  id: string;
  auditId: AuditId;
  severity: Severity;
  targetName: string;
  targetEmail?: string;
  department?: string;
  rationale: string;
  evidence: EvidenceItem[];
  draftedActions: RemediationDraft[];
  sources: SourceKey[];
  detectedIso: string;
  resolvedIso?: string;
  snoozedUntilIso?: string;
}

export interface EvidenceItem {
  source: SourceKey;
  title: string;
  detail: string;
  externalUrl?: string;
}

export type RemediationChannel = "slack-dm" | "jira" | "checklist";

export interface RemediationDraft {
  id: string;
  channel: RemediationChannel;
  title: string;
  body: string;
  approved?: boolean;
  rejected?: boolean;
}

export interface LedgerEntry {
  id: string; // EVT-XXXX-XX
  timestampIso: string;
  actor: string;
  action: string;
  source: SourceKey | "system";
  principalEmail?: string;
  ipAddress?: string;
  signatureSha256: string;
  rawPayload: Record<string, unknown>;
}

export interface ConnectionStatus {
  source: SourceKey;
  status: "healthy" | "degraded" | "failing" | "disconnected";
  rowsCached: number;
  lastSyncIso?: string;
  ttlMs: number;
  errorMessage?: string;
}

export interface CockpitStats {
  riskScore: number;            // 0–100
  riskDeltaPct: number;
  zombieAccounts: number;
  zombieDelta: number;
  ghostSpendUsdMonthly: number;
  ghostSpendDeltaUsd: number;
  openFindings: number;
  openP0: number;
  openP1: number;
}

export interface CopilotTurn {
  role: "user" | "assistant";
  content: string;
  sql?: string;
  rows?: Array<Record<string, unknown>>;
  meta?: {
    sourcesUsed: SourceKey[];
    rowsScanned: number;
    tokensIn: number;
    tokensOut: number;
    costCents: number;
    durationMs: number;
  };
  timestampIso: string;
}
