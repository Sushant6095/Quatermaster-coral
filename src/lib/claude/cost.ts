/**
 * Quartermaster — Claude token-usage accounting.
 *
 * Single source of truth for how the Copilot reports tokens and cost in the
 * "This thread" right rail. Pricing assumes Claude Sonnet 4.6:
 *   input  $3 / 1M tokens
 *   output $15 / 1M tokens
 *
 * In fixture mode we never call Claude, so `estimateTokens` produces a
 * deterministic, plausible count from real text lengths (~4 chars/token) —
 * the same way the rest of the fixtures simulate latency and row counts.
 */

export const SONNET_INPUT_USD_PER_MTOK = 3;
export const SONNET_OUTPUT_USD_PER_MTOK = 15;

/** Approximate characters per token for the fixture-mode estimate. */
const CHARS_PER_TOKEN = 4;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export const EMPTY_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0 };

/** Sum two usage records into a new record (immutable). */
export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
  };
}

/**
 * Cost in cents for a usage record, rounded to 3 decimal places of a cent.
 */
export function computeCostCents(usage: TokenUsage): number {
  const dollars =
    (usage.inputTokens / 1_000_000) * SONNET_INPUT_USD_PER_MTOK +
    (usage.outputTokens / 1_000_000) * SONNET_OUTPUT_USD_PER_MTOK;
  const cents = dollars * 100;
  return Math.round(cents * 1000) / 1000;
}

/**
 * Normalize the Anthropic SDK's `usage` block (snake_case, possibly partial)
 * into our `TokenUsage` shape.
 */
export function usageFromResponse(
  usage: { input_tokens?: number; output_tokens?: number } | null | undefined,
): TokenUsage {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
  };
}

/** Rough token count for fixture mode (no real Claude call to measure). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
