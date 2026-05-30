# Coral source spec — Deel

Custom Coral source for the [Deel](https://www.deel.com) HRIS + contractor-of-record platform.
Built for the **Chart New Waters** bounty of the *Pirates of the Coral-bean* hackathon.

Authored against the Coral source-manifest **DSL v3** (`dsl_version: 3`, `backend: http`).
Validated with `coral source lint` on Coral `0.4.1`.

## Why this source

Every HRIS-style audit hits the same wall: full-time-employee-only directories miss the
fastest-growing identity surface in modern companies — contractors and EOR placements.
Deel is the only major HRIS that treats FTEs, contractors, and EOR workers as first-class
rows in a single directory. That makes `deel.directory` the ground-truth join anchor for
cross-source SaaS audits:

```sql
deel.directory.work_email
   ↔ okta.users.email
   ↔ github.members.email
   ↔ slack.members.profile__email
   ↔ stripe.customers.email
```

In [Quartermaster](https://github.com/quartermaster/quartermaster) this is the join key
that powers **QM-01 Zombie Account Hunter** — the audit that catches offboarded
contractors who still hold GitHub admin or Okta sessions weeks after their contract end
date. Without a Deel source, that audit silently misses the entire contractor surface.

## What's in the spec

Two tables off the Deel REST v2 API (`https://api.letsdeel.com/rest/v2`), bearer auth,
offset pagination (`limit`/`offset`, max 100 rows per page):

| Table              | Endpoint        | Rows                                      |
| ------------------ | --------------- | ----------------------------------------- |
| `deel.directory`   | `GET /people`   | Every worker — FTE, contractor, EOR.      |
| `deel.contracts`   | `GET /contracts`| Contract records keyed by worker email.   |

Nested fields are flattened with the double-underscore convention Coral uses elsewhere
(`department__name`, `worker__email`) via `expr: {kind: path, path: [...]}`. Column types
use Coral's Arrow type names (`Utf8`, `Boolean`, `Timestamp`).

Key columns:

- `deel.directory(person_id, work_email, department__name, is_active, hire_date, termination_date, …)`
- `deel.contracts(contract_id, worker__email, status, start_date, end_date)`

## How to test locally

```bash
# 1. Get a token from Deel.
#    https://app.deel.com/developer-center → "Generate API token"
export DEEL_API_TOKEN=deel_pat_...

# 2. Lint the manifest against the Coral source-spec schema.
coral source lint ./sources/deel/manifest.yaml         # → "Manifest is valid"

# 3. Register it locally (reads DEEL_API_TOKEN from env; --interactive to be prompted).
coral source add --file ./sources/deel/manifest.yaml

# 4. Run the bundled smoke tests (test_queries).
coral source test deel

# 5. Verify the schema landed in the catalog.
coral sql "SELECT table_name, column_name FROM coral.columns WHERE schema_name = 'deel';"

# 6. Federated join smoke — directory × GitHub members.
coral sql "
SELECT d.work_email, d.termination_date, gh.role
FROM deel.directory d
JOIN github.members gh ON LOWER(gh.email) = LOWER(d.work_email)
WHERE d.is_active = false
LIMIT 5;"
```

## How to submit (Chart New Waters)

Community source specs live in the Coral monorepo under
[`sources/community/<name>/`](https://github.com/withcoral/coral/tree/main/sources/community).

1. Fork [`withcoral/coral`](https://github.com/withcoral/coral).
2. Copy this folder to `sources/community/deel/` (manifest + README).
3. Open a PR. The repo enforces **conventional-commit PR titles** (`feat`/`fix`/`chore`),
   so title it: `feat(deel): add Deel HRIS community source spec`.
4. PR body should include:
   - the *why* paragraph from the top of this README,
   - the `coral source lint` output (`Manifest is valid`),
   - a note on live-tenant verification status (see caveats),
   - a one-line link back to the Quartermaster repo as the reference consumer.
5. The `docs/reference/community-sources.mdx` table is auto-generated — don't hand-edit it.
6. Cross-post in the Coral Discord `#show-and-tell` channel with the PR link.

## Caveats and known gaps

- **Live-tenant verification pending.** The manifest lints clean against Coral 0.4.1, but
  the column JSON paths are modeled from the Deel REST v2 docs. Run `coral source test deel`
  against a real Deel tenant to confirm each `expr.path` resolves, and adjust if Deel's
  payload shape differs (e.g. `emails` returned as an array rather than a `{work: …}` object).
- The Deel public API does not expose the org-chart relationship graph (manager → report).
  A future revision can add a `deel.reports_to` view when the endpoint is available.
- Hourly time-tracking endpoints are intentionally omitted — Quartermaster has no audit
  that needs them and adding them would balloon the cache footprint.
- Deel paginates at 100 records per page; large tenants (10k+ workers) should expect the
  initial directory pull to take 30–60 seconds.

## License

MIT. Same as the rest of the Quartermaster project.
