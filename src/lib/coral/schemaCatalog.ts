/**
 * Quartermaster — Coral federated schema catalog.
 *
 * Hard-coded representation of the tables and key columns the Copilot
 * is allowed to reference. Nested object fields are flattened with the
 * double-underscore convention (e.g. `assignee__email`).
 */

export const SCHEMA_CATALOG = `# Coral federated catalog (read-only)

deel.directory(work_email, full_name, department, manager_email, is_active, hire_date, termination_date)
deel.contracts(work_email, contract_status, ended_at, monthly_pay_usd)

okta.users(login, email, status, last_login_at, mfa_enrolled, created_at)
okta.app_assignments(user_login, app_name, role, last_used_at, granted_at)
okta.groups(group_name, member_login, is_admin)

github.members(login, email, role, two_factor_enabled, last_active_at, org)
github.commits(author__email, repo, sha, committed_at)
github.tokens(owner__login, token_type, scope, created_at, last_used_at)

slack.members(id, profile__email, profile__display_name, is_admin, deleted, last_active_ts)
slack.messages(channel_id, channel_name, user__id, user__profile__email, text, ts)
slack.channels(id, name, is_private, num_members)

stripe.charges(id, amount_cents, currency, description, statement_descriptor, customer__email, created_at)
stripe.subscriptions(id, customer__email, product__name, status, monthly_amount_cents, started_at, canceled_at)
stripe.customers(id, email, name, created_at)

linear.issues(id, title, state__type, assignee__email, created_at, updated_at, team__key)
linear.users(id, email, name, active, last_seen_at)

# Conventions
# - Email joins: LOWER(a.email) = LOWER(b.email).
# - All timestamps ISO-8601 UTC unless suffixed _ts (Slack ms epoch).
# - state__type values: 'started','unstarted','completed','canceled','triage'.
`;
