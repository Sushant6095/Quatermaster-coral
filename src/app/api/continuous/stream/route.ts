/**
 * GET /api/continuous/stream
 *
 * Server-sent events. Emits a fake "new finding" event every
 * `QM_CONTINUOUS_INTERVAL` seconds (default 30). The Cockpit's
 * LiveFeed consumes this stream.
 *
 * Connection is closed when the client aborts.
 */

import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import type { AuditId, Finding, Severity } from "@/lib/types";
import { fixtureFindingsForAudit } from "@/lib/fixtures/coral";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sseFrame(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

const AUDIT_ROTATION: AuditId[] = ["QM-01", "QM-03", "QM-04", "QM-02", "QM-05"];
const SEVERITIES: Severity[] = ["P0", "P1", "P2"];

function pickFinding(tick: number): Finding {
  const auditId = AUDIT_ROTATION[tick % AUDIT_ROTATION.length];
  const pool = fixtureFindingsForAudit(auditId);
  const base = pool[tick % pool.length];
  return {
    ...base,
    id: `FND-${randomUUID().slice(0, 8).toUpperCase()}`,
    severity: SEVERITIES[tick % SEVERITIES.length],
    detectedIso: new Date().toISOString(),
  };
}

function intervalMs(): number {
  const seconds = Number.parseInt(process.env.QM_CONTINUOUS_INTERVAL ?? "30", 10);
  return Math.max(1, Number.isFinite(seconds) ? seconds : 30) * 1000;
}

export async function GET(req: NextRequest): Promise<Response> {
  const tickMs = intervalMs();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let tick = 0;
      let closed = false;

      const enqueueFinding = (): void => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sseFrame({ event: "finding", data: pickFinding(tick) })));
          tick += 1;
        } catch {
          closed = true;
        }
      };

      // Initial finding so the UI doesn't sit empty.
      enqueueFinding();

      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
        } catch {
          closed = true;
        }
      }, 15_000);

      const ticker = setInterval(enqueueFinding, tickMs);

      const cleanup = (): void => {
        if (closed) return;
        closed = true;
        clearInterval(ticker);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      req.signal.addEventListener("abort", cleanup);
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
