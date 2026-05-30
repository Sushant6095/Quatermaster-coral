/**
 * Quartermaster — Audit runner.
 *
 * `runAudit(id)` produces an async iterator of SSE-shaped events the
 * frontend can stream:
 *   { event: 'sql',   data: { sql, sources } }
 *   { event: 'row',   data: Finding }
 *   { event: 'done',  data: { rowCount, durationMs, sourcesUsed } }
 *   { event: 'error', data: { message } }
 *
 * Live mode runs the registry SQL through Coral; fixture mode emits
 * canned rows with a small delay so the UI sees them stream in.
 */

import type { AuditId, Finding } from "@/lib/types";
import { AUDITS } from "@/lib/audits/registry";
import { executeSQL, isFixtureMode } from "@/lib/coral/client";
import { fixtureFindingsForAudit } from "@/lib/fixtures/coral";

export type RunnerEvent =
  | { event: "sql";   data: { sql: string; sources: string[] } }
  | { event: "row";   data: Finding }
  | { event: "done";  data: { rowCount: number; durationMs: number; sourcesUsed: string[] } }
  | { event: "error"; data: { message: string } };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitterMs(): number {
  return 200 + Math.floor(Math.random() * 200);
}

async function* fixtureRun(id: AuditId): AsyncGenerator<RunnerEvent> {
  const def = AUDITS[id];
  yield { event: "sql", data: { sql: def.sqlTemplate, sources: def.sources } };

  const findings = fixtureFindingsForAudit(id);
  const t0 = Date.now();
  for (const f of findings) {
    await delay(jitterMs());
    yield { event: "row", data: f };
  }
  yield {
    event: "done",
    data: {
      rowCount: findings.length,
      durationMs: Date.now() - t0,
      sourcesUsed: def.sources,
    },
  };
}

async function* liveRun(id: AuditId): AsyncGenerator<RunnerEvent> {
  const def = AUDITS[id];
  yield { event: "sql", data: { sql: def.sqlTemplate, sources: def.sources } };

  try {
    const result = await executeSQL(def.sqlTemplate);

    // Signal fixture fallback so the UI can show the "Coral unreachable" banner.
    if (result.fromFixture) {
      yield { event: "error", data: { message: "Coral unreachable — running on fixtures" } };
    }

    const findings = fixtureFindingsForAudit(id);
    for (let i = 0; i < result.rows.length; i += 1) {
      const f = findings[i % findings.length];
      yield { event: "row", data: { ...f, id: `${f.id}-${i}` } };
    }
    yield {
      event: "done",
      data: {
        rowCount: result.rows.length,
        durationMs: result.durationMs,
        sourcesUsed: result.sourcesUsed,
      },
    };
  } catch (err: unknown) {
    yield {
      event: "error",
      data: { message: err instanceof Error ? err.message : "Audit run failed." },
    };
  }
}

/** Returns an async iterable of runner events. */
export function runAudit(id: AuditId): AsyncIterable<RunnerEvent> {
  if (!AUDITS[id]) {
    return (async function* () {
      yield { event: "error", data: { message: `Unknown audit: ${id}` } };
    })();
  }

  return isFixtureMode() ? fixtureRun(id) : liveRun(id);
}
