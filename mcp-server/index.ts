#!/usr/bin/env tsx
/**
 * Quartermaster MCP server.
 *
 * Exposes three tools over stdio:
 *   - run_audit          run one of QM-01..QM-05 and return a summary.
 *   - get_findings       fetch findings, filtered by audit + severity.
 *   - draft_remediation  generate a drafted message for a finding.
 *
 * Register from Claude Code:
 *
 *   claude mcp add quartermaster -- npx tsx \
 *     /absolute/path/to/quartermaster/mcp-server/index.ts
 *
 * The orchestrator (Agent C) exposes the real implementations. This server is
 * a thin façade — when running standalone for the demo it falls back to a
 * deterministic mock layer so the MCP kicker works even without the full
 * Quartermaster stack running.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Bridge to the orchestrator. In production this imports Agent C's runAudit
// + getFindings + draftRemediation. When the orchestrator is not on the
// PATH (or fixtures mode is on), we fall back to the inline mocks below.
// ---------------------------------------------------------------------------

type AuditId = "QM-01" | "QM-02" | "QM-03" | "QM-04" | "QM-05";

interface Finding {
  id: string;
  severity: "P0" | "P1" | "P2";
  targetName: string;
  rationale: string;
  detectedIso: string;
}

interface AuditSummary {
  findings: number;
  summary: string;
  sourceCount: number;
}

interface OrchestratorBridge {
  runAudit(auditId: AuditId): Promise<AuditSummary>;
  getFindings(opts: {
    auditId?: AuditId;
    severity?: "P0" | "P1" | "P2";
    limit: number;
  }): Promise<Finding[]>;
  draftRemediation(opts: {
    findingId: string;
    channel: "slack-dm" | "jira" | "checklist";
  }): Promise<string>;
}

async function loadBridge(): Promise<OrchestratorBridge> {
  try {
    // Optional: when the orchestrator is in the same workspace, this resolves.
    // The bridge module is owned by Agent C; we tolerate its absence. The
    // specifier is kept non-literal so the optional module isn't a compile-time
    // dependency — at runtime a missing module rejects and we fall back to mock.
    const bridgeSpecifier = "./bridge.js";
    const mod = (await import(bridgeSpecifier).catch(() => null)) as
      | OrchestratorBridge
      | null;
    if (mod && typeof mod.runAudit === "function") return mod;
  } catch {
    // fall through to mock
  }
  return mockBridge;
}

// ---------------------------------------------------------------------------
// Deterministic mock bridge — used when running this server standalone.
// Numbers chosen to match the demo script so the MCP kicker tells the same
// story as the UI.
// ---------------------------------------------------------------------------

const MOCK_FINDINGS: Record<AuditId, Finding[]> = {
  "QM-01": [
    {
      id: "F-QM01-0001",
      severity: "P0",
      targetName: "Mark Reyes",
      rationale:
        "Terminated in Deel 14 days ago. Still holds GitHub admin on 3 repos. Last commit 6 days ago.",
      detectedIso: "2026-05-30T10:14:22Z",
    },
    {
      id: "F-QM01-0002",
      severity: "P0",
      targetName: "Priya Shah",
      rationale:
        "Contract ended in Deel 9 days ago. Okta session refreshed today. Slack workspace owner.",
      detectedIso: "2026-05-30T10:14:23Z",
    },
    {
      id: "F-QM01-0003",
      severity: "P0",
      targetName: "Daniel Okafor",
      rationale:
        "Terminated 21 days ago. AWS production access via GitHub OIDC still live.",
      detectedIso: "2026-05-30T10:14:24Z",
    },
    {
      id: "F-QM01-0004",
      severity: "P1",
      targetName: "Lena Vargas",
      rationale:
        "Inactive 45 days; no offboarding ticket. Holds 2 GitHub seats.",
      detectedIso: "2026-05-30T10:14:25Z",
    },
  ],
  "QM-02": [
    {
      id: "F-QM02-0001",
      severity: "P1",
      targetName: "A. Patel",
      rationale:
        "GitHub admin unused 127 days. Least-privilege violation.",
      detectedIso: "2026-05-30T10:14:30Z",
    },
  ],
  "QM-03": [
    {
      id: "F-QM03-0001",
      severity: "P2",
      targetName: "Linear seat × 4",
      rationale: "Four paid Linear seats with zero activity in 30 days. $96/mo.",
      detectedIso: "2026-05-30T10:14:35Z",
    },
  ],
  "QM-04": [
    {
      id: "F-QM04-0001",
      severity: "P1",
      targetName: "stripe.charge ch_3OuX...",
      rationale:
        "Off-list vendor 'midjourney.com' charged 4× this month. Mentioned in #design 3 times.",
      detectedIso: "2026-05-30T10:14:40Z",
    },
  ],
  "QM-05": [
    {
      id: "F-QM05-0001",
      severity: "P2",
      targetName: "SOC2 evidence pack: Mark Reyes",
      rationale:
        "All 5 platforms deprovisioned. Hashes recorded. PDF ready.",
      detectedIso: "2026-05-30T10:14:45Z",
    },
  ],
};

const AUDIT_SOURCE_COUNT: Record<AuditId, number> = {
  "QM-01": 4,
  "QM-02": 4,
  "QM-03": 4,
  "QM-04": 3,
  "QM-05": 5,
};

const AUDIT_NAME: Record<AuditId, string> = {
  "QM-01": "Zombie Account Hunter",
  "QM-02": "Permission Drift",
  "QM-03": "Ghost-Seat Spend",
  "QM-04": "Shadow-IT Detector",
  "QM-05": "Compliance Ledger",
};

const mockBridge: OrchestratorBridge = {
  async runAudit(auditId) {
    const findings = MOCK_FINDINGS[auditId] ?? [];
    return {
      findings: findings.length,
      summary: `${AUDIT_NAME[auditId]} completed. ${findings.length} finding${
        findings.length === 1 ? "" : "s"
      } across ${AUDIT_SOURCE_COUNT[auditId]} sources.`,
      sourceCount: AUDIT_SOURCE_COUNT[auditId],
    };
  },
  async getFindings({ auditId, severity, limit }) {
    const pool = auditId
      ? MOCK_FINDINGS[auditId] ?? []
      : (Object.values(MOCK_FINDINGS).flat() as Finding[]);
    const filtered = severity ? pool.filter((f) => f.severity === severity) : pool;
    return filtered.slice(0, limit);
  },
  async draftRemediation({ findingId, channel }) {
    const all = Object.values(MOCK_FINDINGS).flat() as Finding[];
    const finding = all.find((f) => f.id === findingId);
    const target = finding?.targetName ?? findingId;
    const why = finding?.rationale ?? "details pending";

    switch (channel) {
      case "slack-dm":
        return [
          `Hey — Quartermaster flagged a ${finding?.severity ?? "P1"} on ${target}.`,
          ``,
          `Reason: ${why}`,
          ``,
          `If this is intentional, react with ✅ within 24h. Otherwise I'll`,
          `open an offboarding ticket and revoke the GitHub + Okta seats.`,
        ].join("\n");
      case "jira":
        return [
          `Title: [QM ${finding?.severity ?? "P1"}] Revoke access — ${target}`,
          ``,
          `Quartermaster finding ${findingId}.`,
          ``,
          `Evidence: ${why}`,
          ``,
          `Action items:`,
          `  - [ ] Disable Okta user`,
          `  - [ ] Remove GitHub org membership and any admin roles`,
          `  - [ ] Deactivate Slack account`,
          `  - [ ] Cancel paid seats in Stripe`,
          `  - [ ] Attach evidence pack to compliance ledger`,
        ].join("\n");
      case "checklist":
        return [
          `Offboarding checklist for ${target} (${findingId}):`,
          `[ ] Okta — disable + revoke sessions`,
          `[ ] GitHub — remove admin, remove org`,
          `[ ] Slack — deactivate`,
          `[ ] Stripe — cancel any seats tied to this email`,
          `[ ] Deel — mark deprovisioning complete`,
          `[ ] Ledger — attach evidence hashes`,
        ].join("\n");
    }
  },
};

// ---------------------------------------------------------------------------
// Tool schemas
// ---------------------------------------------------------------------------

const AuditIdSchema = z.enum(["QM-01", "QM-02", "QM-03", "QM-04", "QM-05"]);
const SeveritySchema = z.enum(["P0", "P1", "P2"]);
const ChannelSchema = z.enum(["slack-dm", "jira", "checklist"]);

const RunAuditInput = z.object({
  auditId: AuditIdSchema.describe("Quartermaster audit identifier."),
});

const GetFindingsInput = z.object({
  auditId: AuditIdSchema.optional().describe(
    "Optional. Restrict findings to one audit."
  ),
  severity: SeveritySchema.optional().describe(
    "Optional. P0 = critical, P1 = warning, P2 = info."
  ),
  limit: z.number().int().positive().max(200).default(25),
});

const DraftRemediationInput = z.object({
  findingId: z.string().min(1).describe("Finding identifier (e.g. F-QM01-0001)."),
  channel: ChannelSchema.describe(
    "Where the remediation will be sent. Affects tone and format."
  ),
});

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

async function main() {
  const bridge = await loadBridge();

  const server = new Server(
    {
      name: "quartermaster",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "run_audit",
        description:
          "Run one of Quartermaster's named audits (QM-01..QM-05) against the connected Coral sources. Returns a one-line summary plus a finding count. Read-only.",
        inputSchema: {
          type: "object",
          properties: {
            auditId: {
              type: "string",
              enum: ["QM-01", "QM-02", "QM-03", "QM-04", "QM-05"],
              description:
                "QM-01 Zombie Account Hunter, QM-02 Permission Drift, QM-03 Ghost-Seat Spend, QM-04 Shadow-IT Detector, QM-05 Compliance Ledger.",
            },
          },
          required: ["auditId"],
        },
      },
      {
        name: "get_findings",
        description:
          "Fetch findings from the most recent audit runs. Filter by audit id or severity. Default limit 25.",
        inputSchema: {
          type: "object",
          properties: {
            auditId: {
              type: "string",
              enum: ["QM-01", "QM-02", "QM-03", "QM-04", "QM-05"],
            },
            severity: {
              type: "string",
              enum: ["P0", "P1", "P2"],
            },
            limit: {
              type: "number",
              minimum: 1,
              maximum: 200,
              default: 25,
            },
          },
        },
      },
      {
        name: "draft_remediation",
        description:
          "Generate a drafted remediation message for one finding. Tone and format adapt to the target channel. Never sends — humans approve.",
        inputSchema: {
          type: "object",
          properties: {
            findingId: { type: "string" },
            channel: {
              type: "string",
              enum: ["slack-dm", "jira", "checklist"],
            },
          },
          required: ["findingId", "channel"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "run_audit") {
        const input = RunAuditInput.parse(args);
        const result = await bridge.runAudit(input.auditId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      if (name === "get_findings") {
        const input = GetFindingsInput.parse(args);
        const result = await bridge.getFindings(input);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      if (name === "draft_remediation") {
        const input = DraftRemediationInput.parse(args);
        const draft = await bridge.draftRemediation(input);
        return {
          content: [{ type: "text", text: draft }],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `Quartermaster MCP error: ${message}` }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr only — stdout is reserved for the MCP wire protocol.
  console.error("[quartermaster-mcp] ready on stdio");
}

main().catch((err) => {
  console.error("[quartermaster-mcp] fatal:", err);
  process.exit(1);
});
