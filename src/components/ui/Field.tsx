import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";
import { cn } from "@/lib/cn";

export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label: string;
  unit?: string;
  hint?: ReactNode;
  value: number;
  onValueChange: (next: number) => void;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    { label, unit, hint, value, onValueChange, className, id, ...rest },
    ref,
  ) {
    const generated = useId();
    const inputId = id ?? generated;
    return (
      <label htmlFor={inputId} className={cn("block space-y-1.5", className)}>
        <span className="eyebrow block">{label}</span>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type="number"
            value={Number.isFinite(value) ? value : ""}
            onChange={(e) => {
              const next = Number(e.target.value);
              onValueChange(Number.isFinite(next) ? next : 0);
            }}
            className={cn(
              "w-full rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 font-mono text-sm text-ink-50",
              "focus-ring focus-visible:border-accent/60",
              unit !== undefined && "pr-12",
            )}
            {...rest}
          />
          {unit !== undefined && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
              {unit}
            </span>
          )}
        </div>
        {hint !== undefined && (
          <p className="text-xs text-ink-400 leading-relaxed">{hint}</p>
        )}
      </label>
    );
  },
);

export interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  format?: (n: number) => string;
  onValueChange: (next: number) => void;
  className?: string;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  format,
  onValueChange,
  className,
}: SliderFieldProps) {
  const id = useId();
  const display = format ? format(value) : value.toString();
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="eyebrow">
          {label}
        </label>
        <span className="font-mono text-xs text-ink-200">
          {display}
          {unit !== undefined && <span className="text-ink-400"> {unit}</span>}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step ?? "any"}
        value={value}
        onChange={(e) => {
          onValueChange(Number(e.target.value));
        }}
        className="w-full"
      />
    </div>
  );
}

export interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onValueChange: (next: T) => void;
  className?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
}: SelectFieldProps<T>) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("block space-y-1.5", className)}>
      <span className="eyebrow block">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value as T);
        }}
        className="w-full rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-ink-50 focus-ring focus-visible:border-accent/60"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-ink-900">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
