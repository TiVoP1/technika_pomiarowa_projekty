import { useEffect, useRef } from "react";

export type CanvasDrawFn = (
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number; dpr: number },
) => void;

/**
 * Set up a high-DPI canvas that auto-resizes to its parent and redraws when
 * `draw` changes. `draw` is the only dependency, so wrap it in useCallback if
 * it closes over state.
 */
export function useCanvas(draw: CanvasDrawFn): React.RefObject<HTMLCanvasElement> {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let needsResize = true;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (needsResize) {
        const rect = parent.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        needsResize = false;
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.scale(dpr, dpr);
      draw(ctx, { width: w / dpr, height: h / dpr, dpr });
    };

    const ro = new ResizeObserver(() => {
      needsResize = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    });
    ro.observe(parent);

    render();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [draw]);

  return canvasRef;
}
