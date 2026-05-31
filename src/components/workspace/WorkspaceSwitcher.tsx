"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Check } from "lucide-react";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

function initial(s: string): string {
  return (s.trim()[0] ?? "?").toUpperCase();
}

export function WorkspaceSwitcher() {
  const { active, workspaces, switchTo } = useWorkspace();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!active) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors hover:bg-[var(--color-card)]"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-sea)] text-[10px] font-bold text-white">
          {initial(active.org)}
        </span>
        <span className="max-w-[150px] truncate font-medium text-[var(--color-text)]">
          {active.org}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-dim)]" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-60 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-1 shadow-xl shadow-black/40"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Workspaces
          </div>
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              role="menuitem"
              onClick={() => {
                switchTo(w.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--color-bg)] text-[10px] font-bold text-[var(--color-text-muted)]">
                {initial(w.org)}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {w.org}
                {w.isGuest && (
                  <span className="ml-1 text-[var(--color-text-dim)]">· guest</span>
                )}
              </span>
              {w.id === active.id && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
              )}
            </button>
          ))}
          <div className="mt-1 border-t border-[var(--color-border)] pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                router.push("/welcome");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
            >
              <Plus className="h-3.5 w-3.5" />
              New workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
