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

const TONE_CLASS: Record<NonNullable<StatCardProps["tone"]>, string> = {
  gold: "text-[var(--color-gold)]",
  coral: "text-[var(--color-coral)]",
  lime: "text-[var(--color-lime)]",
  default: "text-[var(--color-text)]",
};

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
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.05 + index * 0.06 }}
      className={cn(
        "rounded-[10px] border bg-[var(--color-card)] p-5 transition-colors",
        pulsing
          ? "border-[var(--color-coral)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <div
          className={cn(
            "text-[40px] font-bold leading-none tracking-tight transition-colors duration-[600ms]",
            TONE_CLASS[tone]
          )}
        >
          {value}
        </div>
        {delta && (
          <div
            className={cn(
              "flex items-center gap-1 text-[12px] font-medium",
              deltaGood ? "text-[var(--color-lime)]" : "text-[var(--color-coral)]"
            )}
          >
            <DeltaIcon className="h-3.5 w-3.5" />
            <span>{deltaText}</span>
          </div>
        )}
      </div>
      <div className="mt-2 text-[12px] text-[var(--color-text-muted)]">{sublabel}</div>
    </motion.div>
  );
}
