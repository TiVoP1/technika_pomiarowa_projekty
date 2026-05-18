import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Prose({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "max-w-prose space-y-3 text-[0.95rem] leading-relaxed text-ink-200",
        "[&_strong]:text-ink-50 [&_strong]:font-semibold",
        "[&_code]:rounded [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-accent-soft",
        "[&_p]:leading-relaxed",
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5",
        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5",
        "[&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-serif [&_h3]:text-ink-50",
        className,
      )}
      {...rest}
    />
  );
}
