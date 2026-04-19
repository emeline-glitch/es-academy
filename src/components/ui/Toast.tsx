"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback<ToastContextValue["show"]>((kind, message, opts) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message, action: opts?.action }]);
    const duration = opts?.durationMs ?? (kind === "error" ? 6000 : 3500);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const ctx: ToastContextValue = {
    show,
    success: (m, o) => show("success", m, o),
    error: (m, o) => show("error", m, o),
    info: (m, o) => show("info", m, o),
  };

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

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback hors provider (log only)
    return {
      show: (kind, msg) => console[kind === "error" ? "error" : "log"](msg),
      success: (msg) => console.log(msg),
      error: (msg) => console.error(msg),
      info: (msg) => console.log(msg),
    };
  }
  return ctx;
}
