/**
 * Quartermaster — Blast Radius graph builder.
 *
 * In live mode this would build from federated Coral queries; for the
 * demo (and all offline runs) we fall back to fixture data.
 */

import { fixtureBlastRadius, type BlastRadiusData } from "@/lib/fixtures/blastRadius";

export async function buildBlastRadius(principalEmail: string): Promise<BlastRadiusData> {
  // Live Coral queries for blast radius are complex multi-source joins.
  // For the hackathon demo, always use the fixture; it is sufficient for
  // the full demo path. A real implementation would query:
  //   - GitHub org membership + repo roles
  //   - Okta app assignments
  //   - Slack channel memberships
  //   - Stripe billing contacts
  //   - Vault secret access logs
  // and join them on email/user-id to build the graph.
  try {
    return fixtureBlastRadius(principalEmail);
  } catch {
    return fixtureBlastRadius(principalEmail);
  }
}
