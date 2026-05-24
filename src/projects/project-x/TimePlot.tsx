import { useCallback } from "react";
import { PlotCanvas } from "@/components/plot/PlotCanvas";
import { windowValue, type WindowKind } from "@/lib/fft";

export interface TimePlotProps {
  ideal: Float64Array;
  sampled: Float64Array;
  sampleRate: number;
  windowKind: WindowKind;
  showWindow: boolean;
}

export function TimePlot({
  ideal,
  sampled,
  sampleRate,
  windowKind,
  showWindow,
}: TimePlotProps) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      const padL = 48;
      const padR = 16;
      const padT = 16;
      const padB = 28;
      const w = width - padL - padR;
      const h = height - padT - padB;

      const N = sampled.length;
      const durSeconds = N / sampleRate;

      let yMin = Infinity;
      let yMax = -Infinity;
      for (const v of ideal) {
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
      if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMax === yMin) {
        yMin = -1;
        yMax = 1;
      }
      const pad = (yMax - yMin) * 0.15;
      yMin -= pad;
      yMax += pad;

      const yOf = (v: number): number => padT + (1 - (v - yMin) / (yMax - yMin)) * h;
      const xOfT = (t: number): number => padL + (t / durSeconds) * w;

      // Grid
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(padL, padT, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      const xTicks = 10;
      for (let i = 1; i < xTicks; i++) {
        const x = padL + (i / xTicks) * w;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
      }
      // Zero line
      const yZero = yOf(0);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(padL, yZero);
      ctx.lineTo(padL + w, yZero);
      ctx.stroke();

      // Ideal signal
      ctx.strokeStyle = "rgba(159,188,255,0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const M = ideal.length;
      for (let i = 0; i < M; i++) {
        const t = (i / M) * durSeconds;
        const x = xOfT(t);
        const y = yOf(ideal[i] ?? 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Window envelope
      if (showWindow) {
        ctx.strokeStyle = "rgba(245,181,75,0.5)";
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const t = (i / N) * durSeconds;
          const wv = windowValue(windowKind, i, N);
          const x = xOfT(t);
          // Map [0,1] window to top half plot range relative
          const v = yMin + (yMax - yMin) * (0.5 + 0.45 * wv);
          const y = yOf(v);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Samples (stems)
      ctx.fillStyle = "#7aa2ff";
      ctx.strokeStyle = "rgba(122,162,255,0.6)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < N; i++) {
        const t = i / sampleRate;
        const x = xOfT(t);
        const v = sampled[i] ?? 0;
        const y = yOf(v);
        ctx.beginPath();
        ctx.moveTo(x, yZero);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Y axis labels
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(159,168,187,0.7)";
      ctx.textAlign = "right";
      for (let i = 0; i <= 4; i++) {
        const v = yMin + ((yMax - yMin) * i) / 4;
        const y = yOf(v);
        ctx.fillText(v.toPrecision(2), padL - 6, y + 3);
      }

      // X axis label
      ctx.textAlign = "left";
      ctx.fillText(`t = 0`, padL + 2, padT + h + 16);
      ctx.textAlign = "right";
      ctx.fillText(
        `t = ${(durSeconds * 1000).toFixed(2)} ms`,
        padL + w - 2,
        padT + h + 16,
      );
    },
    [ideal, sampled, sampleRate, windowKind, showWindow],
  );

  return <PlotCanvas draw={draw} aspect={16 / 6} ariaLabel="Sygnał w dziedzinie czasu" />;
}
