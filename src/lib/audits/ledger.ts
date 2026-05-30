import { createHash, randomBytes } from "node:crypto";
import { appendLedger as dbAppend, listLedger as dbList } from "@/lib/db";
import type { LedgerEntry, SourceKey } from "@/lib/types";

/** Canonical serialization for the signature — sorted keys, no whitespace. */
function canonicalize(payload: Record<string, unknown>): string {
  const sorted = Object.fromEntries(
    Object.entries(payload).sort(([a], [b]) => a.localeCompare(b))
  );
  return JSON.stringify(sorted);
}

/** Generate a hex SHA-256 signature for a ledger entry. */
export function signEntry(
  id: string,
  timestampIso: string,
  actor: string,
  action: string,
  source: string,
  principalEmail: string | undefined,
  rawPayload: Record<string, unknown>
): string {
  const content = `${id}|${timestampIso}|${actor}|${action}|${source}|${principalEmail ?? ""}|${canonicalize(rawPayload)}`;
  return createHash("sha256").update(content).digest("hex");
}

/** Generate a unique ledger event ID. */
export function newLedgerEventId(): string {
  const hex = randomBytes(4).toString("hex").toUpperCase();
  const idx = String(Math.floor(Date.now() / 1000) % 100).padStart(2, "0");
  return `EVT-${hex}-${idx}`;
}

export interface AppendLedgerInput {
  actor: string;
  action: string;
  source: SourceKey | "system";
  principalEmail?: string;
  ipAddress?: string;
  rawPayload: Record<string, unknown>;
}

/** Append a signed entry to the ledger. Returns the saved entry. */
export function appendLedgerEntry(input: AppendLedgerInput): LedgerEntry {
  const id = newLedgerEventId();
  const timestampIso = new Date().toISOString();
  const sig = signEntry(
    id,
    timestampIso,
    input.actor,
    input.action,
    input.source,
    input.principalEmail,
    input.rawPayload
  );
  const entry: LedgerEntry = {
    id,
    timestampIso,
    actor: input.actor,
    action: input.action,
    source: input.source,
    principalEmail: input.principalEmail,
    ipAddress: input.ipAddress,
    signatureSha256: sig,
    rawPayload: input.rawPayload,
  };
  dbAppend(entry);
  return entry;
}

export function listLedgerEntries(limit = 100): LedgerEntry[] {
  return dbList(limit);
}

/** Verify a ledger entry's signature. */
export function verifyEntry(entry: LedgerEntry): boolean {
  const expected = signEntry(
    entry.id,
    entry.timestampIso,
    entry.actor,
    entry.action,
    entry.source,
    entry.principalEmail,
    entry.rawPayload
  );
  return expected === entry.signatureSha256;
}
