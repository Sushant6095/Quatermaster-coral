"use client";

import { usePathname } from "next/navigation";
import { LeftRail } from "./LeftRail";
import { TopBar } from "./TopBar";

/**
 * The persistent application chrome.
 * Skips its nav chrome on the "/" landing page so it renders standalone.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Landing and docs render standalone (their own chrome, no dashboard rail).
  if (pathname === "/" || pathname === "/docs" || pathname?.startsWith("/docs/")) {
    return <>{children}</>;
  }

  return (
    <div className="qm-dashboard flex min-h-screen">
      <LeftRail />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
