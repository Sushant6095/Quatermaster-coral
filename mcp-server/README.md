# Quartermaster MCP server

Exposes Quartermaster as an [MCP](https://modelcontextprotocol.io) server. Any MCP-aware
client (Claude Code, Cursor, Goose, your own agent) can call Quartermaster's audits as
tools — no SQL, no UI, no HTTP API.

This is the **meta-MCP** moment from the demo: Quartermaster uses Coral over MCP to talk
to your SaaS, and *itself* speaks MCP back out. Coral is the query layer. Quartermaster
is what other agents build on top of it.

## Tools exposed

| Tool                | What it does                                                                |
| ------------------- | --------------------------------------------------------------------------- |
| `run_audit`         | Run QM-01 through QM-05 against the connected Coral sources.                |
| `get_findings`      | Fetch findings, filtered by audit id or severity. Default limit 25.         |
| `draft_remediation` | Generate a Slack DM / Jira ticket / checklist draft for one finding.        |

All tools are **read-only**. `draft_remediation` returns the draft as text; sending is
always the human's call.

## Installing

The server runs in-tree via the root `tsx` dev dependency. From the repo root:

```bash
pnpm install            # if you haven't already
pnpm run mcp-server     # smoke test — should print "ready on stdio"
```

Standalone install (separate node_modules) — only needed if you're running this server
outside the Quartermaster repo:

```bash
cd mcp-server
pnpm install
pnpm start
```

## Registering with Claude Code

```bash
claude mcp add quartermaster -- npx tsx /absolute/path/to/quartermaster/mcp-server/index.ts
```

Or with the bundled `package.json` script:

```bash
claude mcp add quartermaster -- pnpm --dir /absolute/path/to/quartermaster run mcp-server
```

Restart Claude Code. The `quartermaster` server should appear with three tools.

## Registering with Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "quartermaster": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/quartermaster/mcp-server/index.ts"]
    }
  }
}
```

## Example tool calls

From any MCP client, after registering the server:

```jsonc
// run_audit — run the zombie hunter
{ "tool": "run_audit", "input": { "auditId": "QM-01" } }
// → { "findings": 4, "summary": "Zombie Account Hunter completed. 4 findings across 4 sources.", "sourceCount": 4 }

// get_findings — pull all P0s across every audit
{ "tool": "get_findings", "input": { "severity": "P0", "limit": 10 } }

// draft_remediation — draft a Slack DM for one finding
{
  "tool": "draft_remediation",
  "input": { "findingId": "F-QM01-0001", "channel": "slack-dm" }
}
```

From Claude Code in conversation:

> *"check our SaaS compliance for offboarded contractors. If you find zombies, draft Jira tickets for the P0s."*

Claude Code will:
1. Call `run_audit` with `QM-01`.
2. Call `get_findings` filtered to `P0`.
3. Call `draft_remediation` per finding with `channel: "jira"`.
4. Return the drafts inline for human review.

## How it connects to the orchestrator

This server is a thin façade. The real work happens in the Quartermaster orchestrator
(see `src/lib/audits/`). On boot, the server tries to import `./bridge.js` — Agent C's
adapter onto the orchestrator's internal API. If that import fails (e.g. you're running
the MCP server standalone without the rest of the app), it falls back to a deterministic
mock layer so the demo still tells the right story.

This means you can ship the MCP server **before** the orchestrator is fully wired and the
tool calls still behave correctly end-to-end. When the orchestrator lands, the same MCP
contract starts returning live findings with zero changes on the client side.

## Protocol notes

- Transport: `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`.
- All logging goes to **stderr**. `stdout` is reserved for the MCP wire protocol; writing
  anything else to it will corrupt the connection.
- Inputs are validated with [Zod](https://zod.dev). Bad inputs return a tool error, not a
  process crash — the client sees a clean `isError: true` response.
- Server name: `quartermaster`. Version: `0.1.0`. Capabilities: `tools` only.

## License

MIT. Part of the [Quartermaster](https://github.com/quartermaster/quartermaster) project.
