/**
 * QM-01 Zombie Account Hunter — federated SQL + canned result rows.
 * Used by the audit-run page in fixture mode.
 */

import type { Severity } from "@/lib/types";

export const mockZombieHunterSQL: string = `-- QM-01 Zombie Account Hunter
-- Joins HRIS termination dates against active access on
-- identity, code, and chat. Anything that survives a JOIN
-- between "terminated in Deel" and "active anywhere else"
-- is a zombie.

WITH DeactivatedEmployees AS (
  SELECT
    email,
    full_name,
    department,
    termination_date
  FROM deel.employees
  WHERE status = 'TERMINATED'
    AND termination_date > CURRENT_DATE - INTERVAL 90 DAY
),
ActiveAccounts AS (
  SELECT email, 'okta' AS source, last_active
    FROM okta.users
    WHERE is_active = TRUE
  UNION ALL
  SELECT email, 'github' AS source, last_active
    FROM github.users
    WHERE is_active = TRUE
  UNION ALL
  SELECT email, 'slack' AS source, last_active
    FROM slack.users
    WHERE is_active = TRUE
  UNION ALL
  SELECT email, 'linear' AS source, last_active
    FROM linear.users
    WHERE is_active = TRUE
)

-- Find overlap: terminated in HRIS, alive in any system
SELECT
  de.email,
  de.full_name,
  de.department,
  de.termination_date,
  aa.source,
  aa.last_active
FROM DeactivatedEmployees AS de
JOIN ActiveAccounts AS aa
  ON de.email = aa.email
ORDER BY de.termination_date ASC;`;

export interface ZombieRow extends Record<string, unknown> {
  id: string;
  severity: Severity;
  full_name: string;
  email: string;
  department: string;
  github_role: string;
  offboarded_on: string;
  active_slack_user_id: string;
}

export const mockZombieRows: ZombieRow[] = [
  {
    id: "Z-001",
    severity: "P0",
    full_name: "Mark Reyes",
    email: "mark.reyes@acme.corp",
    department: "Engineering",
    github_role: "Owner",
    offboarded_on: "2026-05-16",
    active_slack_user_id: "U0214MR",
  },
  {
    id: "Z-002",
    severity: "P0",
    full_name: "Anna Liu",
    email: "anna.liu@acme.corp",
    department: "Platform",
    github_role: "Admin",
    offboarded_on: "2026-05-12",
    active_slack_user_id: "U02ALIU",
  },
  {
    id: "Z-003",
    severity: "P1",
    full_name: "Sarah Jenkins",
    email: "sarah.jenkins@acme.corp",
    department: "Marketing",
    github_role: "Maintain",
    offboarded_on: "2026-05-09",
    active_slack_user_id: "U02SJEN",
  },
  {
    id: "Z-004",
    severity: "P1",
    full_name: "David Park",
    email: "david.park@acme.corp",
    department: "Product",
    github_role: "Write",
    offboarded_on: "2026-05-04",
    active_slack_user_id: "U02DPAR",
  },
  {
    id: "Z-005",
    severity: "P1",
    full_name: "Emily Davis",
    email: "emily.davis@acme.corp",
    department: "Design",
    github_role: "Triage",
    offboarded_on: "2026-04-28",
    active_slack_user_id: "U02EDAV",
  },
  {
    id: "Z-006",
    severity: "P1",
    full_name: "Michael Davis",
    email: "michael.davis@acme.corp",
    department: "Sales",
    github_role: "Read",
    offboarded_on: "2026-04-22",
    active_slack_user_id: "U02MDAV",
  },
  {
    id: "Z-007",
    severity: "P2",
    full_name: "Adrian Patel",
    email: "adrian.patel@acme.corp",
    department: "Support",
    github_role: "Read",
    offboarded_on: "2026-04-15",
    active_slack_user_id: "U02APAT",
  },
  {
    id: "Z-008",
    severity: "P2",
    full_name: "Taro Sato",
    email: "taro.sato@acme.corp",
    department: "Data",
    github_role: "Read",
    offboarded_on: "2026-04-04",
    active_slack_user_id: "U02TSAT",
  },
];

export const mockZombieColumns = [
  { key: "full_name", label: "Name" },
  { key: "department", label: "Dept" },
  { key: "github_role", label: "GitHub role" },
  { key: "offboarded_on", label: "Offboarded", mono: true },
  { key: "active_slack_user_id", label: "Slack ID", mono: true },
];
