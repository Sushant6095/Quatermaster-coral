"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SchemaGraph, SchemaTable, JoinCandidate } from "@/lib/coral/schemaIndexer";
import type { SourceKey } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

// ── Source palette ────────────────────────────────────────────────────────────
const SOURCE_COLORS: Record<SourceKey, string> = {
  deel:   "var(--color-lime)",
  okta:   "var(--color-sea)",
  github: "var(--color-text)",
  slack:  "var(--color-coral)",
  stripe: "var(--color-gold)",
  linear: "var(--color-text-muted)",
};

const SOURCE_ORDER: SourceKey[] = ["deel", "okta", "github", "slack", "stripe", "linear"];
const LANE_WIDTH    = 220;
const TABLE_START_Y = 90;
const TABLE_GAP     = 130;

// ── Node type definitions ─────────────────────────────────────────────────────
type HeaderNode = Node<{ label: string; source: SourceKey }, "sourceHeader">;
type TableNodeType = Node<{ label: string; source: SourceKey; columns: SchemaTable["columns"] }, "tableNode">;

// ── Custom node: source header ────────────────────────────────────────────────
function SourceHeaderNode({ data }: NodeProps<HeaderNode>) {
  const color = SOURCE_COLORS[data.source] ?? "var(--color-text-muted)";
  return (
    <div style={{
      background: color,
      color: "var(--color-bg)",
      borderRadius: "var(--radius-pill)",
      padding: "4px 14px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      boxShadow: `0 0 16px ${color}55`,
      userSelect: "none",
      pointerEvents: "none",
    }}>
      {data.label}
    </div>
  );
}

// ── Custom node: table card ───────────────────────────────────────────────────
function TableNodeComponent({ data, selected }: NodeProps<TableNodeType>) {
  const color = SOURCE_COLORS[data.source] ?? "var(--color-border)";
  return (
    <div style={{
      background: "var(--color-card)",
      border: `1.5px solid ${selected ? color : "var(--color-border)"}`,
      borderRadius: "var(--radius-md)",
      minWidth: 160,
      maxWidth: 190,
      boxShadow: selected ? `0 0 12px ${color}44` : "none",
      transition: "border-color 150ms, box-shadow 150ms",
    }}>
      <Handle type="target" position={Position.Left}  style={{ background: color, border: "none", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: "none", width: 8, height: 8 }} />
      {/* Header strip */}
      <div style={{
        background: `${color}22`,
        borderBottom: `1px solid ${color}44`,
        padding: "5px 10px",
        borderRadius: "calc(var(--radius-md) - 2px) calc(var(--radius-md) - 2px) 0 0",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}` }} />
        <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.label}
        </span>
      </div>
      {/* Column list */}
      <div style={{ padding: "6px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {data.columns.map((col) => (
          <div key={col.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontFamily: "var(--font-geist-mono, monospace)", color: col.isKey ? color : "var(--color-text-muted)", lineHeight: 1.4 }}>
            {col.isKey && <span style={{ color, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>⬦</span>}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.name}</span>
            <span style={{ color: "var(--color-text-dim)", marginLeft: "auto", flexShrink: 0 }}>{col.type.slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NODE_TYPES: NodeTypes = {
  sourceHeader: SourceHeaderNode as NodeTypes[string],
  tableNode:    TableNodeComponent as NodeTypes[string],
};

// ── Build nodes + edges from schema ──────────────────────────────────────────
function buildGraph(graph: SchemaGraph): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  SOURCE_ORDER.forEach((source, si) => {
    const x = si * LANE_WIDTH;
    const hdr: HeaderNode = {
      id: `hdr-${source}`,
      position: { x: x + 10, y: 0 },
      data: { label: source.toUpperCase(), source },
      type: "sourceHeader",
      selectable: false,
      draggable: false,
    };
    nodes.push(hdr);

    graph.tables
      .filter((t) => t.source === source)
      .forEach((table, ti) => {
        const tn: TableNodeType = {
          id: `${source}.${table.name}`,
          position: { x, y: TABLE_START_Y + ti * TABLE_GAP },
          data: { label: table.name, source, columns: table.columns },
          type: "tableNode",
        };
        nodes.push(tn);
      });
  });

  graph.joins.forEach((join: JoinCandidate) => {
    const pct = Math.round(join.confidence * 100);
    edges.push({
      id: join.id,
      source: join.tableA,
      target: join.tableB,
      label: `${join.label} · ${pct}%`,
      style: {
        stroke: "var(--color-border-strong)",
        strokeDasharray: join.label === "FK" ? undefined : "5 3",
        strokeWidth: join.confidence >= 0.95 ? 2 : 1.5,
      },
      labelStyle: { fill: "var(--color-text-dim)", fontSize: 9, fontFamily: "var(--font-geist-mono, monospace)" },
      labelBgStyle: { fill: "var(--color-card)", fillOpacity: 0.85 },
      labelBgPadding: [3, 5] as [number, number],
      animated: join.confidence >= 0.95,
    });
  });

  return { nodes, edges };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SchemaPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange]  = useEdgesState<Edge>([]);
  const [tableCount, setTableCount]       = useState(0);
  const [joinCount, setJoinCount]         = useState(0);

  useEffect(() => {
    fetch("/api/schema/graph")
      .then((r) => r.json() as Promise<{ ok: boolean; data: SchemaGraph }>)
      .then((res) => {
        if (!res.ok) return;
        const { nodes: n, edges: e } = buildGraph(res.data);
        setNodes(n);
        setEdges(e);
        setTableCount(n.filter((x) => x.type === "tableNode").length);
        setJoinCount(e.length);
      })
      .catch(() => { /* silent — demo/offline mode */ });
  }, [setNodes, setEdges]);

  const selectedTables = nodes.filter((n) => n.selected && n.type === "tableNode");

  const handleGenerateSQL = useCallback(() => {
    if (selectedTables.length < 2) return;
    const [a, b] = selectedTables;
    const aData  = a.data as { columns: SchemaTable["columns"] };
    const bData  = b.data as { columns: SchemaTable["columns"] };
    const colA   = aData.columns.find((c) => c.isKey)?.name ?? "id";
    const colB   = bData.columns.find((c) => c.isKey)?.name ?? "id";
    router.push(`/playground?join=${a.id}.${colA},${b.id}.${colB}`);
  }, [selectedTables, router]);

  return (
    <div className={cn()} style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", background: "var(--color-bg)" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>Schema Graph</span>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
            {tableCount} tables · {joinCount} joins detected
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selectedTables.length >= 2 ? (
            <button
              onClick={handleGenerateSQL}
              style={{ background: "var(--color-gold)", color: "var(--color-bg)", border: "none", borderRadius: "var(--radius-sm)", padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em" }}
            >
              Generate SQL →
            </button>
          ) : selectedTables.length === 1 ? (
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Select one more table to generate a JOIN</span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--color-text-dim)" }}>Click two tables to generate a JOIN query</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", flexShrink: 0 }}>
        {SOURCE_ORDER.map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: SOURCE_COLORS[s], boxShadow: `0 0 5px ${SOURCE_COLORS[s]}`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <LegendEdge dashed label="email join" />
          <LegendEdge dashed={false} label="FK" />
        </div>
      </div>

      {/* Flow canvas */}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: "var(--color-bg)" }}
        >
          <Background color="var(--color-border)" gap={24} size={1} style={{ opacity: 0.4 }} />
          <Controls style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }} />
        </ReactFlow>
      </div>
    </div>
  );
}

function LegendEdge({ dashed, label }: { dashed: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <svg width={28} height={8} style={{ overflow: "visible" }}>
        <line x1={0} y1={4} x2={28} y2={4} stroke="var(--color-border-strong)" strokeWidth={1.5} strokeDasharray={dashed ? "5 3" : undefined} />
      </svg>
      <span style={{ fontSize: 10, color: "var(--color-text-dim)", fontFamily: "var(--font-geist-mono, monospace)" }}>{label}</span>
    </div>
  );
}
