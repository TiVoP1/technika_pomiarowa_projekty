import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 select-none whitespace-nowrap focus-ring disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-ink-950 hover:bg-accent-soft active:translate-y-px shadow-[0_8px_24px_-12px_rgba(122,162,255,0.6)]",
  secondary:
    "bg-white/5 text-ink-100 border border-white/10 hover:bg-white/10 hover:border-white/15",
  ghost: "bg-transparent text-ink-300 hover:bg-white/5 hover:text-ink-100",
  danger: "bg-err/90 text-white hover:bg-err",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    iconLeft,
    iconRight,
    fullWidth,
    className,
    type = "button",
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth === true && "w-full",
        className,
      )}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
});
