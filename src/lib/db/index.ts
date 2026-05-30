/**
 * Quartermaster — local SQLite state store.
 *
 * Uses `better-sqlite3` to keep findings, ledger entries, copilot
 * threads, and remediation drafts on the user's machine. Path defaults
 * to `./.qm-state.db` and is overridable with `QM_STATE_DB`.
 *
 * No migrations — we just `CREATE TABLE IF NOT EXISTS` on init.
 */

import type Database from "better-sqlite3";
import type { Finding, LedgerEntry, RemediationDraft } from "@/lib/types";

let cached: Database.Database | null = null;

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      audit_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      target_name TEXT NOT NULL,
      target_email TEXT,
      department TEXT,
      rationale TEXT NOT NULL,
      sources_json TEXT NOT NULL,
      evidence_json TEXT NOT NULL,
      drafts_json TEXT NOT NULL,
      detected_iso TEXT NOT NULL,
      resolved_iso TEXT,
      snoozed_until_iso TEXT
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      timestamp_iso TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      source TEXT NOT NULL,
      principal_email TEXT,
      ip_address TEXT,
      signature_sha256 TEXT NOT NULL,
      raw_payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS copilot_threads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_iso TEXT NOT NULL,
      updated_iso TEXT NOT NULL,
      turns_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS remediation_drafts (
      id TEXT PRIMARY KEY,
      finding_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      approved INTEGER DEFAULT 0,
      rejected INTEGER DEFAULT 0,
      created_iso TEXT NOT NULL
    );
  `);
}

export function getDb(): Database.Database {
  if (cached) return cached;
  // Dynamic require so Next.js's edge bundler doesn't try to ship
  // better-sqlite3 to the browser.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Ctor = require("better-sqlite3") as typeof Database;
  const path = process.env.QM_STATE_DB ?? "./.qm-state.db";
  cached = new Ctor(path);
  cached.pragma("journal_mode = WAL");
  initSchema(cached);
  return cached;
}

// --- finding helpers -------------------------------------------------------

export function saveFinding(f: Finding): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO findings (
      id, audit_id, severity, target_name, target_email, department,
      rationale, sources_json, evidence_json, drafts_json,
      detected_iso, resolved_iso, snoozed_until_iso
    ) VALUES (
      @id, @auditId, @severity, @targetName, @targetEmail, @department,
      @rationale, @sourcesJson, @evidenceJson, @draftsJson,
      @detectedIso, @resolvedIso, @snoozedUntilIso
    )
  `).run({
    id: f.id,
    auditId: f.auditId,
    severity: f.severity,
    targetName: f.targetName,
    targetEmail: f.targetEmail ?? null,
    department: f.department ?? null,
    rationale: f.rationale,
    sourcesJson: JSON.stringify(f.sources),
    evidenceJson: JSON.stringify(f.evidence),
    draftsJson: JSON.stringify(f.draftedActions),
    detectedIso: f.detectedIso,
    resolvedIso: f.resolvedIso ?? null,
    snoozedUntilIso: f.snoozedUntilIso ?? null,
  });
}

interface FindingRow {
  id: string;
  audit_id: string;
  severity: string;
  target_name: string;
  target_email: string | null;
  department: string | null;
  rationale: string;
  sources_json: string;
  evidence_json: string;
  drafts_json: string;
  detected_iso: string;
  resolved_iso: string | null;
  snoozed_until_iso: string | null;
}

function rowToFinding(row: FindingRow): Finding {
  return {
    id: row.id,
    auditId: row.audit_id as Finding["auditId"],
    severity: row.severity as Finding["severity"],
    targetName: row.target_name,
    targetEmail: row.target_email ?? undefined,
    department: row.department ?? undefined,
    rationale: row.rationale,
    sources: JSON.parse(row.sources_json) as Finding["sources"],
    evidence: JSON.parse(row.evidence_json) as Finding["evidence"],
    draftedActions: JSON.parse(row.drafts_json) as RemediationDraft[],
    detectedIso: row.detected_iso,
    resolvedIso: row.resolved_iso ?? undefined,
    snoozedUntilIso: row.snoozed_until_iso ?? undefined,
  };
}

export function getFinding(id: string): Finding | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM findings WHERE id = ?").get(id) as FindingRow | undefined;
  return row ? rowToFinding(row) : null;
}

export function updateFindingState(
  id: string,
  patch: { resolvedIso?: string | null; snoozedUntilIso?: string | null },
): Finding | null {
  const db = getDb();
  db.prepare(`
    UPDATE findings
       SET resolved_iso = COALESCE(@resolved, resolved_iso),
           snoozed_until_iso = COALESCE(@snoozed, snoozed_until_iso)
     WHERE id = @id
  `).run({
    id,
    resolved: patch.resolvedIso ?? null,
    snoozed: patch.snoozedUntilIso ?? null,
  });
  return getFinding(id);
}

// --- ledger helpers --------------------------------------------------------

export function appendLedger(e: LedgerEntry): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO ledger_entries (
      id, timestamp_iso, actor, action, source,
      principal_email, ip_address, signature_sha256, raw_payload_json
    ) VALUES (
      @id, @timestampIso, @actor, @action, @source,
      @principalEmail, @ipAddress, @signatureSha256, @rawPayloadJson
    )
  `).run({
    id: e.id,
    timestampIso: e.timestampIso,
    actor: e.actor,
    action: e.action,
    source: e.source,
    principalEmail: e.principalEmail ?? null,
    ipAddress: e.ipAddress ?? null,
    signatureSha256: e.signatureSha256,
    rawPayloadJson: JSON.stringify(e.rawPayload),
  });
}

export function listLedger(limit = 100): LedgerEntry[] {
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM ledger_entries ORDER BY timestamp_iso DESC LIMIT ?",
  ).all(limit) as Array<{
    id: string;
    timestamp_iso: string;
    actor: string;
    action: string;
    source: string;
    principal_email: string | null;
    ip_address: string | null;
    signature_sha256: string;
    raw_payload_json: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    timestampIso: r.timestamp_iso,
    actor: r.actor,
    action: r.action,
    source: r.source as LedgerEntry["source"],
    principalEmail: r.principal_email ?? undefined,
    ipAddress: r.ip_address ?? undefined,
    signatureSha256: r.signature_sha256,
    rawPayload: JSON.parse(r.raw_payload_json) as Record<string, unknown>,
  }));
}
