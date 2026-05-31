"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LeftRail } from "./LeftRail";
import { TopBar } from "./TopBar";
import {
  WorkspaceProvider,
  useWorkspace,
} from "@/components/workspace/WorkspaceProvider";

/** Routes that render standalone (their own chrome, no dashboard rail/gate). */
function isStandalone(pathname: string | null): boolean {
  return (
    pathname === "/" ||
    pathname === "/welcome" ||
    pathname === "/docs" ||
    (pathname?.startsWith("/docs/") ?? false)
  );
}

/**
 * Persistent application chrome + local-first workspace context.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <WorkspaceProvider>
      {isStandalone(pathname) ? (
        children
      ) : (
        <WorkspaceGate>
          <div className="qm-dashboard flex min-h-screen">
            <LeftRail />
            <div className="flex flex-1 flex-col">
              <TopBar />
              <main className="flex-1 overflow-y-auto bg-[var(--color-bg)]">
                {children}
              </main>
            </div>
          </div>
        </WorkspaceGate>
      )}
    </WorkspaceProvider>
  );
}

/** Gates the dashboard behind an active workspace; first-timers go to /welcome. */
function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { ready, active } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (ready && !active) router.replace("/welcome");
  }, [ready, active, router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)] text-[13px] text-[var(--color-text-dim)]">
        Loading workspace…
      </div>
    );
  }
  if (!active) return null; // redirecting to /welcome
  return <>{children}</>;
}
