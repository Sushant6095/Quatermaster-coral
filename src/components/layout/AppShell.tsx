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

  // Landing page renders without the left rail / top bar.
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
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
