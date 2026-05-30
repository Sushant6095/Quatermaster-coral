/**
 * POST /api/copilot/ask
 *
 * Body: { question: string }
 * Streams: text/event-stream with events compile | validate | execute | narrate | done | error.
 */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { isFixtureMode } from "@/lib/claude/client";
import { narrateFindings } from "@/lib/claude/copilot";
import { compileSQLWithRetry, validateSQL } from "@/lib/claude/sqlValidator";
import { computeCostCents, estimateTokens, type TokenUsage } from "@/lib/claude/cost";
import { executeSQL, getSchemaCatalog } from "@/lib/coral/client";
import { fixtureCoralForQuestion } from "@/lib/fixtures/coral";

/** System-prompt scaffolding (instructions wrapped around the catalog) — for the fixture token estimate only. */
const SYSTEM_OVERHEAD_TOKENS = 220;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({ question: z.string().min(2).max(2000) });

function sseFrame(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function pickFixtureSql(): string {
  return `-- fixture (no Anthropic key)
SELECT t.work_email, gh.login AS github_handle
FROM deel.directory t
LEFT JOIN github.members gh ON LOWER(gh.email) = LOWER(t.work_email)
WHERE t.is_active = false AND gh.login IS NOT NULL;`;
}

export async function POST(req: NextRequest): Promise<Response> {
  let question: string;
  try {
    const json = await req.json();
    question = bodySchema.parse(json).question;
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Invalid body" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const fixtures = isFixtureMode() || !process.env.ANTHROPIC_API_KEY;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: unknown): void => {
        controller.enqueue(encoder.encode(sseFrame(payload)));
      };

      try {
        // 1. Compile (or use fixture SQL). The catalog is also used to size
        //    the fixture-mode token estimate, so fetch it on both paths.
        const catalog = await getSchemaCatalog();
        let sql: string;
        let reasoning: string;
        let usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
        if (fixtures) {
          sql = pickFixtureSql();
          reasoning = "Fixture-mode fallback: joined Deel terminations to GitHub.";
        } else {
          const compiled = await compileSQLWithRetry(question, catalog);
          sql = compiled.sql;
          reasoning = compiled.reasoning;
          usage = compiled.usage;
        }
        send({ event: "compile", data: { sql, reasoning } });

        // 2. Validate (runs on every path, including fixtures).
        const verdict = validateSQL(sql);
        if (!verdict.ok) {
          send({ event: "error", data: { stage: "validate", message: verdict.error } });
          controller.close();
          return;
        }
        send({ event: "validate", data: { ok: true } });

        // 3. Execute.
        const result = fixtures
          ? fixtureCoralForQuestion(question)
          : await executeSQL(sql);

        // Pre-compute the narration in fixture mode so the token estimate can
        // account for output tokens (no real Claude call happens in fixtures).
        const fixtureNarration = {
          summary: `Found ${result.rows.length} potential issues across ${result.sourcesUsed.join(", ")}.`,
          perRowRationales: result.rows.map((_, i) => `Row ${i + 1}: cross-source signal detected.`),
        };
        if (fixtures) {
          const inputTokens =
            estimateTokens(catalog) + estimateTokens(question) + SYSTEM_OVERHEAD_TOKENS;
          const outputTokens =
            estimateTokens(sql) +
            estimateTokens(reasoning) +
            estimateTokens(fixtureNarration.summary) +
            estimateTokens(fixtureNarration.perRowRationales.join(" "));
          usage = { inputTokens, outputTokens };
        }

        send({
          event: "execute",
          data: {
            rows: result.rows,
            meta: {
              sourcesUsed: result.sourcesUsed,
              rowsScanned: result.rowsScanned,
              tokensIn: usage.inputTokens,
              tokensOut: usage.outputTokens,
              costCents: computeCostCents(usage),
              durationMs: result.durationMs,
            },
          },
        });

        // 4. Narrate.
        if (fixtures) {
          send({ event: "narrate", data: fixtureNarration });
        } else {
          const narrated = await narrateFindings(result.rows, "Copilot query");
          send({
            event: "narrate",
            data: { summary: narrated.summary, perRowRationales: narrated.perRowRationales },
          });
        }

        send({ event: "done", data: { ok: true } });
      } catch (err: unknown) {
        send({
          event: "error",
          data: { message: err instanceof Error ? err.message : "Unknown error" },
        });
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
