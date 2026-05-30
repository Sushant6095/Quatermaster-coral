"use client";

/**
 * MermaidDiagram — lazy-renders a Mermaid definition to inline SVG.
 * mermaid is heavy, so it's dynamically imported only on the docs page.
 */

import { useEffect, useRef, useState } from "react";

let renderSeq = 0;

export interface MermaidDiagramProps {
  chart: string;
  caption?: string;
}

export function MermaidDiagram({ chart, caption }: MermaidDiagramProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          fontFamily: "var(--font-sans)",
        });
        const id = `qm-mermaid-${renderSeq++}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && hostRef.current) hostRef.current.innerHTML = svg;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <figure className="my-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--lp-border)] bg-[var(--lp-surface)]">
      {failed ? (
        <pre className="overflow-x-auto p-4 text-[12px] text-[var(--lp-ink-soft)]">
          {chart}
        </pre>
      ) : (
        <div
          ref={hostRef}
          className="flex min-h-[120px] items-center justify-center overflow-x-auto p-6 [&_svg]:h-auto [&_svg]:max-w-full"
        />
      )}
      {caption && (
        <figcaption className="border-t border-[var(--lp-border)] bg-[var(--lp-surface-2)] px-4 py-2 text-center text-[12px] text-[var(--lp-ink-dim)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
