// GET /api/ledger?limit=100  — list entries newest first
// POST /api/ledger  — body: AppendLedgerInput — append a signed entry
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendLedgerEntry, listLedgerEntries } from "@/lib/audits/ledger";
import { appendLedger } from "@/lib/db";
import { mockLedgerEntries } from "@/lib/fixtures/ledger";

const appendSchema = z.object({
  actor: z.string().default("system"),
  action: z.string().min(1),
  source: z.enum(["deel", "okta", "github", "slack", "stripe", "linear", "system"]),
  principalEmail: z.string().email().optional(),
  ipAddress: z.string().optional(),
  rawPayload: z.record(z.unknown()).default({}),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const limit = Math.min(
      500,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "100", 10) || 100)
    );

    // Seed with fixture data if ledger is empty
    const existing = listLedgerEntries(1);
    if (existing.length === 0) {
      for (const entry of mockLedgerEntries) {
        appendLedger(entry);
      }
    }

    const entries = listLedgerEntries(limit);
    return NextResponse.json({ ok: true, entries, count: entries.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = appendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const entry = appendLedgerEntry(parsed.data);
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
