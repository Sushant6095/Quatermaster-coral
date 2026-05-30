"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import { X, AlertTriangle, GitBranch, Hash, Key, Boxes, User2, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BlastRadiusData, BlastNode } from "@/lib/fixtures/blastRadius";

import "@xyflow/react/dist/style.css";

interface BlastRadiusModalProps {
  open: boolean;
  onClose: () => void;
  findingId: string;
  targetName: string;
}

type NodeType = BlastNode["type"];

function nodeColor(type: NodeType): string {
  switch (type) {
    case "person":  return "var(--color-gold)";
    case "repo":    return "var(--color-sea)";
    case "channel": return "var(--color-text-muted)";
    case "secret":  return "var(--color-coral)";
    case "service": return "var(--color-lime)";
  }
}

function nodeIcon(type: NodeType): React.ReactNode {
  const cls = "h-3 w-3";
  switch (type) {
    case "person":  return <User2 className={cls} />;
    case "repo":    return <GitBranch className={cls} />;
    case "channel": return <Hash className={cls} />;
    case "secret":  return <Key className={cls} />;
    case "service": return <Boxes className={cls} />;
  }
}

const LEGEND_ITEMS: { type: NodeType; label: string }[] = [
  { type: "person",  label: "Person" },
  { type: "repo",    label: "Repository" },
  { type: "channel", label: "Slack Channel" },
  { type: "secret",  label: "Secret" },
  { type: "service", label: "Service" },
];

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function toReactFlowNodes(nodes: BlastNode[]): Node[] {
  return nodes.map((n, i) => {
    const col = i % 8;
    const row = Math.floor(i / 8);
    const color = nodeColor(n.type);
    return {
      id: n.id,
      position: { x: col * 210 + (row % 2 === 1 ? 105 : 0), y: row * 110 },
      data: { label: n.label },
      style: {
        background: "var(--color-card)",
        border: `1px solid ${color}`,
        borderRadius: "6px",
        color: "var(--color-text)",
        fontSize: "12px",
        fontFamily: "var(--font-geist-mono, monospace)",
        width: 160,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: n.severity === "P0"
          ? `0 0 8px ${color}55`
          : undefined,
      },
    };
  });
}

function toReactFlowEdges(edges: BlastRadiusData["edges"]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    style: { stroke: "var(--color-border-strong)", strokeWidth: 1 },
    labelStyle: {
      fill: "var(--color-text-dim)",
      fontSize: "10px",
      fontFamily: "var(--font-geist-mono, monospace)",
    },
    labelBgStyle: { fill: "var(--color-card)" },
  }));
}

export function BlastRadiusModal({
  open,
  onClose,
  findingId,
  targetName,
}: BlastRadiusModalProps) {
  const [data, setData] = useState<BlastRadiusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ node: BlastNode; x: number; y: number } | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_evt, rfNode) => {
      if (!data) return;
      const found = data.nodes.find((n) => n.id === rfNode.id);
      if (!found) return;
      const rect = flowRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
      const pos = rfNode.position as { x: number; y: number };
      setTooltip({ node: found, x: pos.x - rect.left + 80, y: pos.y - rect.top + 40 });
    },
    [data],
  );

  function exportPng(): void {
    // Print the flow container as a PDF/image via the browser's native print.
    const style = document.createElement("style");
    style.id = "qm-print-override";
    style.textContent =
      "@media print { body > *:not(#qm-blast-print) { display: none !important; } #qm-blast-print { display: block !important; position: fixed; inset: 0; } }";
    document.head.appendChild(style);
    window.print();
    setTimeout(() => style.remove(), 1500);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/findings/${findingId}/blast-radius`);
      const json = (await res.json()) as
        | { ok: true; data: BlastRadiusData }
        | { ok: false; error: string };
      if (!json.ok) {
        setError(json.error);
      } else {
        setData(json.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blast radius");
    } finally {
      setLoading(false);
    }
  }, [findingId]);

  useEffect(() => {
    if (open) {
      void fetchData();
    } else {
      setData(null);
      setError(null);
    }
  }, [open, fetchData]);

  const rfNodes = data ? toReactFlowNodes(data.nodes) : [];
  const rfEdges = data ? toReactFlowEdges(data.edges) : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)]"
          aria-modal="true"
          role="dialog"
          aria-label={`Blast Radius — ${targetName}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-full flex-col"
          >
            {/* Header */}
            <header
              className={cn(
                "flex items-center justify-between gap-4 border-b px-6 py-4",
                "border-[var(--color-border)] bg-[var(--color-surface)]"
              )}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-[var(--color-coral)]" />
                <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
                  Blast Radius
                  <span className="ml-2 text-[var(--color-text-muted)]">— {targetName}</span>
                </h2>
                {data && (
                  <div className="flex items-center gap-2">
                    <Badge label={`${data.summary.nodeCount} nodes`} color="var(--color-sea)" />
                    <Badge label={`${data.summary.sourceCount} sources`} color="var(--color-gold)" />
                    <Badge
                      label={`${formatUsd(data.summary.estimatedRiskUsd)} risk`}
                      color="var(--color-coral)"
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close blast radius"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  "text-[var(--color-text-muted)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]",
                  "transition-colors"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Body */}
            <div className="relative flex-1 overflow-hidden">
              {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--color-bg)]">
                  <PulsingDot />
                  <p className="font-mono text-[13px] text-[var(--color-text-muted)]">
                    Mapping blast radius…
                  </p>
                </div>
              )}

              {error && !loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <p className="font-mono text-[13px] text-[var(--color-coral)]">
                    Error: {error}
                  </p>
                </div>
              )}

              {data && !loading && (
                <ReactFlow
                  ref={flowRef}
                  nodes={rfNodes}
                  edges={rfEdges}
                  fitView
                  fitViewOptions={{ padding: 0.15 }}
                  style={{ background: "var(--color-bg)" }}
                  proOptions={{ hideAttribution: true }}
                  onNodeClick={handleNodeClick}
                  onPaneClick={() => setTooltip(null)}
                >
                  <Background color="var(--color-border)" gap={24} />
                  <Controls
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                    }}
                  />
                  <MiniMap
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                    nodeColor={(n: Node) => {
                      // Infer type from border color stored in style
                      const border = (n.style?.border as string | undefined) ?? "";
                      if (border.includes("var(--color-gold)"))       return "var(--color-gold)";
                      if (border.includes("var(--color-sea)"))        return "var(--color-sea)";
                      if (border.includes("var(--color-coral)"))      return "var(--color-coral)";
                      if (border.includes("var(--color-lime)"))       return "var(--color-lime)";
                      return "var(--color-text-muted)";
                    }}
                  />
                </ReactFlow>
              )}
            </div>

            {/* Node evidence tooltip */}
            <AnimatePresence>
              {tooltip && (
                <motion.div
                  key="tooltip"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.14 }}
                  className={cn(
                    "absolute z-20 w-72 rounded-[10px] border p-4 shadow-xl",
                    "border-[var(--color-border-strong)] bg-[var(--color-surface)]"
                  )}
                  style={{ left: Math.min(tooltip.x, window.innerWidth - 308), top: Math.max(tooltip.y, 80) }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: nodeColor(tooltip.node.type) }}
                    >
                      {tooltip.node.type}
                    </span>
                    <button type="button" onClick={() => setTooltip(null)} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="mt-1 text-[14px] font-medium text-[var(--color-text)]">{tooltip.node.label}</p>
                  <div className="mt-3 rounded-md bg-[var(--color-code-bg)] px-3 py-2">
                    <p className="font-mono text-[11px] leading-relaxed text-[var(--color-sea)]">
                      {`SELECT * FROM ${tooltip.node.type === "repo" ? "github" : tooltip.node.type === "channel" ? "slack" : tooltip.node.type === "service" ? "stripe" : tooltip.node.type === "secret" ? "github" : "deel"}.${tooltip.node.type === "repo" ? "commits" : tooltip.node.type === "channel" ? "channels" : tooltip.node.type === "service" ? "subscriptions" : tooltip.node.type === "secret" ? "tokens" : "directory"}`}
                      {"\nWHERE email = '"}
                      <span className="text-[var(--color-gold)]">mark.reyes@acme.corp</span>
                      {"'"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legend + Export */}
            <div
              className={cn(
                "flex items-center justify-between gap-4 border-t px-6 py-3",
                "border-[var(--color-border)] bg-[var(--color-surface)]"
              )}
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
                  Legend
                </span>
                {LEGEND_ITEMS.map(({ type, label }) => (
                  <span key={type} className="flex items-center gap-1.5">
                    <span className="flex h-3 w-3 items-center justify-center" style={{ color: nodeColor(type) }}>
                      {nodeIcon(type)}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--color-text-muted)]">{label}</span>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={exportPng}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] transition-colors",
                  "border-[var(--color-border)] text-[var(--color-text-muted)]",
                  "hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
                )}
              >
                <Download className="h-3.5 w-3.5" />
                Export PNG
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Small sub-components
// ---------------------------------------------------------------------------

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-[var(--radius-pill)] px-2.5 py-0.5 font-mono text-[11px] font-semibold ring-1 ring-inset"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        // ring color is driven by Tailwind ring-inset; override via outline trick
        outlineColor: `color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

function PulsingDot() {
  return (
    <div className="relative h-8 w-8">
      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-coral)] opacity-40" />
      <span className="absolute inset-1 rounded-full bg-[var(--color-coral)]" />
    </div>
  );
}
