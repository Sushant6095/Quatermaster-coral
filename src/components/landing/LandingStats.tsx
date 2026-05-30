"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface StatItem {
  prefix: string;
  value: number;
  suffix: string;
  decimals: number;
  label: string;
  color: string;
  description: string;
}

const STATS: StatItem[] = [
  {
    prefix: "",
    value: 7,
    suffix: "",
    decimals: 0,
    label: "Zombie Accounts",
    color: "var(--color-coral)",
    description: "Inactive employees still holding active seats",
  },
  {
    prefix: "$",
    value: 4820,
    suffix: "/mo",
    decimals: 0,
    label: "Monthly Waste",
    color: "var(--color-gold)",
    description: "Ghost-seat spend surfaced in a single query",
  },
  {
    prefix: "",
    value: 1.4,
    suffix: "s",
    decimals: 1,
    label: "Query Execution",
    color: "var(--color-sea)",
    description: "Federated JOIN across five live sources",
  },
  {
    prefix: "",
    value: 5,
    suffix: "",
    decimals: 0,
    label: "Sources Federated",
    color: "var(--color-lime)",
    description: "Deel · Okta · GitHub · Slack · Stripe",
  },
];

interface CounterProps {
  item: StatItem;
  shouldAnimate: boolean;
}

function StatCounter({ item, shouldAnimate }: CounterProps) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const DURATION = 1600;

  useEffect(() => {
    if (!shouldAnimate) return;

    startTimeRef.current = null;

    function tick(ts: number) {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayed(item.value * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(item.value);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [shouldAnimate, item.value]);

  const formatted =
    item.decimals > 0
      ? displayed.toFixed(item.decimals)
      : Math.round(displayed).toLocaleString();

  return (
    <span
      className="font-mono text-[clamp(2rem,4vw,3rem)] font-semibold tabular-nums"
      style={{ color: item.color }}
    >
      {item.prefix}
      {formatted}
      {item.suffix}
    </span>
  );
}

export function LandingStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Key metrics"
      className={cn(
        "border-y border-[var(--color-border)]",
        "bg-[var(--color-surface)]"
      )}
    >
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-px md:grid-cols-4 bg-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col gap-1 bg-[var(--color-surface)] px-6 py-8",
                "transition-colors hover:bg-[var(--color-card)]"
              )}
            >
              <StatCounter item={stat} shouldAnimate={visible} />
              <span className="mt-1 text-sm font-medium text-[var(--color-text)]">
                {stat.label}
              </span>
              <span className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                {stat.description}
              </span>

              {/* subtle index indicator */}
              <span
                className="mt-3 text-[10px] font-mono text-[var(--color-text-dim)]"
                aria-hidden="true"
              >
                0{i + 1} / 04
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
