import { useCallback } from "react";
import { PlotCanvas } from "@/components/plot/PlotCanvas";
import type { ErrorBreakdown } from "@/projects/project-viii/errors";

export interface ErrorBarsProps {
  breakdown: ErrorBreakdown;
  unit: string;
}

export function ErrorBars({ breakdown, unit }: ErrorBarsProps) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      const padL = 60;
      const padR = 60;
      const padT = 30;
      const padB = 40;
      const w = width - padL - padR;
      const h = height - padT - padB;

      // Domain centred on reading, with margins of ±3·error
      const half = Math.max(breakdown.absoluteError * 4, breakdown.range * 0.005, 1e-12);
      const xMin = breakdown.reading - half;
      const xMax = breakdown.reading + half;
      const xOf = (v: number): number => padL + ((v - xMin) / (xMax - xMin)) * w;

      // Background
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(padL, padT, w, h);

      // ± error band
      const yReading = padT + h * 0.45;
      ctx.fillStyle = "rgba(245,181,75,0.18)";
      ctx.fillRect(
        xOf(breakdown.intervalLow),
        padT + 10,
        xOf(breakdown.intervalHigh) - xOf(breakdown.intervalLow),
        h - 20,
      );

      // Reading line
      ctx.strokeStyle = "rgba(122,162,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xOf(breakdown.reading), padT + 6);
      ctx.lineTo(xOf(breakdown.reading), padT + h - 6);
      ctx.stroke();

      // Interval edges
      ctx.strokeStyle = "rgba(245,181,75,0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xOf(breakdown.intervalLow), padT + 6);
      ctx.lineTo(xOf(breakdown.intervalLow), padT + h - 6);
      ctx.moveTo(xOf(breakdown.intervalHigh), padT + 6);
      ctx.lineTo(xOf(breakdown.intervalHigh), padT + h - 6);
      ctx.stroke();

      // Whiskers
      ctx.strokeStyle = "#f5b54b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xOf(breakdown.intervalLow), yReading);
      ctx.lineTo(xOf(breakdown.intervalHigh), yReading);
      ctx.stroke();

      // Labels
      ctx.fillStyle = "#7aa2ff";
      ctx.font = "12px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `${breakdown.reading.toPrecision(6)} ${unit}`,
        xOf(breakdown.reading),
        padT - 8,
      );
      ctx.fillStyle = "#f5b54b";
      ctx.fillText(
        `−${breakdown.absoluteError.toPrecision(3)}`,
        xOf(breakdown.intervalLow),
        padT + h + 16,
      );
      ctx.fillText(
        `+${breakdown.absoluteError.toPrecision(3)}`,
        xOf(breakdown.intervalHigh),
        padT + h + 16,
      );

      // Axis ticks
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(padL, padT + h - 1);
      ctx.lineTo(padL + w, padT + h - 1);
      ctx.stroke();
      ctx.fillStyle = "rgba(159,168,187,0.7)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      const ticks = 5;
      for (let i = 0; i <= ticks; i++) {
        const v = xMin + ((xMax - xMin) * i) / ticks;
        const x = xOf(v);
        ctx.beginPath();
        ctx.moveTo(x, padT + h - 1);
        ctx.lineTo(x, padT + h + 4);
        ctx.stroke();
        ctx.fillText(v.toPrecision(4), x, padT + h + 16);
      }

      // Component bars: reading / range / digits stacked horizontally above
      drawComponentBar(
        ctx,
        padL,
        padT - 16,
        w,
        breakdown,
      );
    },
    [breakdown, unit],
  );

  return <PlotCanvas draw={draw} aspect={16 / 6} ariaLabel="Przedział błędu" />;
}

function drawComponentBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  breakdown: ErrorBreakdown,
): void {
  const total = breakdown.absoluteError || 1;
  const segments: readonly { frac: number; color: string }[] = [
    { frac: breakdown.termReading / total, color: "#7aa2ff" },
    { frac: breakdown.termRange / total, color: "#4fd1a4" },
    { frac: breakdown.termDigits / total, color: "#ef5d6a" },
  ];
  let cursor = x;
  for (const s of segments) {
    const sw = s.frac * w;
    ctx.fillStyle = s.color;
    ctx.fillRect(cursor, y - 6, sw, 4);
    cursor += sw;
  }
}
