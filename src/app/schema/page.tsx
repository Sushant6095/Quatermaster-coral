"use client";

/**
 * /schema — the Schema Graph (KD-5).
 *
 * Federated swimlanes of every source table with auto-detected join keys.
 * Hover a table to trace its join paths; search to spotlight; select two
 * tables to preview the federated JOIN and open it in the Playground.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
import { Search, ArrowRight, KeyRound } from "lucide-react";
import type {
  SchemaGraph,
  SchemaTable,
  JoinCandidate,
} from "@/lib/coral/schemaIndexer";
import type { SourceKey } from "@/lib/types";
import { BrandLogo } from "@/components/brand/BrandLogo";

// ── Source palette (brightened brand colors so they read on black) ────────────
interface SourceMeta {
  color: string;
  logo: string;
}
const SOURCE_META: Record<SourceKey, SourceMeta> = {
  deel: { color: "#FF6B45", logo: "deel" },
  okta: { color: "#2AA7E8", logo: "okta" },
  github: { color: "#EDEDED", logo: "github" },
  slack: { color: "#E8506E", logo: "slack" },
  stripe: { color: "#8B82FF", logo: "stripe" },
  linear: { color: "#8A92F5", logo: "linear" },
};
const SOURCE_ORDER: SourceKey[] = [
  "deel",
  "okta",
  "github",
  "slack",
  "stripe",
  "linear",
];
const LANE_WIDTH = 230;
const TABLE_START_Y = 88;
const TABLE_GAP = 132;
const ACCENT = "var(--color-accent)";

// ── Custom node: source lane header (brand logo) ──────────────────────────────
type HeaderNode = Node<{ source: SourceKey }, "sourceHeader">;
type TableNodeType = Node<
  { label: string; source: SourceKey; columns: SchemaTable["columns"] },
  "tableNode"
>;

function SourceHeaderNode({ data }: NodeProps<HeaderNode>) {
  const meta = SOURCE_META[data.source];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: "var(--color-card)",
        border: `1px solid ${meta.color}55`,
        borderRadius: "var(--radius-pill)",
        padding: "5px 13px",
        whiteSpace: "nowrap",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      <span style={{ color: meta.color, display: "flex" }}>
        <BrandLogo name={meta.logo} size={15} colored={false} />
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-text)",
        }}
      >
        {data.source}
      </span>
    </div>
  );
}

// ── Custom node: table card ───────────────────────────────────────────────────
function TableNodeComponent({ data, selected }: NodeProps<TableNodeType>) {
  const color = SOURCE_META[data.source]?.color ?? "var(--color-border)";
  return (
    <div
      style={{
        background: "var(--color-card)",
        border: `1.5px solid ${selected ? ACCENT : "var(--color-border)"}`,
        borderRadius: "var(--radius-md)",
        minWidth: 168,
        maxWidth: 196,
        boxShadow: selected
          ? "0 0 0 1px var(--color-accent), 0 0 18px rgba(46,125,246,0.25)"
          : "none",
        transition: "border-color 150ms, box-shadow 150ms",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: "none", width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: "none", width: 7, height: 7 }} />
      <div
        style={{
          background: `${color}1A`,
          borderBottom: `1px solid ${color}33`,
          padding: "5px 10px",
          borderRadius: "calc(var(--radius-md) - 2px) calc(var(--radius-md) - 2px) 0 0",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.label}
        </span>
      </div>
      <div style={{ padding: "6px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {data.columns.map((col) => (
          <div key={col.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontFamily: "var(--font-geist-mono, monospace)", color: col.isKey ? color : "var(--color-text-muted)", lineHeight: 1.45 }}>
            {col.isKey && <span style={{ color, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>◆</span>}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.name}</span>
            <span style={{ color: "var(--color-text-dim)", marginLeft: "auto", flexShrink: 0 }}>{col.type.slice(0, 3).toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NODE_TYPES: NodeTypes = {
  sourceHeader: SourceHeaderNode as NodeTypes[string],
  tableNode: TableNodeComponent as NodeTypes[string],
};

interface EdgeData {
  kind: "FK" | "email";
  confidence: number;
  [key: string]: unknown;
}

function edgeStyle(data: EdgeData, mode: "base" | "active" | "dim") {
  const dashed = data.kind !== "FK";
  if (mode === "active") return { stroke: ACCENT, strokeWidth: 2.5, opacity: 1 };
  if (mode === "dim")
    return { stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: dashed ? "5 3" : undefined, opacity: 0.08 };
  return {
    stroke: "var(--color-border-strong)",
    strokeWidth: data.confidence >= 0.95 ? 2 : 1.5,
    strokeDasharray: dashed ? "5 3" : undefined,
    opacity: 0.5,
  };
}

function buildGraph(graph: SchemaGraph): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  SOURCE_ORDER.forEach((source, si) => {
    const x = si * LANE_WIDTH;
    nodes.push({
      id: `hdr-${source}`,
      position: { x: x + 6, y: 0 },
      data: { source },
      type: "sourceHeader",
      selectable: false,
      draggable: false,
    } as HeaderNode);

    graph.tables
      .filter((t) => t.source === source)
      .forEach((table, ti) => {
        nodes.push({
          id: `${source}.${table.name}`,
          position: { x, y: TABLE_START_Y + ti * TABLE_GAP },
          data: { label: table.name, source, columns: table.columns },
          type: "tableNode",
        } as TableNodeType);
      });
  });

  graph.joins.forEach((join: JoinCandidate) => {
    const data: EdgeData = {
      kind: join.label === "FK" ? "FK" : "email",
      confidence: join.confidence,
    };
    edges.push({
      id: join.id,
      source: join.tableA,
      target: join.tableB,
      data,
      style: edgeStyle(data, "base"),
      animated: false,
    });
  });

  return { nodes, edges };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SchemaPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [graph, setGraph] = useState<SchemaGraph | null>(null);
  const [query, setQuery] = useState("");
  const queryRef = useRef("");
  const hoverRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/schema/graph")
      .then((r) => r.json() as Promise<{ ok: boolean; data: SchemaGraph }>)
      .then((res) => {
        if (!res.ok) return;
        setGraph(res.data);
        const { nodes: n, edges: e } = buildGraph(res.data);
        setNodes(n);
        setEdges(e);
      })
      .catch(() => undefined);
  }, [setNodes, setEdges]);

  /** Recompute node opacity + edge styles from current hover/search state. */
  const redecorate = useCallback(() => {
    const hover = hoverRef.current;
    const q = queryRef.current.trim().toLowerCase();
    const joins = graph?.joins ?? [];

    let active: Set<string> | null = null;
    if (hover) {
      active = new Set([hover]);
      for (const j of joins) {
        if (j.tableA === hover) active.add(j.tableB);
        if (j.tableB === hover) active.add(j.tableA);
      }
    } else if (q) {
      active = new Set(
        nodes
          .filter((n) => n.type === "tableNode" && n.id.toLowerCase().includes(q))
          .map((n) => n.id)
      );
    }

    setNodes((prev) =>
      prev.map((n) => {
        if (n.type !== "tableNode") return n;
        const on = !active || active.has(n.id);
        return { ...n, style: { ...n.style, opacity: on ? 1 : 0.18, transition: "opacity 150ms" } };
      })
    );
    setEdges((prev) =>
      prev.map((e) => {
        const data = e.data as EdgeData;
        let mode: "base" | "active" | "dim" = "base";
        if (hover) {
          mode = e.source === hover || e.target === hover ? "active" : "dim";
        } else if (q && active) {
          mode = active.has(e.source) && active.has(e.target) ? "base" : "dim";
        }
        return { ...e, style: edgeStyle(data, mode), animated: mode === "active" };
      })
    );
  }, [graph, nodes, setNodes, setEdges]);

  const onNodeMouseEnter = useCallback(
    (_: unknown, node: Node) => {
      if (node.type !== "tableNode") return;
      hoverRef.current = node.id;
      redecorate();
    },
    [redecorate]
  );
  const onNodeMouseLeave = useCallback(() => {
    hoverRef.current = null;
    redecorate();
  }, [redecorate]);

  function onSearch(value: string) {
    setQuery(value);
    queryRef.current = value;
    redecorate();
  }

  const tableById = useMemo(() => {
    const m = new Map<string, SchemaTable>();
    graph?.tables.forEach((t) => m.set(`${t.source}.${t.name}`, t));
    return m;
  }, [graph]);

  const selectedIds = nodes
    .filter((n) => n.selected && n.type === "tableNode")
    .map((n) => n.id);

  const joinBetween = useCallback(
    (a: string, b: string): JoinCandidate | undefined =>
      graph?.joins.find(
        (j) =>
          (j.tableA === a && j.tableB === b) ||
          (j.tableA === b && j.tableB === a)
      ),
    [graph]
  );

  const tableCount = nodes.filter((n) => n.type === "tableNode").length;
  const joinCount = edges.length;

  const handleGenerateSQL = useCallback(() => {
    if (selectedIds.length < 2) return;
    const [a, b] = selectedIds;
    const j = joinBetween(a, b);
    const colA = j
      ? j.tableA === a
        ? j.columnA
        : j.columnB
      : tableById.get(a)?.columns.find((c) => c.isKey)?.name ?? "id";
    const colB = j
      ? j.tableA === a
        ? j.columnB
        : j.columnA
      : tableById.get(b)?.columns.find((c) => c.isKey)?.name ?? "id";
    router.push(`/playground?join=${a}.${colA},${b}.${colB}`);
  }, [selectedIds, joinBetween, tableById, router]);

  return (
    <div className="flex h-[calc(100vh-52px)] flex-col bg-[var(--color-bg)]">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-semibold text-[var(--color-text)]">
            Schema Graph
          </span>
          <span className="hidden font-mono text-[11px] text-[var(--color-text-muted)] sm:inline">
            {tableCount} tables · {joinCount} join keys · 6 sources
          </span>
        </div>
        <div className="flex h-8 w-[200px] items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/60 px-2.5 focus-within:border-[var(--color-accent)]/60">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-dim)]" />
          <input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search tables…"
            className="w-full bg-transparent text-[12px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-dim)]"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Flow canvas */}
        <div className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            style={{ background: "var(--color-bg)" }}
          >
            <Background color="var(--color-border)" gap={24} size={1} style={{ opacity: 0.35 }} />
            <Controls style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }} />
            <MiniMap
              pannable
              zoomable
              maskColor="rgba(0,0,0,0.55)"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}
              nodeColor={(n) => {
                const src = (n.data as { source?: SourceKey })?.source;
                return src ? SOURCE_META[src].color : "var(--color-border-strong)";
              }}
            />
          </ReactFlow>
        </div>

        {/* Detail panel */}
        <DetailPanel
          selectedIds={selectedIds}
          tableById={tableById}
          joins={graph?.joins ?? []}
          joinBetween={joinBetween}
          onGenerate={handleGenerateSQL}
        />
      </div>
    </div>
  );
}

// ── Detail panel ───────────────────────────────────────────────────────────────
interface DetailPanelProps {
  selectedIds: string[];
  tableById: Map<string, SchemaTable>;
  joins: JoinCandidate[];
  joinBetween: (a: string, b: string) => JoinCandidate | undefined;
  onGenerate: () => void;
}

function DetailPanel({ selectedIds, tableById, joins, joinBetween, onGenerate }: DetailPanelProps) {
  return (
    <aside className="hidden w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
      {selectedIds.length >= 2 ? (
        <JoinPreview a={selectedIds[0]} b={selectedIds[1]} joinBetween={joinBetween} tableById={tableById} onGenerate={onGenerate} />
      ) : selectedIds.length === 1 ? (
        <TableDetail id={selectedIds[0]} tableById={tableById} joins={joins} />
      ) : (
        <EmptyDetail />
      )}
    </aside>
  );
}

function EmptyDetail() {
  return (
    <div className="flex flex-col gap-3 px-5 py-6 text-[13px] text-[var(--color-text-muted)]">
      <h3 className="text-[13px] font-semibold text-[var(--color-text)]">Inspect the schema</h3>
      <p className="leading-relaxed">
        <span className="text-[var(--color-text)]">Hover</span> a table to trace its join
        paths across sources.
      </p>
      <p className="leading-relaxed">
        <span className="text-[var(--color-text)]">Select two tables</span> to preview the
        federated JOIN and open it in the Playground.
      </p>
      <div className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/50 p-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
          <KeyRound className="h-3 w-3 text-[var(--color-accent)]" />
          <span className="font-mono">◆</span> marks an auto-detected join key.
        </div>
      </div>
    </div>
  );
}

function TableDetail({ id, tableById, joins }: { id: string; tableById: Map<string, SchemaTable>; joins: JoinCandidate[] }) {
  const table = tableById.get(id);
  if (!table) return <EmptyDetail />;
  const meta = SOURCE_META[table.source];
  const related = joins.filter((j) => j.tableA === id || j.tableB === id);

  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <span style={{ color: meta.color, display: "flex" }}>
            <BrandLogo name={meta.logo} size={16} colored={false} />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
            {table.source}
          </span>
        </div>
        <h3 className="mt-1.5 font-mono text-[16px] font-semibold text-[var(--color-text)]">
          {table.name}
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          {table.description}
        </p>
      </div>

      <div className="px-5 py-4">
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Columns ({table.columns.length})
        </h4>
        <div className="space-y-1">
          {table.columns.map((c) => (
            <div key={c.name} className="flex items-center gap-2 font-mono text-[12px]">
              {c.isKey ? (
                <span style={{ color: meta.color }}>◆</span>
              ) : (
                <span className="text-[var(--color-text-dim)]">·</span>
              )}
              <span className={c.isKey ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}>
                {c.name}
              </span>
              <span className="ml-auto text-[10px] text-[var(--color-text-dim)]">{c.type}</span>
            </div>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <div className="border-t border-[var(--color-border)] px-5 py-4">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Joins ({related.length})
          </h4>
          <div className="space-y-2">
            {related.map((j) => {
              const other = j.tableA === id ? j.tableB : j.tableA;
              const thisCol = j.tableA === id ? j.columnA : j.columnB;
              const otherCol = j.tableA === id ? j.columnB : j.columnA;
              return (
                <div key={j.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/50 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[var(--color-text)]">{other}</span>
                    <span className="rounded-full border border-[var(--color-border)] px-1.5 py-0.5 text-[9px] text-[var(--color-text-muted)]">
                      {Math.round(j.confidence * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[var(--color-text-dim)]">
                    {thisCol} = {otherCol}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function JoinPreview({
  a,
  b,
  joinBetween,
  tableById,
  onGenerate,
}: {
  a: string;
  b: string;
  joinBetween: (a: string, b: string) => JoinCandidate | undefined;
  tableById: Map<string, SchemaTable>;
  onGenerate: () => void;
}) {
  const j = joinBetween(a, b);
  const colA = j ? (j.tableA === a ? j.columnA : j.columnB) : tableById.get(a)?.columns.find((c) => c.isKey)?.name ?? "id";
  const colB = j ? (j.tableA === a ? j.columnB : j.columnA) : tableById.get(b)?.columns.find((c) => c.isKey)?.name ?? "id";
  const sql = `SELECT *\nFROM ${a}\nLEFT JOIN ${b}\n  ON LOWER(${a}.${colA})\n   = LOWER(${b}.${colB})\nLIMIT 50;`;

  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="text-[13px] font-semibold text-[var(--color-text)]">Federated JOIN</h3>
        <p className="mt-1 font-mono text-[12px] text-[var(--color-text-muted)]">
          {a} <span className="text-[var(--color-accent)]">×</span> {b}
        </p>
        {!j && (
          <p className="mt-1.5 text-[11px] text-[var(--color-warn)]">
            No auto-detected key — joining on inferred keys.
          </p>
        )}
      </div>
      <div className="px-5 py-4">
        <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] p-3 font-mono text-[11px] leading-[1.6] text-[var(--color-text)]">
          {sql}
        </pre>
        <button
          type="button"
          onClick={onGenerate}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-text)] px-4 py-2 text-[13px] font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-90"
        >
          Open in Playground
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
