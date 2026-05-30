/**
 * Quartermaster — Copilot wrappers around Claude Sonnet 4.6.
 *
 * Two pure async functions used by the orchestrator:
 *  - `compileSQL` — natural language question -> federated Coral SQL.
 *  - `narrateFindings` — SQL result rows -> short human summary + per-row
 *    rationale strings the UI can render under each finding.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getClaude, MODEL } from "./client";
import { EMPTY_USAGE, usageFromResponse, type TokenUsage } from "./cost";

type MessageParam = Anthropic.MessageParam;
type ContentBlock = Anthropic.ContentBlock;

export interface CompileSQLResult {
  sql: string;
  reasoning: string;
  /** Token usage for this compile call (one attempt). */
  usage: TokenUsage;
}

export interface NarrateResult {
  summary: string;
  perRowRationales: string[];
  /** Token usage for this narration call. */
  usage: TokenUsage;
}

/** System prompt for SQL authoring grounded in the Coral schema catalog. */
function copilotSystemPrompt(schemaCatalog: string): string {
  return `You are Quartermaster Copilot, an expert federated-SQL author.

You answer enterprise-security and SaaS-spend questions by writing a
SINGLE SELECT query against Coral's federated catalog. The catalog
follows the convention <source>.<table> with nested fields flattened
using double underscores (e.g. assignee__email).

Allowed sources: deel, okta, github, slack, stripe, linear.

Hard rules:
- Read-only. SELECT/WITH only. Never DROP/DELETE/INSERT/UPDATE/ALTER/CREATE/TRUNCATE/GRANT.
- Prefer CTEs (WITH ...) for readability.
- LOWER() both sides of email joins; tolerate case drift.
- Return strict output in exactly this format and nothing else:

<sql>
... your single SQL statement ...
</sql>
<reasoning>One short sentence explaining the join strategy.</reasoning>

Catalog:
${schemaCatalog}`;
}

function extractTag(text: string, tag: string): string {
  const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function joinTextBlocks(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();
}

/**
 * Compile a natural-language question into federated Coral SQL.
 * Pure: only side effect is the Anthropic call.
 */
export async function compileSQL(
  question: string,
  schemaCatalog: string,
  extraTurns: MessageParam[] = [],
): Promise<CompileSQLResult> {
  const client = getClaude();
  const messages: MessageParam[] = [
    { role: "user", content: question },
    ...extraTurns,
  ];

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: copilotSystemPrompt(schemaCatalog),
    messages,
  });

  const text = joinTextBlocks(resp.content);
  const sql = extractTag(text, "sql");
  const reasoning = extractTag(text, "reasoning") || "Joined sources by lowercased email.";

  if (sql.length === 0) {
    throw new Error("Copilot returned no <sql> block.");
  }

  return { sql, reasoning, usage: usageFromResponse(resp.usage) };
}

/**
 * Summarize a finding set and produce per-row rationale strings.
 * Pure: only side effect is the Anthropic call.
 */
export async function narrateFindings(
  sqlResults: Array<Record<string, unknown>>,
  auditName: string,
): Promise<NarrateResult> {
  if (sqlResults.length === 0) {
    return { summary: `No findings for ${auditName}.`, perRowRationales: [], usage: EMPTY_USAGE };
  }

  const client = getClaude();
  const sample = sqlResults.slice(0, 25);

  const system = `You are Quartermaster's finding narrator. Given a small
JSON array of SQL result rows for a named audit, produce:

1. A two-sentence executive summary.
2. One concise rationale per row (<= 18 words), in input order.

Output strict JSON, no prose, in this shape:
{"summary":"...","perRowRationales":["...","..."]}`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system,
    messages: [
      {
        role: "user",
        content: `Audit: ${auditName}\nRows:\n${JSON.stringify(sample, null, 2)}`,
      },
    ],
  });

  const usage = usageFromResponse(resp.usage);
  const text = joinTextBlocks(resp.content);
  try {
    const parsed = JSON.parse(text) as NarrateResult;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      perRowRationales: Array.isArray(parsed.perRowRationales)
        ? parsed.perRowRationales.map((r) => String(r))
        : [],
      usage,
    };
  } catch {
    // Best-effort fallback: stuff the raw text into summary.
    return { summary: text.slice(0, 400), perRowRationales: [], usage };
  }
}
