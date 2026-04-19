import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({ icon = "📭", title, description, actionLabel, actionHref, onAction, children }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">{description}</p>}
      {actionLabel &&
        (actionHref ? (
          <Link href={actionHref} className="inline-flex bg-es-green text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-es-green-light">
            {actionLabel}
          </Link>
        ) : (
          <button onClick={onAction} className="bg-es-green text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-es-green-light">
            {actionLabel}
          </button>
        ))}
      {children}
    </div>
  );
}
