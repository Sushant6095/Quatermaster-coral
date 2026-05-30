import { ComingSoonHero } from "@/components/ui/ComingSoonHero";

/**
 * /findings — index page (the per-finding detail is at /findings/[id]).
 *
 * For v1 we route users to the Audit Run view for a list; this stub
 * keeps the nav clean and points back to where findings live.
 */
export default function FindingsIndexPage() {
  return (
    <ComingSoonHero
      title="Findings"
      description="Findings live inside each audit run. Open an audit to see its results."
      bullets={[
        "Each finding carries severity, evidence, and a drafted remediation.",
        "Approved findings flow to /remediation; resolved ones append to /ledger.",
      ]}
      ctaLabel="Open Audits Library"
      ctaHref="/audits"
    />
  );
}
