"use client";

/**
 * ProfileMenu — the top-bar avatar and its dropdown.
 *
 * Click the avatar to reveal a Vercel-style account menu: identity header,
 * workspace role, account links, and sign-out. Closes on outside-click and
 * Escape. Single-tenant demo, so the identity is a fixed fixture.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, Database, BookOpen, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

/** Demo identity for the single-tenant workspace. */
const DEMO_USER = {
  name: "Jordan Vale",
  email: "jordan@acme-corp.io",
  role: "Owner · acme-corp",
} as const;

const REPO_URL = "https://github.com/Sushant6095/Quatermaster-coral";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside-click and Escape while open.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        className={cn(
          "h-7 w-7 rounded-full bg-gradient-to-br from-[var(--color-gold-deep)] to-[var(--color-coral-deep)] transition-shadow",
          open && "ring-2 ring-[var(--color-gold)] ring-offset-2 ring-offset-[var(--color-surface)]"
        )}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Profile"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl shadow-black/40"
          >
            {/* Identity */}
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-3 py-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[var(--color-gold-deep)] to-[var(--color-coral-deep)]" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[var(--color-text)]">
                  {DEMO_USER.name}
                </div>
                <div className="truncate text-[11px] text-[var(--color-text-muted)]">
                  {DEMO_USER.email}
                </div>
              </div>
            </div>

            {/* Workspace role */}
            <div className="border-b border-[var(--color-border)] px-3 py-2">
              <span className="rounded-full border border-[var(--color-gold)]/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-gold)]">
                {DEMO_USER.role}
              </span>
            </div>

            {/* Links */}
            <nav className="py-1">
              <MenuLink
                href="/settings"
                icon={Settings}
                label="Account settings"
                onNavigate={close}
              />
              <MenuLink
                href="/sources"
                icon={Database}
                label="Connected sources"
                onNavigate={close}
              />
              <MenuExternal
                href={REPO_URL}
                icon={BookOpen}
                label="Documentation"
                onNavigate={close}
              />
            </nav>

            {/* Sign out */}
            <div className="border-t border-[var(--color-border)] py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  toast("Sign-out is disabled in the demo", {
                    description:
                      "Quartermaster runs locally — there's no account to leave.",
                  });
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-coral)]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  onNavigate: () => void;
}

function MenuLink({ href, icon: Icon, label, onNavigate }: MenuItemProps) {
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function MenuExternal({ href, icon: Icon, label, onNavigate }: MenuItemProps) {
  return (
    <a
      role="menuitem"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
