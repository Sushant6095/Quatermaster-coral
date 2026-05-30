/**
 * Quartermaster — Blast Radius fixture data.
 *
 * Returns a force-directed graph showing every system a principal
 * touches. Used in demo mode and as the offline fallback.
 */

import type { Severity } from "@/lib/types";

export interface BlastNode {
  id: string;
  label: string;
  type: "person" | "repo" | "channel" | "secret" | "service";
  severity?: Severity;
  meta?: Record<string, string>;
}

export interface BlastEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface BlastRadiusData {
  nodes: BlastNode[];
  edges: BlastEdge[];
  summary: {
    nodeCount: number;
    sourceCount: number;
    estimatedRiskUsd: number;
  };
}

// ---------------------------------------------------------------------------
// Full 47-node fixture for mark.reyes@acme.corp
// ---------------------------------------------------------------------------

const MARK_NODES: BlastNode[] = [
  // Person (1)
  { id: "person-mark", label: "Mark Reyes", type: "person", meta: { email: "mark.reyes@acme.corp", dept: "Engineering" } },

  // Repos (8)
  { id: "repo-api-core",       label: "api-core",        type: "repo",    severity: "P0", meta: { role: "admin" } },
  { id: "repo-auth-service",   label: "auth-service",    type: "repo",    severity: "P0", meta: { role: "admin" } },
  { id: "repo-data-pipeline",  label: "data-pipeline",   type: "repo",    meta: { role: "write" } },
  { id: "repo-infra-k8s",      label: "infra-k8s",       type: "repo",    severity: "P1", meta: { role: "admin" } },
  { id: "repo-frontend-web",   label: "frontend-web",    type: "repo",    meta: { role: "write" } },
  { id: "repo-mobile-ios",     label: "mobile-ios",      type: "repo",    meta: { role: "write" } },
  { id: "repo-analytics-etl",  label: "analytics-etl",   type: "repo",    meta: { role: "write" } },
  { id: "repo-secrets-vault",  label: "secrets-vault",   type: "repo",    severity: "P0", meta: { role: "admin" } },

  // Channels (6)
  { id: "chan-eng-backend",       label: "#eng-backend",       type: "channel", meta: { members: "42" } },
  { id: "chan-deploy-prod",       label: "#deploy-prod",       type: "channel", severity: "P1", meta: { members: "18" } },
  { id: "chan-security-alerts",   label: "#security-alerts",   type: "channel", severity: "P0", meta: { members: "11" } },
  { id: "chan-design",            label: "#design",             type: "channel", meta: { members: "29" } },
  { id: "chan-all-hands",         label: "#all-hands",          type: "channel", meta: { members: "210" } },
  { id: "chan-on-call-pagerduty", label: "#on-call-pagerduty", type: "channel", severity: "P1", meta: { members: "9" } },

  // Secrets (5)
  { id: "secret-aws-prod",        label: "AWS_PROD_KEY",         type: "secret", severity: "P0" },
  { id: "secret-stripe",          label: "STRIPE_SECRET_KEY",    type: "secret", severity: "P0" },
  { id: "secret-github-deploy",   label: "GITHUB_DEPLOY_TOKEN",  type: "secret", severity: "P1" },
  { id: "secret-database-url",    label: "DATABASE_URL",         type: "secret", severity: "P1" },
  { id: "secret-vault-root",      label: "VAULT_ROOT_TOKEN",     type: "secret", severity: "P0" },

  // Services (4)
  { id: "svc-stripe",     label: "stripe-billing", type: "service", severity: "P0" },
  { id: "svc-aws-prod",   label: "aws-prod",        type: "service", severity: "P0" },
  { id: "svc-pagerduty",  label: "pagerduty",       type: "service", severity: "P1" },
  { id: "svc-datadog",    label: "datadog",          type: "service" },

  // Additional collaborators / nodes for wow-factor (23)
  { id: "person-alice",    label: "Alice Chen",       type: "person",  meta: { email: "alice.chen@acme.corp" } },
  { id: "person-bob",      label: "Bob Okafor",       type: "person",  meta: { email: "bob.okafor@acme.corp" } },
  { id: "person-carol",    label: "Carol Singh",      type: "person",  meta: { email: "carol.singh@acme.corp" } },
  { id: "person-devops",   label: "DevOps Bot",       type: "person",  meta: { email: "devops-bot@acme.corp" } },
  { id: "repo-ml-models",  label: "ml-models",        type: "repo",    meta: { role: "write" } },
  { id: "repo-terraform",  label: "terraform-infra",  type: "repo",    severity: "P1", meta: { role: "admin" } },
  { id: "repo-billing-svc",label: "billing-service",  type: "repo",    severity: "P1", meta: { role: "write" } },
  { id: "repo-docs",       label: "internal-docs",    type: "repo",    meta: { role: "write" } },
  { id: "chan-eng-all",    label: "#eng-all",           type: "channel", meta: { members: "87" } },
  { id: "chan-incidents",  label: "#incidents",         type: "channel", severity: "P1", meta: { members: "22" } },
  { id: "chan-releases",   label: "#releases",          type: "channel", meta: { members: "55" } },
  { id: "chan-ml-team",    label: "#ml-team",           type: "channel", meta: { members: "14" } },
  { id: "secret-sentry",   label: "SENTRY_DSN",         type: "secret" },
  { id: "secret-openai",   label: "OPENAI_API_KEY",     type: "secret", severity: "P1" },
  { id: "secret-slack-bot",label: "SLACK_BOT_TOKEN",    type: "secret", severity: "P1" },
  { id: "svc-sentry",      label: "sentry",             type: "service" },
  { id: "svc-github-actions", label: "github-actions",  type: "service", severity: "P1" },
  { id: "svc-cloudfront",  label: "cloudfront-cdn",     type: "service" },
  { id: "svc-rds-prod",    label: "rds-prod",           type: "service", severity: "P0" },
  { id: "svc-k8s-cluster", label: "k8s-prod-cluster",  type: "service", severity: "P0" },
  { id: "person-sec-lead", label: "Sam Kowalski",       type: "person",  meta: { email: "sam.kowalski@acme.corp", role: "Security Lead" } },
  { id: "repo-soc2-evidence", label: "soc2-evidence",   type: "repo",    severity: "P1", meta: { role: "write" } },
  { id: "chan-soc2-audit", label: "#soc2-audit",         type: "channel", severity: "P1", meta: { members: "6" } },
];

const MARK_EDGES: BlastEdge[] = [
  // Mark → repos
  { id: "e-mark-api-core",       source: "person-mark", target: "repo-api-core",      label: "admin" },
  { id: "e-mark-auth-service",   source: "person-mark", target: "repo-auth-service",  label: "admin" },
  { id: "e-mark-data-pipeline",  source: "person-mark", target: "repo-data-pipeline", label: "write" },
  { id: "e-mark-infra-k8s",      source: "person-mark", target: "repo-infra-k8s",     label: "admin" },
  { id: "e-mark-frontend-web",   source: "person-mark", target: "repo-frontend-web",  label: "write" },
  { id: "e-mark-mobile-ios",     source: "person-mark", target: "repo-mobile-ios",    label: "write" },
  { id: "e-mark-analytics-etl",  source: "person-mark", target: "repo-analytics-etl", label: "write" },
  { id: "e-mark-secrets-vault",  source: "person-mark", target: "repo-secrets-vault", label: "admin" },
  { id: "e-mark-ml-models",      source: "person-mark", target: "repo-ml-models",     label: "write" },
  { id: "e-mark-terraform",      source: "person-mark", target: "repo-terraform",     label: "admin" },
  { id: "e-mark-billing-svc",    source: "person-mark", target: "repo-billing-svc",   label: "write" },
  { id: "e-mark-docs",           source: "person-mark", target: "repo-docs",          label: "write" },
  { id: "e-mark-soc2",           source: "person-mark", target: "repo-soc2-evidence", label: "write" },

  // Mark → channels
  { id: "e-mark-chan-eng",        source: "person-mark", target: "chan-eng-backend",       label: "member" },
  { id: "e-mark-chan-deploy",     source: "person-mark", target: "chan-deploy-prod",       label: "member" },
  { id: "e-mark-chan-security",   source: "person-mark", target: "chan-security-alerts",   label: "member" },
  { id: "e-mark-chan-design",     source: "person-mark", target: "chan-design",             label: "member" },
  { id: "e-mark-chan-all-hands",  source: "person-mark", target: "chan-all-hands",          label: "member" },
  { id: "e-mark-chan-oncall",     source: "person-mark", target: "chan-on-call-pagerduty", label: "member" },
  { id: "e-mark-chan-eng-all",    source: "person-mark", target: "chan-eng-all",            label: "member" },
  { id: "e-mark-chan-incidents",  source: "person-mark", target: "chan-incidents",          label: "member" },
  { id: "e-mark-chan-releases",   source: "person-mark", target: "chan-releases",           label: "member" },
  { id: "e-mark-chan-ml",         source: "person-mark", target: "chan-ml-team",            label: "member" },
  { id: "e-mark-chan-soc2",       source: "person-mark", target: "chan-soc2-audit",         label: "member" },

  // Mark → secrets
  { id: "e-mark-secret-aws",     source: "person-mark", target: "secret-aws-prod",      label: "reads-secret" },
  { id: "e-mark-secret-stripe",  source: "person-mark", target: "secret-stripe",         label: "reads-secret" },
  { id: "e-mark-secret-github",  source: "person-mark", target: "secret-github-deploy",  label: "reads-secret" },
  { id: "e-mark-secret-db",      source: "person-mark", target: "secret-database-url",   label: "reads-secret" },
  { id: "e-mark-secret-vault",   source: "person-mark", target: "secret-vault-root",     label: "reads-secret" },
  { id: "e-mark-secret-sentry",  source: "person-mark", target: "secret-sentry",         label: "reads-secret" },
  { id: "e-mark-secret-openai",  source: "person-mark", target: "secret-openai",         label: "reads-secret" },
  { id: "e-mark-secret-slack",   source: "person-mark", target: "secret-slack-bot",      label: "reads-secret" },

  // Mark → services
  { id: "e-mark-svc-stripe",     source: "person-mark", target: "svc-stripe",         label: "bills-to" },
  { id: "e-mark-svc-aws",        source: "person-mark", target: "svc-aws-prod",        label: "bills-to" },
  { id: "e-mark-svc-pagerduty",  source: "person-mark", target: "svc-pagerduty",       label: "assignee" },
  { id: "e-mark-svc-datadog",    source: "person-mark", target: "svc-datadog",          label: "member" },
  { id: "e-mark-svc-gh-actions", source: "person-mark", target: "svc-github-actions",  label: "member" },
  { id: "e-mark-svc-cloudfront", source: "person-mark", target: "svc-cloudfront",       label: "member" },
  { id: "e-mark-svc-rds",        source: "person-mark", target: "svc-rds-prod",         label: "bills-to" },
  { id: "e-mark-svc-k8s",        source: "person-mark", target: "svc-k8s-cluster",      label: "admin" },
  { id: "e-mark-svc-sentry",     source: "person-mark", target: "svc-sentry",           label: "member" },

  // Collaborator relationships
  { id: "e-alice-api-core",      source: "person-alice",   target: "repo-api-core",     label: "write" },
  { id: "e-bob-data-pipeline",   source: "person-bob",     target: "repo-data-pipeline",label: "write" },
  { id: "e-carol-frontend",      source: "person-carol",   target: "repo-frontend-web", label: "write" },
  { id: "e-devops-terraform",    source: "person-devops",  target: "repo-terraform",    label: "admin" },
  { id: "e-sec-lead-vault",      source: "person-sec-lead",target: "repo-secrets-vault",label: "admin" },
  { id: "e-alice-chan-eng",       source: "person-alice",   target: "chan-eng-backend",  label: "member" },
  { id: "e-bob-chan-incidents",   source: "person-bob",     target: "chan-incidents",    label: "member" },
  { id: "e-sec-chan-security",    source: "person-sec-lead",target: "chan-security-alerts",label: "member" },
  { id: "e-infra-svc-k8s",       source: "repo-infra-k8s", target: "svc-k8s-cluster",  label: "deploys-to" },
  { id: "e-api-secret-db",       source: "repo-api-core",  target: "secret-database-url",label: "reads-secret" },
  { id: "e-auth-secret-vault",   source: "repo-auth-service",target: "secret-vault-root",label: "reads-secret" },
  { id: "e-billing-stripe",      source: "repo-billing-svc",target: "svc-stripe",       label: "bills-to" },
  { id: "e-pipeline-rds",        source: "repo-data-pipeline",target: "svc-rds-prod",   label: "bills-to" },
  { id: "e-deploy-gh-actions",   source: "chan-deploy-prod", target: "svc-github-actions",label: "triggers" },
  { id: "e-incidents-pagerduty", source: "chan-incidents",   target: "svc-pagerduty",    label: "assignee" },
];

// ---------------------------------------------------------------------------
// Short fixture for unknown principals
// ---------------------------------------------------------------------------

function shortFixture(principalEmail: string): BlastRadiusData {
  const nodes: BlastNode[] = [
    { id: "person-unknown", label: principalEmail, type: "person" },
    { id: "repo-unknown-1", label: "main-service",  type: "repo",    meta: { role: "write" } },
    { id: "repo-unknown-2", label: "config-repo",   type: "repo",    severity: "P1", meta: { role: "write" } },
    { id: "chan-unknown-1", label: "#general",        type: "channel", meta: { members: "120" } },
    { id: "chan-unknown-2", label: "#engineering",    type: "channel", meta: { members: "45" } },
    { id: "secret-unknown", label: "API_KEY",         type: "secret", severity: "P1" },
    { id: "svc-unknown-1",  label: "production",      type: "service", severity: "P1" },
    { id: "svc-unknown-2",  label: "staging",         type: "service" },
    { id: "person-collab-1",label: "Team Member A",   type: "person" },
    { id: "person-collab-2",label: "Team Member B",   type: "person" },
    { id: "repo-unknown-3", label: "shared-lib",      type: "repo",    meta: { role: "read" } },
    { id: "chan-unknown-3", label: "#alerts",          type: "channel", severity: "P1", meta: { members: "15" } },
  ];
  const edges: BlastEdge[] = [
    { id: "e1", source: "person-unknown", target: "repo-unknown-1",  label: "write" },
    { id: "e2", source: "person-unknown", target: "repo-unknown-2",  label: "write" },
    { id: "e3", source: "person-unknown", target: "chan-unknown-1",   label: "member" },
    { id: "e4", source: "person-unknown", target: "chan-unknown-2",   label: "member" },
    { id: "e5", source: "person-unknown", target: "secret-unknown",  label: "reads-secret" },
    { id: "e6", source: "person-unknown", target: "svc-unknown-1",   label: "member" },
    { id: "e7", source: "person-unknown", target: "svc-unknown-2",   label: "member" },
    { id: "e8", source: "person-collab-1",target: "repo-unknown-1",  label: "write" },
    { id: "e9", source: "person-collab-2",target: "repo-unknown-2",  label: "write" },
    { id: "e10",source: "person-unknown", target: "repo-unknown-3",  label: "read" },
    { id: "e11",source: "person-unknown", target: "chan-unknown-3",   label: "member" },
  ];
  return {
    nodes,
    edges,
    summary: { nodeCount: nodes.length, sourceCount: 3, estimatedRiskUsd: 4200 },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function fixtureBlastRadius(principalEmail: string): BlastRadiusData {
  if (
    principalEmail === "mark.reyes@acme.corp" ||
    principalEmail === "mark.reyes@acme.io" ||
    principalEmail.toLowerCase().includes("mark") ||
    principalEmail.toLowerCase().includes("reyes")
  ) {
    return {
      nodes: MARK_NODES,
      edges: MARK_EDGES,
      summary: {
        nodeCount: MARK_NODES.length,
        sourceCount: 5,
        estimatedRiskUsd: 42800,
      },
    };
  }
  return shortFixture(principalEmail);
}
