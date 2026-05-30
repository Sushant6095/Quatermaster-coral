/**
 * Quartermaster — SQL validator + retrying SQL compiler.
 *
 * The validator is a lightweight allow/deny check, not a real parser:
 *  - Rejects mutating verbs.
 *  - Rejects unknown schema prefixes.
 *
 * `compileSQLWithRetry` wraps Copilot's `compileSQL` in a retry loop.
 * If validation fails, the validator's error is fed back as a user turn
 * and Claude is asked to fix it — up to 3 attempts.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { compileSQL, type CompileSQLResult } from "./copilot";
import { addUsage, EMPTY_USAGE } from "./cost";

type MessageParam = Anthropic.MessageParam;

const FORBIDDEN_KEYWORDS = [
  "DROP",
  "DELETE",
  "INSERT",
  "UPDATE",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "REPLACE",
  "MERGE",
] as const;

const ALLOWED_SCHEMAS = new Set<string>([
  "deel",
  "okta",
  "github",
  "slack",
  "stripe",
  "linear",
  "coral",
  "local",
]);

export type ValidationResult = { ok: true } | { ok: false; error: string };

/**
 * Strip SQL comments and string literals so the keyword/schema scan
 * doesn't trip on words inside quoted strings.
 */
function strippedForScan(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/"(?:""|[^"])*"/g, '""');
}

/** Validate a candidate SQL string. */
export function validateSQL(sql: string): ValidationResult {
  const trimmed = sql.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Empty SQL." };
  }

  const scan = strippedForScan(trimmed).toUpperCase();

  for (const kw of FORBIDDEN_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`);
    if (re.test(scan)) {
      return { ok: false, error: `Forbidden keyword: ${kw}.` };
    }
  }

  // First non-comment statement must start with SELECT or WITH.
  if (!/^\s*(SELECT|WITH)\b/i.test(strippedForScan(trimmed))) {
    return { ok: false, error: "SQL must start with SELECT or WITH." };
  }

  // Extract <schema>.<table> references and verify each schema is allowed.
  const refs = strippedForScan(trimmed).match(/\b([a-z_][a-z0-9_]*)\.[a-z_][a-z0-9_]*/gi) ?? [];
  for (const ref of refs) {
    const schema = ref.split(".")[0]?.toLowerCase();
    if (!schema) continue;
    if (!ALLOWED_SCHEMAS.has(schema)) {
      return {
        ok: false,
        error: `Unknown schema: ${schema}. Allowed: ${[...ALLOWED_SCHEMAS].join(", ")}.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Compile SQL with up to `maxAttempts` retries. On each validation
 * failure, the validator's error is appended as a user turn so the
 * model can correct itself.
 */
export async function compileSQLWithRetry(
  question: string,
  schemaCatalog: string,
  maxAttempts = 3,
): Promise<CompileSQLResult> {
  const extra: MessageParam[] = [];
  let lastError = "Unknown validation error.";
  // Accumulate token usage across every attempt — retries cost tokens too.
  let totalUsage = EMPTY_USAGE;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const candidate = await compileSQL(question, schemaCatalog, extra);
    totalUsage = addUsage(totalUsage, candidate.usage);
    const verdict = validateSQL(candidate.sql);

    if (verdict.ok) {
      return { sql: candidate.sql, reasoning: candidate.reasoning, usage: totalUsage };
    }

    lastError = verdict.error;
    extra.push(
      { role: "assistant", content: `<sql>${candidate.sql}</sql>\n<reasoning>${candidate.reasoning}</reasoning>` },
      {
        role: "user",
        content: `The previous SQL failed validation: ${verdict.error}\nRewrite it. Return only <sql>...</sql><reasoning>...</reasoning>.`,
      },
    );
  }

  throw new Error(`compileSQL failed validation after ${maxAttempts} attempts: ${lastError}`);
}
