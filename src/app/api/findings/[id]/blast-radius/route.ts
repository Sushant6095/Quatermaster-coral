/**
 * GET /api/findings/[id]/blast-radius
 *
 * Returns the blast radius graph for the principal attached to this finding.
 * Response: { ok: true, data: BlastRadiusData } | { ok: false, error: string }
 */

import { NextResponse } from "next/server";
import { getFinding } from "@/lib/db";
import { buildBlastRadius } from "@/lib/audits/blastRadius";
import { fixtureBlastRadius } from "@/lib/fixtures/blastRadius";
import type { BlastRadiusData } from "@/lib/fixtures/blastRadius";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await ctx.params;

    // Attempt to load from the local SQLite store first.
    const finding = getFinding(id);

    const principalEmail = finding?.targetEmail
      ?? (finding ? `${finding.targetName.toLowerCase().replace(/\s+/g, ".")}@acme.corp` : null);

    if (!principalEmail) {
      // No finding in the DB — fall back to the Mark Reyes fixture so the
      // demo still works without a seeded database.
      const fallback: BlastRadiusData = fixtureBlastRadius("mark.reyes@acme.corp");
      return NextResponse.json({ ok: true, data: fallback });
    }

    const data = await buildBlastRadius(principalEmail);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
