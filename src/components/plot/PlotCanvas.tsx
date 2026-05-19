import { useCallback } from "react";
import { useCanvas, type CanvasDrawFn } from "@/lib/useCanvas";
import { cn } from "@/lib/cn";

export interface PlotCanvasProps {
  draw: CanvasDrawFn;
  aspect?: number;
  className?: string;
  ariaLabel?: string;
}

export function PlotCanvas({
  draw,
  aspect = 16 / 9,
  className,
  ariaLabel,
}: PlotCanvasProps) {
  const stableDraw = useCallback(draw, [draw]);
  const canvasRef = useCanvas(stableDraw);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/5 bg-ink-950/70",
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel ?? "Wykres"}
        className="block h-full w-full"
      />
    </div>
  );
}
