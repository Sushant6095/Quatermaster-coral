/**
 * POST /api/audits/run
 *
 * Body: { auditId: AuditId }
 * Returns: text/event-stream of runner events.
 */

import type { NextRequest } from "next/server";
import { z } from "zod";
import type { AuditId } from "@/lib/types";
import { runAudit } from "@/lib/audits/runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  auditId: z.enum(["QM-01", "QM-02", "QM-03", "QM-04", "QM-05"]),
});

function sseFrame(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: NextRequest): Promise<Response> {
  let auditId: AuditId;
  try {
    const json = await req.json();
    auditId = bodySchema.parse(json).auditId;
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Invalid body" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const evt of runAudit(auditId)) {
          controller.enqueue(encoder.encode(sseFrame(evt)));
        }
      } catch (err: unknown) {
        controller.enqueue(
          encoder.encode(
            sseFrame({
              event: "error",
              data: { message: err instanceof Error ? err.message : "Unknown error" },
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
