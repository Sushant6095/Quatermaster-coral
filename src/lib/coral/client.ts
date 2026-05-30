/**
 * Quartermaster — Coral MCP client wrapper.
 *
 * Singleton stdio MCP client — spawned once, reused across requests,
 * reconnected automatically on error. Falls back to fixtures when
 * QM_FIXTURES=on or CORAL_CONFIG_DIR is unset.
 */

import type { AuditId, SourceKey } from "@/lib/types";
import { AUDITS } from "@/lib/audits/registry";
import {
  fixtureCoralForAudit,
  fixtureCoralForQuestion,
  type CoralFixtureResult,
} from "@/lib/fixtures/coral";
import { SCHEMA_CATALOG } from "./schemaCatalog";

export interface CoralExecuteResult {
  rows: Array<Record<string, unknown>>;
  durationMs: number;
  sourcesUsed: SourceKey[];
  rowsScanned: number;
  /** True when we fell back to canned data because Coral was unreachable. */
  fromFixture?: boolean;
}

export function isFixtureMode(): boolean {
  if (process.env.QM_FIXTURES === "on") return true;
  return !process.env.CORAL_CONFIG_DIR;
}

function fixtureForSQL(sql: string): CoralFixtureResult {
  const m = sql.match(/QM-0(\d)/);
  if (m) {
    const id = `QM-0${m[1]}` as AuditId;
    if (AUDITS[id]) return fixtureCoralForAudit(id);
  }
  return fixtureCoralForQuestion(sql);
}

// ---------------------------------------------------------------------------
// Module-level singleton — one Coral MCP process for the lifetime of the
// Next.js server worker. Reconnected on any error.
// ---------------------------------------------------------------------------

interface CoralClient {
  callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
  close(): Promise<void>;
}

let _client: CoralClient | null = null;
let _connecting = false;

async function getClient(): Promise<CoralClient> {
  if (_client) return _client;
  if (_connecting) {
    // Wait briefly then try again (poor-man's mutex for cold-start races).
    await new Promise((r) => setTimeout(r, 200));
    if (_client) return _client;
  }

  _connecting = true;
  try {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StdioClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/stdio.js"
    );

    const transport = new StdioClientTransport({
      command: "coral",
      args: ["mcp", "serve"],
      env: {
        ...(process.env as Record<string, string>),
        CORAL_CONFIG_DIR: process.env.CORAL_CONFIG_DIR ?? ".coral-workspace",
      },
    });

    const client = new Client(
      { name: "quartermaster", version: "0.1.0" },
      { capabilities: {} },
    );
    await client.connect(transport);

    // Wrap so we can null out the singleton on any error.
    const wrapped: CoralClient = {
      async callTool(name, args) {
        return client.callTool({ name, arguments: args });
      },
      async close() {
        _client = null;
        await client.close().catch(() => undefined);
      },
    };

    _client = wrapped;
    return wrapped;
  } finally {
    _connecting = false;
  }
}

function invalidateClient(): void {
  _client = null;
}

/** Execute a SQL string against Coral. Falls back to fixtures on any error. */
export async function executeSQL(sql: string): Promise<CoralExecuteResult> {
  if (isFixtureMode()) {
    const result = fixtureForSQL(sql);
    await new Promise((r) => setTimeout(r, 120));
    return { ...result, fromFixture: false };
  }

  try {
    const client = await getClient();
    const t0 = Date.now();

    const callResult = await Promise.race([
      client.callTool("query", { sql }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Coral query timed out")), 5_000)
      ),
    ]);

    const durationMs = Date.now() - t0;
    const content = (callResult as { content?: Array<{ type: string; text?: string }> }).content;
    const text = content?.[0]?.text ?? "[]";
    const rows = JSON.parse(text) as Array<Record<string, unknown>>;

    return { rows, durationMs, sourcesUsed: detectSources(sql), rowsScanned: rows.length };
  } catch {
    invalidateClient();
    const result = fixtureForSQL(sql);
    await new Promise((r) => setTimeout(r, 120));
    return { ...result, fromFixture: true };
  }
}

function detectSources(sql: string): SourceKey[] {
  const candidates: SourceKey[] = ["deel", "okta", "github", "slack", "stripe", "linear"];
  return candidates.filter((s) => new RegExp(`\\b${s}\\.`, "i").test(sql));
}

export async function getSchemaCatalog(): Promise<string> {
  return SCHEMA_CATALOG;
}
