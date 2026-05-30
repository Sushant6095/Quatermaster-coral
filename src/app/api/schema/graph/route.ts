import { NextResponse } from "next/server";
import { getSchemaGraph } from "@/lib/coral/schemaIndexer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const data = getSchemaGraph();
    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
