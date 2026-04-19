"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  show: (kind: ToastKind, message: string, opts?: { action?: ToastItem["action"]; durationMs?: number }) => void;
  success: (message: string, opts?: { action?: ToastItem["action"]; durationMs?: number }) => void;
  error: (message: string, opts?: { action?: ToastItem["action"]; durationMs?: number }) => void;
  info: (message: string, opts?: { action?: ToastItem["action"]; durationMs?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Anti-spam : dédupliquer les messages identiques affichés dans les 2 dernières secondes
const DEDUPE_WINDOW_MS = 2000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const recentRef = useRef<Map<string, number>>(new Map());

  const show = useCallback<ToastContextValue["show"]>((kind, message, opts) => {
    const key = `${kind}::${message}`;
    const now = Date.now();
    const last = recentRef.current.get(key);
    if (last && now - last < DEDUPE_WINDOW_MS) {
      // Silently swallow duplicate
      return;
    }
    recentRef.current.set(key, now);

    const id = now + Math.random();
    setItems((prev) => [...prev, { id, kind, message, action: opts?.action }]);
    const duration = opts?.durationMs ?? (kind === "error" ? 6000 : 3500);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const success = useCallback<ToastContextValue["success"]>((m, o) => show("success", m, o), [show]);
  const error = useCallback<ToastContextValue["error"]>((m, o) => show("error", m, o), [show]);
  const info = useCallback<ToastContextValue["info"]>((m, o) => show("info", m, o), [show]);

  // ctx stable : tous les callbacks sont memoizés, le ctx ne change jamais après mount
  const ctx = useMemo<ToastContextValue>(() => ({ show, success, error, info }), [show, success, error, info]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {items.map((t) => (
          <ToastCard key={t.id} item={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);
  const colors: Record<ToastKind, string> = {
    success: "bg-green-600 border-green-700",
    error: "bg-red-600 border-red-700",
    info: "bg-es-green border-es-green-dark",
  };
  const icons: Record<ToastKind, string> = { success: "✅", error: "⚠️", info: "ℹ️" };
  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 text-white rounded-xl shadow-xl px-4 py-3 max-w-md transition-all duration-200 ${colors[item.kind]} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <span className="shrink-0">{icons[item.kind]}</span>
      <span className="text-sm flex-1">{item.message}</span>
      {item.action && (
        <button
          onClick={item.action.onClick}
          className="text-xs font-semibold underline-offset-2 hover:underline shrink-0"
        >
          {item.action.label}
        </button>
      )}
    </div>
  );
}

// Fallback stable hors provider (si un composant rend dans un arbre sans ToastProvider)
const FALLBACK_CTX: ToastContextValue = {
  show: (kind, msg) => {
    if (kind === "error") console.error(msg);
    else console.log(msg);
  },
  success: (msg) => console.log("[toast]", msg),
  error: (msg) => console.error("[toast]", msg),
  info: (msg) => console.log("[toast]", msg),
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return ctx ?? FALLBACK_CTX;
}
