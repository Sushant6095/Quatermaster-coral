"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  ListChecks,
  AlertTriangle,
  Send,
  ScrollText,
  Network,
  Terminal,
  Cable,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Brand mark — small monogram + name + tagline. */
function BrandMark() {
  return (
    <Link href="/cockpit" className="flex items-center gap-3 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)]">
        <span className="font-mono text-lg font-bold text-[var(--color-gold)]">
          Q
        </span>
      </div>
      <div>
        <div className="font-semibold tracking-tight">Quartermaster</div>
        <div className="text-[11px] text-[var(--color-text-muted)]">
          Enterprise Security
        </div>
      </div>
    </Link>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { href: "/cockpit", label: "Cockpit", icon: LayoutDashboard },
  { href: "/copilot", label: "Copilot", icon: MessageSquare },
  { href: "/audits", label: "Audits", icon: ListChecks },
  { href: "/findings", label: "Findings", icon: AlertTriangle },
  { href: "/remediation", label: "Remediation", icon: Send },
  { href: "/ledger", label: "Ledger", icon: ScrollText },
  { href: "/schema", label: "Schema", icon: Network },
  { href: "/playground", label: "Playground", icon: Terminal },
  { href: "/sources", label: "Sources", icon: Cable },
];

export function LeftRail() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
      <BrandMark />
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--color-card)] text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-card)]/60 hover:text-[var(--color-text)]"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute -left-3 top-1.5 h-[calc(100%-12px)] w-[2px] rounded-r-full bg-[var(--color-gold)]"
                />
              )}
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-5">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-card)]/60 hover:text-[var(--color-text)]"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
