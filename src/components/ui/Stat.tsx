import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  emphasis?: "neutral" | "accent" | "ok" | "warn" | "err";
  /** When true, reserve a fixed line of vertical space for the hint even
   *  if no hint is provided. Default true this stops layout jitter when
   *  values toggle between "has hint" and "no hint" between frames. */
  reserveHint?: boolean;
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
  reserveHint = true,
  className,
}: StatProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-white/5 bg-ink-900/40 p-4 transition-colors hover:border-white/10",
        className,
      )}
    >
      <div className="eyebrow">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={cn(
            "truncate font-mono text-2xl tracking-tight tabular-nums",
            emphasisMap[emphasis],
          )}
        >
          {value}
        </span>
        {unit !== undefined && (
          <span className="text-xs text-ink-400">{unit}</span>
        )}
      </div>
      {hint !== undefined ? (
        <p className="mt-1 min-h-[1rem] text-xs leading-tight text-ink-400">
          {hint}
        </p>
      ) : reserveHint ? (
        <p className="mt-1 min-h-[1rem] text-xs leading-tight" aria-hidden>
          {" "}
        </p>
      ) : null}
    </div>
  );
}
