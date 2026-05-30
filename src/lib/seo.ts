/**
 * Single source of truth for SEO/canonical values.
 * Swap SITE_URL here when a custom domain replaces the Vercel one.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://quatermaster-coral.vercel.app";

export const SITE_NAME = "Quartermaster";

export const SITE_TAGLINE = "Local-first SaaS Audit Agent";

export const SITE_DESCRIPTION =
  "Quartermaster joins your HRIS, Okta, GitHub, Slack and Stripe in a single federated SQL query to surface zombie accounts, ghost seats, and shadow IT. No warehouse, no ETL — and PII never leaves your machine.";

/** Public routes worth advertising to crawlers (excludes dynamic detail pages and /api). */
export const PUBLIC_ROUTES = [
  "",
  "/cockpit",
  "/audits",
  "/copilot",
  "/schema",
  "/findings",
  "/remediation",
  "/ledger",
  "/sources",
  "/playground",
  "/settings",
] as const;
