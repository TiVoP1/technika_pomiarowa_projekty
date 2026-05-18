import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
}

export function Card({
  title,
  eyebrow,
  description,
  action,
  padded = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <section className={cn("surface", padded && "p-6", className)} {...rest}>
      {(title !== undefined || eyebrow !== undefined || action !== undefined) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {eyebrow !== undefined && <div className="eyebrow">{eyebrow}</div>}
            {title !== undefined && (
              <h2 className="text-xl font-serif font-semibold text-ink-50">{title}</h2>
            )}
            {description !== undefined && (
              <p className="text-sm text-ink-300 leading-relaxed">{description}</p>
            )}
          </div>
          {action !== undefined && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
