import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How Quartermaster joins five SaaS sources in one federated SQL query — architecture, the five audits, QM Copilot, Continuous Mode, Blast Radius, and the MCP server.",
  alternates: { canonical: "/docs" },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
