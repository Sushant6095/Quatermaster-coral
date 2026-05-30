import type { Finding } from "@/lib/types";

export const mockMarkReyes: Finding = {
  id: "F-2026-0526-001",
  auditId: "QM-01",
  severity: "P0",
  targetName: "Mark Reyes",
  targetEmail: "mark.reyes@acme.corp",
  department: "Engineering",
  rationale:
    "Mark Reyes was offboarded 14 days ago but still maintains admin privileges on the api-core repository and related infrastructure. This violates SOC2 compliance policy AC-04 regarding timely revocation of access for terminated contractors.",
  evidence: [
    {
      source: "github",
      title: "GitHub Organization",
      detail: "Owner role on quartermaster-inc · 4 repos · last push 2 days ago",
      externalUrl: "https://github.com/quartermaster-inc/settings/people",
    },
    {
      source: "slack",
      title: "Slack Workspace",
      detail: "Active session detected 2 hours ago · 14 channels",
      externalUrl: "https://acme.slack.com/admin/users/U0214MR",
    },
    {
      source: "linear",
      title: "Linear Issues",
      detail: "3 issues still assigned · status In Progress on SEC-241",
      externalUrl: "https://linear.app/acme/profile/mark-reyes",
    },
  ],
  draftedActions: [
    {
      id: "D-001",
      channel: "slack-dm",
      title: "Slack DM to IT Ops",
      body: "Hey IT team, Mark Reyes was offboarded 14 days ago but still has GitHub Owner access on quartermaster-inc and an active Slack session. Please revoke immediately and confirm with a thumbs-up here.",
    },
    {
      id: "D-002",
      channel: "jira",
      title: "Create Jira Ticket",
      body: "[SEC-INC] Revoke lingering access for Mark Reyes\nAssignee: unassigned · Priority: High\nLinked finding: F-2026-0526-001 · SOC2 AC-04",
    },
    {
      id: "D-003",
      channel: "checklist",
      title: "Compliance Checklist",
      body: "1. Revoke GitHub Owner role on quartermaster-inc\n2. Deactivate Slack workspace seat\n3. Reassign 3 open Linear issues\n4. Confirm Okta deprovision flag and archive Deel record",
    },
  ],
  sources: ["github", "slack", "linear", "deel"],
  detectedIso: "2026-05-30T09:14:00.000Z",
};
