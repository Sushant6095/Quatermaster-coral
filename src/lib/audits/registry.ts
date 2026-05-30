/**
 * Quartermaster — Named audit registry.
 *
 * Each of the five killer audits has a single CTE-style SQL template
 * we hand to Coral. Templates are illustrative and intentionally easy
 * to read — they exist to demo federation, not to be production-ready
 * security queries.
 */

import type { AuditDefinition, AuditId } from "@/lib/types";

const QM_01_SQL = `-- QM-01 Zombie Account Hunter
WITH terminated AS (
  SELECT work_email FROM deel.directory WHERE is_active = false
)
SELECT t.work_email,
       gh.login AS github_handle,
       gh.role AS github_role,
       sl.id AS slack_user_id,
       ok.status AS okta_status,
       ln.assignee__email AS linear_email
FROM terminated t
LEFT JOIN github.members gh
  ON LOWER(gh.email) = LOWER(t.work_email)
LEFT JOIN slack.members sl
  ON LOWER(sl.profile__email) = LOWER(t.work_email)
 AND sl.deleted = false
LEFT JOIN okta.users ok
  ON LOWER(ok.email) = LOWER(t.work_email)
 AND ok.status = 'ACTIVE'
LEFT JOIN linear.issues ln
  ON LOWER(ln.assignee__email) = LOWER(t.work_email)
 AND ln.state__type IN ('started','unstarted')
WHERE gh.login IS NOT NULL
   OR sl.id IS NOT NULL
   OR ok.login IS NOT NULL
   OR ln.id IS NOT NULL;`;

const QM_02_SQL = `-- QM-02 Permission Drift
WITH active AS (
  SELECT work_email FROM deel.directory WHERE is_active = true
),
elevated AS (
  SELECT user_login, app_name, role, last_used_at
  FROM okta.app_assignments
  WHERE role IN ('admin','owner','superadmin')
)
SELECT a.work_email,
       e.app_name,
       e.role,
       e.last_used_at,
       gh.role AS github_role
FROM active a
JOIN okta.users u ON LOWER(u.email) = LOWER(a.work_email)
JOIN elevated e ON e.user_login = u.login
LEFT JOIN github.members gh
  ON LOWER(gh.email) = LOWER(a.work_email)
 AND gh.role = 'admin'
WHERE e.last_used_at IS NULL
   OR e.last_used_at < NOW() - INTERVAL '90 days';`;

const QM_03_SQL = `-- QM-03 Ghost-Seat Spend
WITH active AS (
  SELECT work_email FROM deel.directory WHERE is_active = true
),
recent_commits AS (
  SELECT LOWER(author__email) AS email, COUNT(*) AS commit_count
  FROM github.commits
  WHERE committed_at > NOW() - INTERVAL '30 days'
  GROUP BY 1
)
SELECT a.work_email,
       s.product__name,
       s.monthly_amount_cents / 100.0 AS monthly_usd,
       COALESCE(rc.commit_count, 0) AS commits_30d,
       s.started_at
FROM active a
JOIN stripe.subscriptions s
  ON LOWER(s.customer__email) = LOWER(a.work_email)
 AND s.status = 'active'
LEFT JOIN recent_commits rc
  ON rc.email = LOWER(a.work_email)
WHERE COALESCE(rc.commit_count, 0) = 0
ORDER BY s.monthly_amount_cents DESC;`;

const QM_04_SQL = `-- QM-04 Shadow-IT Detector
WITH approved_vendors AS (
  SELECT DISTINCT statement_descriptor
  FROM stripe.charges
  WHERE created_at < NOW() - INTERVAL '180 days'
),
recent_charges AS (
  SELECT id, amount_cents, statement_descriptor, customer__email, created_at
  FROM stripe.charges
  WHERE created_at > NOW() - INTERVAL '30 days'
),
slack_mentions AS (
  SELECT LOWER(text) AS msg_text,
         channel_name,
         user__profile__email AS author_email,
         ts
  FROM slack.messages
  WHERE ts > NOW() - INTERVAL '30 days'
)
SELECT rc.id AS charge_id,
       rc.statement_descriptor AS vendor,
       rc.amount_cents / 100.0 AS amount_usd,
       rc.customer__email AS payer,
       sm.channel_name AS slack_channel,
       sm.author_email AS slack_author
FROM recent_charges rc
LEFT JOIN approved_vendors av
  ON av.statement_descriptor = rc.statement_descriptor
LEFT JOIN slack_mentions sm
  ON sm.msg_text LIKE '%' || LOWER(rc.statement_descriptor) || '%'
WHERE av.statement_descriptor IS NULL
ORDER BY rc.amount_cents DESC;`;

const QM_05_SQL = `-- QM-05 Compliance Ledger (SOC2 evidence pack per termination)
WITH terminated AS (
  SELECT work_email, full_name, termination_date
  FROM deel.directory
  WHERE is_active = false
    AND termination_date > NOW() - INTERVAL '180 days'
)
SELECT t.work_email,
       t.full_name,
       t.termination_date,
       ok.status AS okta_status,
       ok.last_login_at AS okta_last_login,
       gh.login AS github_handle,
       gh.last_active_at AS github_last_active,
       sl.id AS slack_user_id,
       sl.deleted AS slack_deleted,
       MAX(s.canceled_at) AS last_stripe_cancel,
       COUNT(DISTINCT s.id) AS stripe_subs
FROM terminated t
LEFT JOIN okta.users ok ON LOWER(ok.email) = LOWER(t.work_email)
LEFT JOIN github.members gh ON LOWER(gh.email) = LOWER(t.work_email)
LEFT JOIN slack.members sl ON LOWER(sl.profile__email) = LOWER(t.work_email)
LEFT JOIN stripe.subscriptions s ON LOWER(s.customer__email) = LOWER(t.work_email)
GROUP BY t.work_email, t.full_name, t.termination_date,
         ok.status, ok.last_login_at,
         gh.login, gh.last_active_at,
         sl.id, sl.deleted
ORDER BY t.termination_date DESC;`;

export const AUDITS: Record<AuditId, AuditDefinition> = {
  "QM-01": {
    id: "QM-01",
    name: "Zombie Account Hunter",
    category: "Security",
    description:
      "Detects active seats (Okta, GitHub, Slack, Linear) still held by terminated employees in Deel.",
    sources: ["deel", "okta", "github", "slack", "linear"],
    sqlTemplate: QM_01_SQL,
  },
  "QM-02": {
    id: "QM-02",
    name: "Permission Drift",
    category: "Security",
    description:
      "Flags active employees with admin/owner roles in Okta apps unused for 90+ days.",
    sources: ["deel", "okta", "github"],
    sqlTemplate: QM_02_SQL,
  },
  "QM-03": {
    id: "QM-03",
    name: "Ghost-Seat Spend",
    category: "Spend",
    description:
      "Joins active Stripe subscriptions to GitHub commit activity to quantify unused-seat $/mo.",
    sources: ["deel", "stripe", "github"],
    sqlTemplate: QM_03_SQL,
  },
  "QM-04": {
    id: "QM-04",
    name: "Shadow-IT Detector",
    category: "Spend",
    description:
      "Surfaces Stripe charges from vendors not on the approved list, cross-referenced with Slack mentions.",
    sources: ["stripe", "slack"],
    sqlTemplate: QM_04_SQL,
  },
  "QM-05": {
    id: "QM-05",
    name: "Compliance Ledger",
    category: "Compliance",
    description:
      "Generates a SOC2 evidence row per recently-terminated employee across every source.",
    sources: ["deel", "okta", "github", "slack", "stripe"],
    sqlTemplate: QM_05_SQL,
  },
};

export function getAuditDefinition(id: AuditId): AuditDefinition {
  const def = AUDITS[id];
  if (!def) {
    throw new Error(`Unknown audit id: ${id}`);
  }
  return def;
}
