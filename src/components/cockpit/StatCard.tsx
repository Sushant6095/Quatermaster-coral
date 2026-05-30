"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface StatCardProps {
  label: string;
  value: string;
  sublabel: string;
  delta?: { dir: "up" | "down"; pct?: string; usd?: string };
  tone?: "gold" | "coral" | "lime" | "default";
  index?: number;
}

export function StatCard({
  label,
  value,
  sublabel,
  delta,
  tone = "default",
  index = 0,
}: StatCardProps) {
  const deltaGood = delta?.dir === "down";
  const DeltaIcon = deltaGood ? ArrowDownRight : ArrowUpRight;
  const deltaText = delta?.pct ?? delta?.usd ?? "";

  // Border pulse when numeric value crosses the 70 threshold upward.
  const prevValueRef = useRef(value);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    const prev = parseInt(prevValueRef.current.replace(/[^0-9]/g, ""), 10);
    const curr = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (!Number.isNaN(prev) && !Number.isNaN(curr) && curr >= 70 && prev < 70) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 800);
      return () => clearTimeout(t);
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <motion.div
      initial={{ y: 8 }}
      animate={{ y: 0 }}
      transition={{
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.05 + index * 0.06,
      }}
      className={cn(
        "rounded-lg border bg-[var(--color-card)]/40 p-5 transition-colors",
        pulsing
          ? "border-[var(--color-coral)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
      )}
    >
      {/* Label */}
      <div className="text-[11px] font-medium uppercase tracking-[1px] text-[var(--color-text-muted)]">
        {label}
      </div>

      {/* Value row */}
      <div className="mt-3 flex items-baseline gap-3">
        <div
          className={cn(
            "text-[36px] font-semibold leading-none tracking-tight",
            // Only coral (Risk Score) gets a status color — everything else is white
            tone === "coral"
              ? "text-[var(--color-coral)]"
              : "text-[var(--color-text)]"
          )}
        >
          {value}
        </div>

        {delta && (
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              deltaGood
                ? "bg-[var(--color-lime)]/10 text-[var(--color-lime)]"
                : "bg-[var(--color-coral)]/10 text-[var(--color-coral)]"
            )}
          >
            <DeltaIcon className="h-3 w-3" />
            <span>{deltaText}</span>
          </div>
        )}
      </div>

      {/* Sublabel */}
      <div className="mt-1.5 text-[12px] text-[var(--color-text-dim)]">
        {sublabel}
      </div>
    </motion.div>
  );
}
