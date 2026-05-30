/**
 * Quartermaster — Anthropic client singleton.
 *
 * Lazy-inits one `Anthropic` instance using `ANTHROPIC_API_KEY`. In
 * fixture mode the orchestrator should avoid calling `getClaude()` at
 * all — but if it does, we throw a clear error so the failure is loud.
 */

import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-6";

let cached: Anthropic | null = null;

/** Returns true when fixtures mode is on. */
export function isFixtureMode(): boolean {
  return process.env.QM_FIXTURES === "on";
}

/**
 * Lazy-initialize and return the shared Anthropic client.
 * Throws if `ANTHROPIC_API_KEY` is missing.
 */
export function getClaude(): Anthropic {
  if (cached) {
    return cached;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length === 0) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Set it in .env.local or enable QM_FIXTURES=on.",
    );
  }

  cached = new Anthropic({ apiKey });
  return cached;
}
