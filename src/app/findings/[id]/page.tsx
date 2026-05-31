"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { FindingSlideOver } from "@/components/finding-detail/FindingSlideOver";
import { BlastRadiusModal } from "@/components/finding-detail/BlastRadiusModal";
import { SQLPanel } from "@/components/audit-run/SQLPanel";
import { ResultGrid } from "@/components/audit-run/ResultGrid";
import { fixtureFindingsForAudit } from "@/lib/fixtures/coral";
import {
  mockZombieHunterSQL,
  mockZombieRows,
  mockZombieColumns,
} from "@/lib/fixtures/audits";
import type { AuditId, Finding } from "@/lib/types";

interface FindingDetailPageProps {
  params: Promise<{ id: string }>;
}

const ALL_AUDIT_IDS: AuditId[] = ["QM-01", "QM-02", "QM-03", "QM-04", "QM-05"];

function findFindingById(id: string): Finding {
  for (const auditId of ALL_AUDIT_IDS) {
    const findings = fixtureFindingsForAudit(auditId);
    const match = findings.find((f) => f.id === id);
    if (match) return match;
  }
  // Fallback: first finding from QM-01
  return fixtureFindingsForAudit("QM-01")[0];
}

export default function FindingDetailPage({ params }: FindingDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [blastOpen, setBlastOpen] = useState(false);

  const finding = findFindingById(id);

  function handleSlideOverChange(next: boolean): void {
    if (!next && !blastOpen) {
      router.back();
    }
  }

  /** PATCH the finding state (resolve / snooze) and surface the result. */
  async function patchFinding(action: "resolve" | "snooze"): Promise<void> {
    try {
      const res = await fetch(`/api/findings/${finding.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (action === "resolve") {
        toast.success("Finding marked resolved", {
          description: "Removed from open findings and written to the audit trail.",
        });
        router.push("/findings");
      } else {
        toast("Snoozed for 7 days", {
          description: "It will resurface in the live feed next week.",
        });
      }
    } catch (err) {
      toast.error("Could not update finding", {
        description: err instanceof Error ? err.message : "Request failed",
      });
    }
  }

  /** POST a remediation decision (approve writes a signed ledger entry). */
  async function remediate(
    remediationId: string,
    action: "approve" | "reject"
  ): Promise<void> {
    try {
      const res = await fetch(`/api/findings/${finding.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ remediationId, action }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (action === "approve") {
        toast.success("Remediation approved", {
          description: "Action sent · signed entry written to the Ledger.",
        });
      } else {
        toast("Remediation rejected", { description: "Draft dismissed." });
      }
    } catch (err) {
      toast.error("Could not update remediation", {
        description: err instanceof Error ? err.message : "Request failed",
      });
    }
  }

  return (
    <div className="relative h-full">
      {/* Dimmed audit run shown behind the slide-over */}
      <div className={cn("flex h-full flex-col gap-4 px-6 py-5", "opacity-60")}>
        <header className="flex items-baseline gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text)]">
            Zombie Account Hunter
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
            {finding.auditId} · Audit Run in Progress…
          </span>
        </header>
        <div className="grid flex-1 gap-4 lg:grid-cols-[45fr_55fr] min-h-[640px]">
          <SQLPanel sql={mockZombieHunterSQL} />
          <ResultGrid
            rows={mockZombieRows}
            columns={mockZombieColumns}
            durationSec={1.4}
            sourcesJoined={4}
            costCents={0.003}
          />
        </div>
      </div>

      <FindingSlideOver
        finding={finding}
        open={!blastOpen}
        onOpenChange={handleSlideOverChange}
        blastRadiusNodes={47}
        onBlastRadius={() => setBlastOpen(true)}
        onSnooze={() => patchFinding("snooze")}
        onResolve={() => patchFinding("resolve")}
        onApprove={(rid) => remediate(rid, "approve")}
        onReject={(rid) => remediate(rid, "reject")}
      />

      <BlastRadiusModal
        open={blastOpen}
        onClose={() => setBlastOpen(false)}
        findingId={finding.id}
        targetName={finding.targetName}
      />
    </div>
  );
}
