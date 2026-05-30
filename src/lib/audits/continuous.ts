/**
 * Quartermaster — Continuous Mode engine (server-side).
 *
 * Runs QM-01 on a configurable interval, diffs against a cache of
 * previously seen findings, and emits new findings via a Node EventEmitter.
 *
 * Consumers (API routes) attach listeners and forward events over SSE.
 *
 * Usage:
 *   import { getContinuousEmitter, startContinuousLoop } from "@/lib/audits/continuous";
 *   const emitter = getContinuousEmitter();
 *   emitter.on("finding", (evt: ContinuousEvent) => { ... });
 *   startContinuousLoop(); // idempotent — safe to call multiple times
 */

import { EventEmitter } from "node:events";
import type { Finding } from "@/lib/types";
import { runAudit } from "@/lib/audits/runner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContinuousEvent = {
  event: "finding";
  data: Finding;
};

// ---------------------------------------------------------------------------
// Module-level singletons
// ---------------------------------------------------------------------------

const emitter = new EventEmitter();
emitter.setMaxListeners(50); // many SSE connections may attach simultaneously

/** Cache keyed by targetEmail ?? targetName */
const cache = new Map<string, Finding>();

let loopStarted = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function intervalMs(): number {
  const seconds = Number.parseInt(
    process.env.QM_CONTINUOUS_INTERVAL ?? "30",
    10
  );
  return Math.max(1, Number.isFinite(seconds) ? seconds : 30) * 1_000;
}

function cacheKey(f: Finding): string {
  return f.targetEmail ?? f.targetName;
}

/** Drain an async iterator of RunnerEvents and collect Finding rows. */
async function collectFindings(): Promise<Finding[]> {
  const findings: Finding[] = [];
  try {
    for await (const evt of runAudit("QM-01")) {
      if (evt.event === "row") {
        findings.push(evt.data);
      }
    }
  } catch {
    // Coral unreachable or fixture mode — runner already falls back internally;
    // an empty array is a safe graceful result.
  }
  return findings;
}

/** Run one tick: collect findings, diff vs. cache, emit new ones. */
async function tick(): Promise<void> {
  const findings = await collectFindings();

  for (const f of findings) {
    const key = cacheKey(f);
    if (!cache.has(key)) {
      cache.set(key, f);
      const evt: ContinuousEvent = { event: "finding", data: f };
      emitter.emit("finding", evt);
    }
  }

  // Refresh existing cache entries so resolvedIso / snoozedUntilIso stay fresh.
  for (const f of findings) {
    cache.set(cacheKey(f), f);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the shared EventEmitter.
 * Attach a `"finding"` listener to receive `ContinuousEvent` payloads.
 */
export function getContinuousEmitter(): EventEmitter {
  return emitter;
}

/**
 * Starts the continuous audit loop. Idempotent — subsequent calls are no-ops.
 *
 * - Runs an initial tick immediately so the first SSE connection isn't empty.
 * - Schedules subsequent ticks at `QM_CONTINUOUS_INTERVAL` seconds (default 30).
 */
export function startContinuousLoop(): void {
  if (loopStarted) return;
  loopStarted = true;

  const ms = intervalMs();

  // Fire immediately, then on every interval.
  void tick();
  setInterval(() => void tick(), ms);
}
