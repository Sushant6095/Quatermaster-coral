"use client";

/**
 * Local-first workspaces — no backend, no auth server.
 *
 * Identity (name/email/org) and saved work (resolved/snoozed findings,
 * approved remediations, settings) live in the browser's localStorage,
 * scoped per workspace. On-brand: PII never leaves the machine.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface Workspace {
  id: string;
  name: string;
  email: string;
  org: string;
  isGuest: boolean;
  createdIso: string;
}

export interface WorkspaceData {
  resolvedFindingIds: string[];
  snoozedFindingIds: string[];
  approvedRemediationIds: string[];
  settings: Record<string, unknown>;
}

const EMPTY_DATA: WorkspaceData = {
  resolvedFindingIds: [],
  snoozedFindingIds: [],
  approvedRemediationIds: [],
  settings: {},
};

interface WorkspaceContextValue {
  /** True once localStorage has been read (avoids redirect-on-hydrate races). */
  ready: boolean;
  active: Workspace | null;
  workspaces: Workspace[];
  data: WorkspaceData;
  create: (input: { name: string; email: string; org: string }) => void;
  continueAsGuest: () => void;
  switchTo: (id: string) => void;
  signOut: () => void;
  patchData: (partial: Partial<WorkspaceData>) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}

const LS_WORKSPACES = "qm:workspaces";
const LS_ACTIVE = "qm:activeWorkspaceId";
const dataKey = (id: string) => `qm:data:${id}`;

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ws_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [data, setData] = useState<WorkspaceData>(EMPTY_DATA);

  // Hydrate from localStorage after mount (client only).
  useEffect(() => {
    const ws = readJSON<Workspace[]>(LS_WORKSPACES, []);
    const storedActive = localStorage.getItem(LS_ACTIVE);
    const validActive =
      storedActive && ws.some((w) => w.id === storedActive) ? storedActive : null;
    setWorkspaces(ws);
    setActiveId(validActive);
    setData(validActive ? readJSON<WorkspaceData>(dataKey(validActive), EMPTY_DATA) : EMPTY_DATA);
    setReady(true);
  }, []);

  const persistWorkspaces = useCallback((next: Workspace[]) => {
    setWorkspaces(next);
    try {
      localStorage.setItem(LS_WORKSPACES, JSON.stringify(next));
    } catch {
      /* storage unavailable — stay in-memory for the session */
    }
  }, []);

  const setActive = useCallback((id: string | null) => {
    setActiveId(id);
    try {
      if (id) localStorage.setItem(LS_ACTIVE, id);
      else localStorage.removeItem(LS_ACTIVE);
    } catch {
      /* ignore */
    }
    setData(id ? readJSON<WorkspaceData>(dataKey(id), EMPTY_DATA) : EMPTY_DATA);
  }, []);

  const create = useCallback(
    (input: { name: string; email: string; org: string }) => {
      const ws: Workspace = {
        id: genId(),
        name: input.name.trim() || "You",
        email: input.email.trim(),
        org: input.org.trim() || "My Workspace",
        isGuest: false,
        createdIso: new Date().toISOString(),
      };
      persistWorkspaces([...readJSON<Workspace[]>(LS_WORKSPACES, []), ws]);
      setActive(ws.id);
    },
    [persistWorkspaces, setActive]
  );

  const continueAsGuest = useCallback(() => {
    const existing = readJSON<Workspace[]>(LS_WORKSPACES, []);
    const guest = existing.find((w) => w.isGuest);
    if (guest) {
      setActive(guest.id);
      return;
    }
    const ws: Workspace = {
      id: genId(),
      name: "Guest",
      email: "guest@quartermaster.local",
      org: "Demo Workspace",
      isGuest: true,
      createdIso: new Date().toISOString(),
    };
    persistWorkspaces([...existing, ws]);
    setActive(ws.id);
  }, [persistWorkspaces, setActive]);

  const switchTo = useCallback((id: string) => setActive(id), [setActive]);
  const signOut = useCallback(() => setActive(null), [setActive]);

  const patchData = useCallback(
    (partial: Partial<WorkspaceData>) => {
      if (!activeId) return;
      setData((prev) => {
        const next = { ...prev, ...partial };
        try {
          localStorage.setItem(dataKey(activeId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [activeId]
  );

  const active = workspaces.find((w) => w.id === activeId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        ready,
        active,
        workspaces,
        data,
        create,
        continueAsGuest,
        switchTo,
        signOut,
        patchData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
