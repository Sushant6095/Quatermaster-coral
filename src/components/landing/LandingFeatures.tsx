"use client";

/**
 * LandingFeatures — DeepBook-style feature row with anime.js v4 illustrations.
 *
 * Four numbered cards, each with a looping SVG scene on a dotted-grid floor
 * (createDrawable line-draw, attribute tweens, staggered loops) themed to a
 * Quartermaster capability. Pure decoration — animations are mount-only and
 * reduced-motion aware.
 */

import { useEffect, useRef } from "react";
import { loadAnime } from "@/lib/anime/useAnime";

type ArtKind = "federation" | "copilot" | "continuous" | "blast";

interface Feature {
  n: string;
  title: string;
  desc: string;
  art: ArtKind;
}

const FEATURES: Feature[] = [
  {
    n: "01",
    title: "Federated SQL",
    desc: "One query joins HRIS, Okta, GitHub, Slack & Stripe — no warehouse, no ETL.",
    art: "federation",
  },
  {
    n: "02",
    title: "QM Copilot",
    desc: "Ask in plain English. Claude compiles it to validated federated SQL.",
    art: "copilot",
  },
  {
    n: "03",
    title: "Continuous Mode",
    desc: "Polls every source on a tick and streams new drift the moment it appears.",
    art: "continuous",
  },
  {
    n: "04",
    title: "Blast Radius",
    desc: "Maps every system, repo, channel and secret one account can still touch.",
    art: "blast",
  },
];

export function LandingFeatures() {
  return (
    <section className="relative border-t border-[var(--color-border)] bg-[var(--color-bg)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
            Built for the audit
          </span>
          <h2 className="mt-3 text-[clamp(1.75rem,4vw,3rem)] font-semibold tracking-tight text-[var(--color-text)]">
            Five sources.{" "}
            <span className="text-[var(--color-accent)]">One federated query.</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article
              key={f.n}
              className="group flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]/40 transition-colors hover:border-[var(--color-border-strong)]"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <span className="font-mono text-[11px] font-semibold text-[var(--color-accent)]">
                  {f.n}
                </span>
                <span className="text-[13px] font-medium text-[var(--color-text)]">
                  {f.title}
                </span>
              </div>
              <p className="px-4 pb-4 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                {f.desc}
              </p>
              <div
                className="relative mt-auto h-44 overflow-hidden border-t border-[var(--color-border)]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                  maskImage:
                    "radial-gradient(ellipse 80% 80% at 50% 45%, #000 55%, transparent 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 80% 80% at 50% 45%, #000 55%, transparent 100%)",
                }}
              >
                <Illustration kind={f.art} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Illustration({ kind }: { kind: ArtKind }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    const anims: Array<{ revert?: () => void }> = [];

    loadAnime().then(({ animate, svg, stagger }) => {
      if (cancelled || !root) return;
      const q = (sel: string) => root.querySelectorAll(sel);

      if (kind === "federation") {
        anims.push(
          animate(svg.createDrawable(root.querySelectorAll(".fed-line")), {
            draw: ["0 0", "0 1", "1 1"],
            duration: 2200,
            delay: stagger(140),
            loop: true,
            ease: "inOutQuad",
          })
        );
        anims.push(
          animate(q(".fed-core"), {
            r: [7, 9, 7],
            opacity: [0.85, 1, 0.85],
            duration: 1800,
            loop: true,
            ease: "inOutSine",
          })
        );
        anims.push(
          animate(q(".fed-src"), {
            opacity: [0.4, 1],
            duration: 900,
            delay: stagger(140),
            loop: true,
            alternate: true,
            ease: "inOutSine",
          })
        );
      } else if (kind === "copilot") {
        anims.push(
          animate(q(".cp-bar"), {
            opacity: [0.15, 1],
            translateY: [5, 0],
            duration: 520,
            delay: stagger(110),
            loop: true,
            alternate: true,
            ease: "inOutQuad",
          })
        );
        anims.push(
          animate(q(".cp-dot"), {
            opacity: [0.3, 1, 0.3],
            duration: 1100,
            loop: true,
            ease: "inOutSine",
          })
        );
      } else if (kind === "continuous") {
        anims.push(
          animate(q(".ct-ring"), {
            r: [4, 36],
            opacity: [0.75, 0],
            duration: 2200,
            delay: stagger(620),
            loop: true,
            ease: "out(2)",
          })
        );
        anims.push(
          animate(q(".ct-core"), {
            opacity: [0.5, 1, 0.5],
            duration: 1300,
            loop: true,
            ease: "inOutSine",
          })
        );
      } else {
        anims.push(
          animate(q(".bl-sat"), {
            translateY: [-3.5, 3.5],
            duration: 1900,
            delay: stagger(170),
            loop: true,
            alternate: true,
            ease: "inOutSine",
          })
        );
        anims.push(
          animate(q(".bl-edge"), {
            opacity: [0.15, 0.65],
            duration: 1500,
            delay: stagger(140),
            loop: true,
            alternate: true,
            ease: "inOutSine",
          })
        );
        anims.push(
          animate(q(".bl-core"), {
            r: [8, 10, 8],
            duration: 1700,
            loop: true,
            ease: "inOutSine",
          })
        );
      }
    });

    return () => {
      cancelled = true;
      anims.forEach((a) => a.revert?.());
    };
  }, [kind]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 140"
      className="absolute inset-0 h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <ArtMarkup kind={kind} />
    </svg>
  );
}

const ACCENT = "var(--color-accent)";
const MUTED = "var(--color-text-dim)";

function ArtMarkup({ kind }: { kind: ArtKind }) {
  if (kind === "federation") {
    const ys = [28, 49, 70, 91, 112];
    return (
      <>
        {ys.map((y, i) => (
          <path
            key={i}
            className="fed-line"
            d={`M44 ${y} C90 ${y}, 110 70, 146 70`}
            stroke={ACCENT}
            strokeWidth={1.4}
            strokeOpacity={0.7}
          />
        ))}
        {ys.map((y, i) => (
          <circle key={`s${i}`} className="fed-src" cx={44} cy={y} r={4} fill={MUTED} />
        ))}
        <circle cx={146} cy={70} r={13} fill={ACCENT} fillOpacity={0.12} />
        <circle className="fed-core" cx={146} cy={70} r={8} fill={ACCENT} />
      </>
    );
  }

  if (kind === "copilot") {
    return (
      <>
        <rect x={58} y={24} width={84} height={26} rx={7} fill="var(--color-card)" stroke={ACCENT} strokeOpacity={0.4} />
        <circle className="cp-dot" cx={70} cy={37} r={3} fill={ACCENT} />
        <rect x={80} y={34} width={50} height={5} rx={2.5} fill={MUTED} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={i}
            className="cp-bar"
            x={42 + i * 16}
            y={86}
            width={11}
            height={20}
            rx={2}
            fill={i % 3 === 0 ? ACCENT : MUTED}
          />
        ))}
      </>
    );
  }

  if (kind === "continuous") {
    return (
      <>
        {[0, 1, 2].map((i) => (
          <circle key={i} className="ct-ring" cx={100} cy={70} r={6} stroke={ACCENT} strokeWidth={1.5} />
        ))}
        <circle cx={100} cy={70} r={11} fill={ACCENT} fillOpacity={0.12} />
        <circle className="ct-core" cx={100} cy={70} r={5} fill={ACCENT} />
      </>
    );
  }

  // blast
  const sats = [
    { x: 100, y: 28 },
    { x: 150, y: 52 },
    { x: 140, y: 104 },
    { x: 60, y: 104 },
    { x: 50, y: 52 },
  ];
  return (
    <>
      {sats.map((s, i) => (
        <line key={`e${i}`} className="bl-edge" x1={100} y1={70} x2={s.x} y2={s.y} stroke={ACCENT} strokeWidth={1.2} strokeOpacity={0.4} />
      ))}
      {sats.map((s, i) => (
        <circle key={`n${i}`} className="bl-sat" cx={s.x} cy={s.y} r={5} fill={i === 2 ? "var(--color-coral)" : MUTED} />
      ))}
      <circle cx={100} cy={70} r={14} fill={ACCENT} fillOpacity={0.12} />
      <circle className="bl-core" cx={100} cy={70} r={9} fill={ACCENT} />
    </>
  );
}
