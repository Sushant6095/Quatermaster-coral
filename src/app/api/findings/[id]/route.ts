/**
 * /api/findings/[id]
 *
 * GET    — return a finding.
 * PATCH  — { action: "resolve" | "snooze", snoozeUntilIso? } update state.
 * POST   — { remediationId, action: "approve" | "reject" } toggle a remediation draft,
 *          appending a ledger entry on approve.
 */

import { createHash, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { LedgerEntry, RemediationDraft, SourceKey } from "@/lib/types";
import {
  appendLedger,
  getFinding,
  saveFinding,
  updateFindingState,
} from "@/lib/db";
import { fixtureFindingsForAudit } from "@/lib/fixtures/coral";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  action: z.enum(["resolve", "snooze"]),
  snoozeUntilIso: z.string().optional(),
});

const postSchema = z.object({
  remediationId: z.string(),
  action: z.enum(["approve", "reject"]),
  actor: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Ensure a finding exists in the DB; if not, hydrate from fixtures. */
function ensureFinding(id: string) {
  let f = getFinding(id);
  if (f) return f;
  for (const auditId of ["QM-01", "QM-02", "QM-03", "QM-04", "QM-05"] as const) {
    for (const candidate of fixtureFindingsForAudit(auditId)) {
      if (candidate.id === id) {
        saveFinding(candidate);
        return candidate;
      }
    }
  }
  f = getFinding(id);
  return f;
}

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { id } = await ctx.params;
  const finding = ensureFinding(id);
  if (!finding) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, finding });
}

export async function PATCH(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { id } = await ctx.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Invalid body" },
      { status: 400 },
    );
  }

  const existing = ensureFinding(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  const updated = body.action === "resolve"
    ? updateFindingState(id, { resolvedIso: nowIso })
    : updateFindingState(id, { snoozedUntilIso: body.snoozeUntilIso ?? new Date(Date.now() + 7 * 24 * 3600_000).toISOString() });

  return NextResponse.json({ ok: true, finding: updated });
}

function makeLedger(action: string, finding: { id: string; targetEmail?: string; sources: SourceKey[] }, actor: string): LedgerEntry {
  const payload = {
    findingId: finding.id,
    targetEmail: finding.targetEmail,
    sources: finding.sources,
  };
  const signature = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return {
    id: `EVT-${randomUUID().slice(0, 8).toUpperCase()}`,
    timestampIso: new Date().toISOString(),
    actor,
    action,
    source: "system",
    principalEmail: finding.targetEmail,
    ipAddress: undefined,
    signatureSha256: signature,
    rawPayload: payload,
  };
}

export async function POST(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { id } = await ctx.params;
  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Invalid body" },
      { status: 400 },
    );
  }

  const existing = ensureFinding(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const updatedDrafts: RemediationDraft[] = existing.draftedActions.map((d) =>
    d.id === body.remediationId
      ? { ...d, approved: body.action === "approve", rejected: body.action === "reject" }
      : d,
  );

  const next = { ...existing, draftedActions: updatedDrafts };
  saveFinding(next);

  if (body.action === "approve") {
    appendLedger(makeLedger("remediation.approved", existing, body.actor ?? "operator"));
  }

  return NextResponse.json({ ok: true, finding: next });
}
