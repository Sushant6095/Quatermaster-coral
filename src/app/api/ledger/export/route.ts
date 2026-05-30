// POST /api/ledger/export
// Body: { principalEmail?: string; limit?: number }
// Returns: HTML document as text/html with Content-Disposition attachment
import { NextRequest, NextResponse } from "next/server";
import { listLedgerEntries } from "@/lib/audits/ledger";
import { verifyEntry } from "@/lib/audits/ledger";
import type { LedgerEntry } from "@/lib/types";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

function yyyymmdd(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(entries: LedgerEntry[], principalEmail: string | undefined, allVerified: boolean): string {
  const now = new Date();
  const reportDate = formatDate(now.toISOString());
  const principalSection = principalEmail
    ? `<div class="principal-box">
        <div class="field-row"><span class="field-label">Principal</span><span class="field-value">${escapeHtml(principalEmail)}</span></div>
        <div class="field-row"><span class="field-label">Report generated</span><span class="field-value">${escapeHtml(reportDate)}</span></div>
        <div class="field-row"><span class="field-label">Events included</span><span class="field-value">${entries.length}</span></div>
      </div>`
    : `<div class="principal-box">
        <div class="field-row"><span class="field-label">Report generated</span><span class="field-value">${escapeHtml(reportDate)}</span></div>
        <div class="field-row"><span class="field-label">Events included</span><span class="field-value">${entries.length}</span></div>
      </div>`;

  const tableRows = entries
    .map(
      (e) => `
      <tr>
        <td class="mono small">${escapeHtml(formatDate(e.timestampIso))}</td>
        <td class="mono small">${escapeHtml(e.id)}</td>
        <td>${escapeHtml(e.actor)}</td>
        <td>${escapeHtml(e.action)}</td>
        <td><span class="source-badge source-${escapeHtml(e.source)}">${escapeHtml(e.source)}</span></td>
        <td class="mono small">${escapeHtml(e.signatureSha256.slice(0, 16))}…</td>
      </tr>`
    )
    .join("\n");

  const payloadBlocks = entries
    .map(
      (e) => `
      <div class="payload-block">
        <div class="payload-header">
          <span class="mono">${escapeHtml(e.id)}</span>
          <span class="payload-action">${escapeHtml(e.action)}</span>
        </div>
        <pre class="payload-code">${escapeHtml(JSON.stringify(e.rawPayload, null, 2))}</pre>
        <div class="sig-row">
          <span class="sig-label">SHA-256</span>
          <span class="mono small">${escapeHtml(e.signatureSha256)}</span>
        </div>
      </div>`
    )
    .join("\n");

  const integrityStatus = allVerified
    ? `<span class="integrity-ok">SHA-256 chain integrity: VERIFIED ✓</span>`
    : `<span class="integrity-warn">SHA-256 chain integrity: PARTIAL — some entries could not be verified</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quartermaster — SOC2 Evidence Pack</title>
  <style>
    :root {
      --bg: #070E1A;
      --surface: #0F1A2E;
      --card: #13213A;
      --border: #22324F;
      --text: #E8EEF7;
      --muted: #9AA7BD;
      --gold: #E4B66B;
      --coral: #FF7A6B;
      --sea: #5BD2C7;
      --lime: #A8E063;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      font-size: 13px;
      line-height: 1.6;
      padding: 48px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2px solid var(--gold);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    .brand {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 8px;
    }

    .report-title {
      font-size: 26px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.02em;
    }

    .report-subtitle {
      font-size: 13px;
      color: var(--muted);
      margin-top: 4px;
    }

    .report-meta {
      text-align: right;
      color: var(--muted);
      font-size: 12px;
    }

    .section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      margin-bottom: 12px;
      margin-top: 32px;
    }

    .principal-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 32px;
    }

    .field-row {
      display: flex;
      gap: 16px;
      margin-bottom: 6px;
    }

    .field-label {
      color: var(--muted);
      font-size: 12px;
      min-width: 160px;
    }

    .field-value {
      color: var(--text);
      font-size: 12px;
      font-weight: 500;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }

    thead th {
      background: var(--surface);
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    tbody tr {
      border-bottom: 1px solid var(--border);
    }

    tbody tr:nth-child(even) {
      background: var(--surface);
    }

    tbody td {
      padding: 8px 12px;
      color: var(--text);
      vertical-align: top;
    }

    .mono {
      font-family: "Geist Mono", "SF Mono", "Fira Code", monospace;
    }

    .small {
      font-size: 11px;
    }

    .source-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: 1px solid currentColor;
    }

    .source-github { color: var(--text); }
    .source-slack  { color: var(--coral); }
    .source-okta   { color: var(--sea); }
    .source-deel   { color: var(--lime); }
    .source-stripe { color: var(--gold); }
    .source-linear { color: var(--sea); }
    .source-system { color: var(--muted); }

    .payload-block {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .payload-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 16px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
    }

    .payload-action {
      color: var(--muted);
      font-size: 12px;
    }

    .payload-code {
      padding: 12px 16px;
      font-family: "Geist Mono", "SF Mono", "Fira Code", monospace;
      font-size: 11px;
      line-height: 1.7;
      color: var(--sea);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .sig-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      border-top: 1px solid var(--border);
      background: var(--card);
    }

    .sig-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--muted);
    }

    .footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--muted);
    }

    .integrity-ok   { color: var(--lime); font-weight: 600; }
    .integrity-warn { color: var(--coral); font-weight: 600; }

    @media print {
      body {
        background: white;
        color: black;
        padding: 24px;
      }
      :root {
        --bg: white;
        --surface: #f5f5f5;
        --card: #eeeeee;
        --border: #cccccc;
        --text: #111111;
        --muted: #666666;
        --gold: #b8860b;
        --coral: #cc3300;
        --sea: #006666;
        --lime: #4a7c00;
      }
      .payload-code { color: #005577; }
      .footer { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div>
      <div class="brand">Quartermaster · Compliance Report</div>
      <div class="report-title">SOC2 Evidence Pack</div>
      <div class="report-subtitle">
        ${principalEmail ? `Principal: ${escapeHtml(principalEmail)} · ` : ""}Audit trail export
      </div>
    </div>
    <div class="report-meta">
      <div>Generated ${escapeHtml(reportDate)}</div>
      <div style="margin-top:4px">${entries.length} events · SHA-256 signed</div>
    </div>
  </header>

  <div class="section-title">Report Details</div>
  ${principalSection}

  <div class="section-title">Event Timeline</div>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Event ID</th>
        <th>Actor</th>
        <th>Action</th>
        <th>Source</th>
        <th>Signature (preview)</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="section-title">Event Payloads &amp; Signatures</div>
  ${payloadBlocks}

  <footer class="footer">
    <span>Generated by Quartermaster &middot; Local-first SaaS Audit Agent</span>
    ${integrityStatus}
  </footer>
</body>
</html>`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as { principalEmail?: string; limit?: number };
    const principalEmail = typeof body.principalEmail === "string" ? body.principalEmail : undefined;
    const limit = typeof body.limit === "number" ? Math.min(500, Math.max(1, body.limit)) : 50;

    let entries = listLedgerEntries(limit);

    if (principalEmail) {
      entries = entries.filter(
        (e) => e.principalEmail?.toLowerCase() === principalEmail.toLowerCase()
      );
    }

    const allVerified = entries.every((e) => verifyEntry(e));

    const html = buildHtml(entries, principalEmail, allVerified);

    const dateStr = yyyymmdd(new Date());
    const emailSlug = principalEmail
      ? `-${principalEmail.replace(/[^a-z0-9._-]/gi, "_")}`
      : "";
    const filename = `quartermaster-evidence${emailSlug}-${dateStr}.html`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
