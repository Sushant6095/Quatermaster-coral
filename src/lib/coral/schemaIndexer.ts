import type { SourceKey } from "@/lib/types";

export interface SchemaColumn {
  name: string;
  type: "Utf8" | "Boolean" | "Int64" | "Float64" | "Timestamp";
  isKey?: boolean;
  description?: string;
}

export interface SchemaTable {
  name: string;
  source: SourceKey;
  description: string;
  columns: SchemaColumn[];
}

export interface JoinCandidate {
  id: string;
  tableA: string;
  columnA: string;
  tableB: string;
  columnB: string;
  confidence: number;
  label: string;
}

export interface SchemaGraph {
  tables: SchemaTable[];
  joins: JoinCandidate[];
}

const TABLES: SchemaTable[] = [
  // ── Deel ─────────────────────────────────────────────────────────────────
  {
    name: "directory",
    source: "deel",
    description: "Employee roster from Deel HRIS",
    columns: [
      { name: "work_email", type: "Utf8", isKey: true, description: "Work email — primary join key" },
      { name: "full_name", type: "Utf8" },
      { name: "department", type: "Utf8" },
      { name: "is_active", type: "Boolean" },
      { name: "termination_date", type: "Timestamp" },
    ],
  },
  {
    name: "contracts",
    source: "deel",
    description: "Contractor and employee contracts",
    columns: [
      { name: "work_email", type: "Utf8", isKey: true },
      { name: "contract_status", type: "Utf8" },
      { name: "ended_at", type: "Timestamp" },
    ],
  },

  // ── Okta ─────────────────────────────────────────────────────────────────
  {
    name: "users",
    source: "okta",
    description: "Identity provider user records",
    columns: [
      { name: "login", type: "Utf8", isKey: true },
      { name: "email", type: "Utf8", isKey: true, description: "Primary join key" },
      { name: "status", type: "Utf8" },
      { name: "last_login_at", type: "Timestamp" },
      { name: "mfa_enrolled", type: "Boolean" },
    ],
  },
  {
    name: "app_assignments",
    source: "okta",
    description: "App access grants per user",
    columns: [
      { name: "user_login", type: "Utf8", isKey: true },
      { name: "app_name", type: "Utf8" },
      { name: "role", type: "Utf8" },
      { name: "last_used_at", type: "Timestamp" },
    ],
  },
  {
    name: "groups",
    source: "okta",
    description: "Group membership",
    columns: [
      { name: "group_name", type: "Utf8" },
      { name: "member_login", type: "Utf8", isKey: true },
    ],
  },

  // ── GitHub ────────────────────────────────────────────────────────────────
  {
    name: "members",
    source: "github",
    description: "Org members",
    columns: [
      { name: "login", type: "Utf8", isKey: true },
      { name: "email", type: "Utf8", isKey: true },
      { name: "role", type: "Utf8" },
      { name: "last_active_at", type: "Timestamp" },
    ],
  },
  {
    name: "commits",
    source: "github",
    description: "Commit history",
    columns: [
      { name: "author__email", type: "Utf8", isKey: true },
      { name: "repo", type: "Utf8" },
      { name: "committed_at", type: "Timestamp" },
    ],
  },
  {
    name: "tokens",
    source: "github",
    description: "Personal access tokens",
    columns: [
      { name: "owner__login", type: "Utf8", isKey: true },
      { name: "token_type", type: "Utf8" },
      { name: "scope", type: "Utf8" },
    ],
  },

  // ── Slack ─────────────────────────────────────────────────────────────────
  {
    name: "members",
    source: "slack",
    description: "Workspace members",
    columns: [
      { name: "id", type: "Utf8" },
      { name: "profile__email", type: "Utf8", isKey: true },
      { name: "profile__display_name", type: "Utf8" },
      { name: "is_admin", type: "Boolean" },
      { name: "deleted", type: "Boolean" },
    ],
  },
  {
    name: "messages",
    source: "slack",
    description: "Channel messages",
    columns: [
      { name: "channel_id", type: "Utf8" },
      { name: "user__profile__email", type: "Utf8", isKey: true },
      { name: "text", type: "Utf8" },
    ],
  },
  {
    name: "channels",
    source: "slack",
    description: "Public and private channels",
    columns: [
      { name: "id", type: "Utf8" },
      { name: "name", type: "Utf8" },
      { name: "num_members", type: "Int64" },
    ],
  },

  // ── Stripe ────────────────────────────────────────────────────────────────
  {
    name: "charges",
    source: "stripe",
    description: "Payment charges",
    columns: [
      { name: "id", type: "Utf8" },
      { name: "amount_cents", type: "Int64" },
      { name: "customer__email", type: "Utf8", isKey: true },
      { name: "created_at", type: "Timestamp" },
    ],
  },
  {
    name: "subscriptions",
    source: "stripe",
    description: "Active and cancelled subscriptions",
    columns: [
      { name: "customer__email", type: "Utf8", isKey: true },
      { name: "product__name", type: "Utf8" },
      { name: "status", type: "Utf8" },
      { name: "monthly_amount_cents", type: "Int64" },
    ],
  },
  {
    name: "customers",
    source: "stripe",
    description: "Stripe customer records",
    columns: [
      { name: "id", type: "Utf8" },
      { name: "email", type: "Utf8", isKey: true },
      { name: "name", type: "Utf8" },
    ],
  },

  // ── Linear ────────────────────────────────────────────────────────────────
  {
    name: "issues",
    source: "linear",
    description: "Issues and tasks",
    columns: [
      { name: "id", type: "Utf8" },
      { name: "title", type: "Utf8" },
      { name: "state__type", type: "Utf8" },
      { name: "assignee__email", type: "Utf8", isKey: true },
    ],
  },
  {
    name: "users",
    source: "linear",
    description: "Linear workspace users",
    columns: [
      { name: "id", type: "Utf8" },
      { name: "email", type: "Utf8", isKey: true },
      { name: "name", type: "Utf8" },
      { name: "active", type: "Boolean" },
    ],
  },
];

const JOINS: JoinCandidate[] = [
  {
    id: "j01",
    tableA: "deel.directory", columnA: "work_email",
    tableB: "okta.users", columnB: "email",
    confidence: 0.95, label: "email — identity anchor",
  },
  {
    id: "j02",
    tableA: "deel.directory", columnA: "work_email",
    tableB: "github.members", columnB: "email",
    confidence: 0.95, label: "email join",
  },
  {
    id: "j03",
    tableA: "deel.directory", columnA: "work_email",
    tableB: "slack.members", columnB: "profile__email",
    confidence: 0.95, label: "email join",
  },
  {
    id: "j04",
    tableA: "deel.directory", columnA: "work_email",
    tableB: "stripe.customers", columnB: "email",
    confidence: 0.90, label: "email join",
  },
  {
    id: "j05",
    tableA: "deel.directory", columnA: "work_email",
    tableB: "linear.users", columnB: "email",
    confidence: 0.90, label: "email join",
  },
  {
    id: "j06",
    tableA: "okta.users", columnA: "email",
    tableB: "github.members", columnB: "email",
    confidence: 0.88, label: "email join",
  },
  {
    id: "j07",
    tableA: "okta.app_assignments", columnA: "user_login",
    tableB: "okta.users", columnB: "login",
    confidence: 0.98, label: "FK",
  },
  {
    id: "j08",
    tableA: "okta.groups", columnA: "member_login",
    tableB: "okta.users", columnB: "login",
    confidence: 0.97, label: "FK",
  },
  {
    id: "j09",
    tableA: "stripe.charges", columnA: "customer__email",
    tableB: "stripe.customers", columnB: "email",
    confidence: 0.98, label: "FK",
  },
  {
    id: "j10",
    tableA: "stripe.subscriptions", columnA: "customer__email",
    tableB: "stripe.customers", columnB: "email",
    confidence: 0.98, label: "FK",
  },
  {
    id: "j11",
    tableA: "github.commits", columnA: "author__email",
    tableB: "github.members", columnB: "email",
    confidence: 0.85, label: "email join",
  },
  {
    id: "j12",
    tableA: "github.tokens", columnA: "owner__login",
    tableB: "github.members", columnB: "login",
    confidence: 0.97, label: "FK",
  },
  {
    id: "j13",
    tableA: "slack.messages", columnA: "user__profile__email",
    tableB: "slack.members", columnB: "profile__email",
    confidence: 0.92, label: "FK",
  },
  {
    id: "j14",
    tableA: "linear.issues", columnA: "assignee__email",
    tableB: "linear.users", columnB: "email",
    confidence: 0.95, label: "FK",
  },
];

export function getSchemaGraph(): SchemaGraph {
  return { tables: TABLES, joins: JOINS };
}
