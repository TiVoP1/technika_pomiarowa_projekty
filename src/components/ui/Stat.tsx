import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  emphasis?: "neutral" | "accent" | "ok" | "warn" | "err";
  className?: string;
}

const emphasisMap: Record<NonNullable<StatProps["emphasis"]>, string> = {
  neutral: "text-ink-50",
  accent: "text-accent",
  ok: "text-ok",
  warn: "text-warn",
  err: "text-err",
};

export function Stat({
  label,
  value,
  unit,
  hint,
  emphasis = "neutral",
  className,
}: StatProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/5 bg-ink-900/40 p-4 transition-colors hover:border-white/10",
        className,
      )}
    >
      <div className="eyebrow">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("font-mono text-2xl tracking-tight", emphasisMap[emphasis])}>
          {value}
        </span>
        {unit !== undefined && (
          <span className="text-xs text-ink-400">{unit}</span>
        )}
      </div>
      {hint !== undefined && (
        <p className="mt-1 text-xs text-ink-400 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}
