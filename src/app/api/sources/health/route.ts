/**
 * GET /api/sources/health
 *
 * Returns the current ConnectionStatus[] for each source. In fixture
 * mode (or with no Coral binary) all five sources report healthy with
 * realistic last-sync timestamps.
 */

import { NextResponse } from "next/server";
import { isFixtureMode } from "@/lib/coral/client";
import { fixtureSourceHealth } from "@/lib/fixtures/coral";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    if (isFixtureMode()) {
      return NextResponse.json({ ok: true, sources: fixtureSourceHealth() });
    }
    // Live mode is not yet wired up; fall back to fixtures for now.
    return NextResponse.json({ ok: true, sources: fixtureSourceHealth() });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
