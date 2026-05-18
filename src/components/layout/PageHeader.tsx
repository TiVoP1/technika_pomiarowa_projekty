import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  rightSlot?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  rightSlot,
}: PageHeaderProps) {
  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <Link
          to="/"
          className="text-ink-400 transition-colors hover:text-ink-100 focus-ring rounded"
        >
          Strona główna
        </Link>
        <span className="text-ink-500">›</span>
        <span className="text-ink-300">{eyebrow}</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-ink-50">
            {title}
          </h1>
          {lead !== undefined && (
            <p className="mt-3 text-base leading-relaxed text-ink-300">{lead}</p>
          )}
        </div>
        {rightSlot !== undefined && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </div>
  );
}
