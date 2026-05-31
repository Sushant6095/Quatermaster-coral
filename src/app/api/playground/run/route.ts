/**
 * POST /api/playground/run
 *
 * Body: { sql: string }
 * Executes a read-only (SELECT/WITH) query against Coral and returns rows.
 * Read-only by design — anything other than SELECT/WITH is rejected.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executeSQL } from "@/lib/coral/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({ sql: z.string().min(1).max(5000) });

export async function POST(req: NextRequest): Promise<NextResponse> {
  let sql: string;
  try {
    sql = bodySchema.parse(await req.json()).sql;
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Invalid body" },
      { status: 400 }
    );
  }

  // Read-only guard — strip comments, require SELECT/WITH.
  const stripped = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
  if (!/^(select|with)\b/i.test(stripped)) {
    return NextResponse.json(
      { ok: false, error: "Read-only: only SELECT / WITH queries are allowed." },
      { status: 400 }
    );
  }

  try {
    const result = await executeSQL(sql);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 }
    );
  }
}
