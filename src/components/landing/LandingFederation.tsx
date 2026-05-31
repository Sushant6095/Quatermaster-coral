"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface SourceDef {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const SOURCES: SourceDef[] = [
  { id: "deel", name: "Deel", color: "var(--color-sea)", icon: "D" },
  { id: "okta", name: "Okta", color: "var(--color-gold)", icon: "O" },
  { id: "github", name: "GitHub", color: "var(--color-text)", icon: "G" },
  { id: "slack", name: "Slack", color: "#E01E5A", icon: "S" },
  { id: "stripe", name: "Stripe", color: "#635BFF", icon: "ST" },
];

// SVG layout constants
const SVG_W = 640;
const SVG_H = 320;
const SOURCE_X = 80;
const CORAL_X = 320;
const RESULT_X = 540;
const SOURCE_SPACING = SVG_H / (SOURCES.length + 1);

function getSourceY(index: number): number {
  return SOURCE_SPACING * (index + 1);
}

const CORAL_Y = SVG_H / 2;
const RESULT_Y = SVG_H / 2;

function buildPath(x1: number, y1: number, x2: number, y2: number): string {
  const cx1 = x1 + (x2 - x1) * 0.55;
  const cx2 = x2 - (x2 - x1) * 0.55;
  return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
}

export function LandingFederation() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const resultPathRef = useRef<SVGPathElement | null>(null);

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
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    async function animateLines() {
      const { animate, svg, stagger } = await import("animejs");
      if (cancelled) return;

      const sourcePaths = pathRefs.current.filter(Boolean) as SVGPathElement[];
      const resultPath = resultPathRef.current;

      // Draw the source → Coral lines (createDrawable handles the dash math).
      const drawables = sourcePaths.flatMap((p) => svg.createDrawable(p));
      animate(drawables, {
        draw: ["0 0", "0 1"],
        ease: "inOutSine",
        duration: 1200,
        delay: stagger(150),
      });

      if (resultPath) {
        const [resultDrawable] = svg.createDrawable(resultPath);
        animate(resultDrawable, {
          draw: ["0 0", "0 1"],
          ease: "inOutSine",
          duration: 800,
          delay: SOURCES.length * 150 + 400,
        });
      }
    }

    animateLines();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="federation-heading"
      className="py-20 md:py-32 bg-[var(--color-surface)]"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block text-xs font-mono font-medium tracking-widest text-[var(--color-text-dim)] uppercase">
            Coral Federation
          </span>
          <h2
            id="federation-heading"
            className="mb-4 text-[clamp(1.75rem,4vw,3rem)] font-light text-[var(--color-text)]"
          >
            One query.{" "}
            <span className="text-[var(--color-sea)]">Five sources.</span>{" "}
            Zero ETL.
          </h2>
          <p className="mx-auto max-w-xl text-base text-[var(--color-text-muted)]">
            Coral's federated engine joins HRIS, IdP, code, chat, and billing
            in a single{" "}
            <code className="font-mono text-[var(--color-sea)]">SELECT</code>{" "}
            statement. No warehouse. No data movement. Everything local.
          </p>
        </div>

        {/* SVG diagram */}
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]/60 backdrop-blur-sm">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ height: "clamp(220px, 35vw, 340px)" }}
            aria-label="Federation flow diagram: sources connect through Coral SQL engine to results"
          >
            {/* Source paths */}
            {SOURCES.map((src, i) => {
              const y = getSourceY(i);
              const d = buildPath(SOURCE_X + 28, y, CORAL_X - 36, CORAL_Y);
              return (
                <path
                  key={src.id}
                  ref={(el) => {
                    pathRefs.current[i] = el;
                  }}
                  d={d}
                  fill="none"
                  stroke={src.color}
                  strokeWidth="1.5"
                  strokeOpacity="0.6"
                />
              );
            })}

            {/* Result path */}
            <path
              ref={(el) => {
                resultPathRef.current = el;
              }}
              d={buildPath(CORAL_X + 36, CORAL_Y, RESULT_X - 32, RESULT_Y)}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="2"
              strokeOpacity="0.8"
            />

            {/* Source nodes */}
            {SOURCES.map((src, i) => {
              const y = getSourceY(i);
              return (
                <g key={src.id} transform={`translate(${SOURCE_X}, ${y})`}>
                  <circle
                    r="26"
                    fill="var(--color-text)"
                    stroke={src.color}
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                  />
                  <foreignObject x="-15" y="-15" width="30" height="30">
                    <div className="flex h-full w-full items-center justify-center">
                      <BrandLogo
                        name={src.id}
                        size={26}
                        colored
                        title={src.name}
                      />
                    </div>
                  </foreignObject>
                  <text
                    y="40"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fontFamily="var(--font-sans)"
                    fill="var(--color-text-muted)"
                  >
                    {src.name}
                  </text>
                </g>
              );
            })}

            {/* Coral engine node */}
            <g transform={`translate(${CORAL_X}, ${CORAL_Y})`}>
              <circle
                r="36"
                fill="var(--color-surface)"
                stroke="var(--color-sea)"
                strokeWidth="2"
                strokeOpacity="0.7"
              />
              <circle
                r="28"
                fill="var(--color-code-bg)"
                stroke="var(--color-sea)"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
              <text
                textAnchor="middle"
                y="-6"
                dominantBaseline="central"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fontWeight="700"
                fill="var(--color-sea)"
              >
                coral
              </text>
              <text
                textAnchor="middle"
                y="8"
                dominantBaseline="central"
                fontSize="8"
                fontFamily="var(--font-sans)"
                fill="var(--color-text-dim)"
              >
                SQL engine
              </text>
            </g>

            {/* Results node */}
            <g transform={`translate(${RESULT_X}, ${RESULT_Y})`}>
              <rect
                x="-54"
                y="-40"
                width="108"
                height="80"
                rx="8"
                fill="var(--color-card)"
                stroke="var(--color-gold)"
                strokeWidth="1.5"
                strokeOpacity="0.6"
              />
              <text
                textAnchor="middle"
                y="-16"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fontWeight="700"
                fill="var(--color-gold)"
              >
                7 findings
              </text>
              <text
                textAnchor="middle"
                y="0"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill="var(--color-sea)"
              >
                1.4s
              </text>
              <text
                textAnchor="middle"
                y="16"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill="var(--color-lime)"
              >
                $4,820 waste
              </text>
            </g>
          </svg>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-center text-xs text-[var(--color-text-dim)]">
          Powered by{" "}
          <span className="text-[var(--color-sea)] font-mono">Coral</span> ·
          Federates over MCP ·{" "}
          <span className="text-[var(--color-text-muted)]">
            No warehouse required
          </span>
        </p>
      </div>
    </section>
  );
}
