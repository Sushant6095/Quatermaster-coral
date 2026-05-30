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
  Anchor,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/cockpit", label: "Cockpit", icon: LayoutDashboard },
      { href: "/copilot", label: "Copilot", icon: MessageSquare },
    ],
  },
  {
    label: "AUDIT",
    items: [
      { href: "/audits", label: "Audits", icon: ListChecks },
      { href: "/sources", label: "Sources", icon: Cable },
    ],
  },
  {
    label: "ANALYZE",
    items: [
      { href: "/schema", label: "Schema", icon: Network },
      { href: "/playground", label: "Playground", icon: Terminal },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { href: "/findings", label: "Findings", icon: AlertTriangle },
      { href: "/remediation", label: "Remediation", icon: Send },
      { href: "/ledger", label: "Ledger", icon: ScrollText },
    ],
  },
];

export function LeftRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
      {/* Logo */}
      <Link
        href="/cockpit"
        className="flex items-center gap-2.5 px-4 py-5 select-none"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-gold)]/15">
          <Anchor className="h-4 w-4 text-[var(--color-gold)]" strokeWidth={2} />
        </div>
        <div>
          <div className="text-[14px] font-semibold leading-tight text-[var(--color-gold)]">
            Quartermaster
          </div>
          <div className="text-[11px] text-[var(--color-text-dim)]">
            Enterprise Security
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-3">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className="flex flex-col gap-0.5">
            {section.label && (
              <div className="mb-1 px-3 text-[11px] font-medium uppercase tracking-[0.8px] text-[var(--color-text-dim)]">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors",
                    active
                      ? "bg-[var(--color-card)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-card)]/60 hover:text-[var(--color-text)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active
                        ? "text-[var(--color-text-muted)]"
                        : "text-[var(--color-text-dim)]"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer — Settings */}
      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors",
            pathname === "/settings" || pathname?.startsWith("/settings/")
              ? "bg-[var(--color-card)] text-[var(--color-text)]"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-card)]/60 hover:text-[var(--color-text)]"
          )}
        >
          <Settings
            className={cn(
              "h-4 w-4 shrink-0",
              pathname === "/settings" || pathname?.startsWith("/settings/")
                ? "text-[var(--color-text-muted)]"
                : "text-[var(--color-text-dim)]"
            )}
          />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
