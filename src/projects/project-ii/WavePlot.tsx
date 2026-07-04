import { useCallback } from "react";
import { PlotCanvas } from "@/components/plot/PlotCanvas";
import { sample, type WaveformSpec } from "@/lib/signals";

const PERIODS = 2;
const POINTS = 1200;

export interface WavePlotProps {
  spec: WaveformSpec;
  mode: "signal" | "squared";
  mean: number;
  rmsTotal: number;
}

export function WavePlot({ spec, mode, mean, rmsTotal }: WavePlotProps) {
  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      { width, height }: { width: number; height: number },
    ) => {
      const padL = 56;
      const padR = 16;
      const padT = 14;
      const padB = 26;
      const w = width - padL - padR;
      const h = height - padT - padB;

      // Frequency forced to 1, so t in seconds = t in periods
      const unitSpec: WaveformSpec = { ...spec, frequency: 1 };
      const values = new Float64Array(POINTS);
      for (let i = 0; i < POINTS; i++) {
        const t = (i / (POINTS - 1)) * PERIODS;
        const v = sample(unitSpec, t);
        values[i] = mode === "squared" ? v * v : v;
      }

      const meanLevel = mode === "squared" ? rmsTotal * rmsTotal : mean;
      const guides =
        mode === "squared" ? [meanLevel] : [meanLevel, rmsTotal, -rmsTotal];

      let yMin = mode === "squared" ? 0 : Infinity;
      let yMax = -Infinity;
      for (const v of values) {
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
      for (const g of guides) {
        if (g < yMin) yMin = g;
        if (g > yMax) yMax = g;
      }
      if (mode === "signal") {
        if (yMin > 0) yMin = 0;
        if (yMax < 0) yMax = 0;
      }
      if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMax === yMin) {
        yMin = -1;
        yMax = 1;
      }
      const padY = (yMax - yMin) * 0.12;
      yMin -= padY;
      yMax += padY;

      const yOf = (v: number): number =>
        padT + (1 - (v - yMin) / (yMax - yMin)) * h;
      const xOf = (i: number): number => padL + (i / (POINTS - 1)) * w;

      // Grid
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(padL, padT, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 1; i < PERIODS * 4; i++) {
        const x = padL + (i / (PERIODS * 4)) * w;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
      }
      // Period boundaries
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.setLineDash([2, 4]);
      for (let i = 1; i < PERIODS; i++) {
        const x = padL + (i / PERIODS) * w;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Zero line
      if (yMin < 0 && yMax > 0) {
        const yZero = yOf(0);
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.beginPath();
        ctx.moveTo(padL, yZero);
        ctx.lineTo(padL + w, yZero);
        ctx.stroke();
      }

      // Fill under x²(t)
      if (mode === "squared") {
        const yBase = yOf(Math.max(0, yMin));
        ctx.fillStyle = "rgba(122,162,255,0.12)";
        ctx.beginPath();
        ctx.moveTo(xOf(0), yBase);
        for (let i = 0; i < POINTS; i++) {
          ctx.lineTo(xOf(i), yOf(values[i] ?? 0));
        }
        ctx.lineTo(xOf(POINTS - 1), yBase);
        ctx.closePath();
        ctx.fill();
      }

      // Waveform
      ctx.strokeStyle = "#7aa2ff";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < POINTS; i++) {
        const x = xOf(i);
        const y = yOf(values[i] ?? 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.font = "10px 'JetBrains Mono', monospace";

      const drawGuide = (
        level: number,
        color: string,
        label: string,
        dash: number[],
      ) => {
        const y = yOf(level);
        ctx.strokeStyle = color;
        ctx.setLineDash(dash);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + w, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.textAlign = "right";
        ctx.fillText(label, padL + w - 4, y - 4);
      };

      if (mode === "signal") {
        drawGuide(rmsTotal, "rgba(79,209,164,0.9)", "+X (RMS)", [6, 4]);
        drawGuide(-rmsTotal, "rgba(79,209,164,0.55)", "−X (RMS)", [6, 4]);
        drawGuide(mean, "rgba(245,181,75,0.9)", "X₀ (średnia)", [2, 3]);
      } else {
        drawGuide(
          rmsTotal * rmsTotal,
          "rgba(79,209,164,0.9)",
          "X² = średnia x²(t)",
          [6, 4],
        );
      }

      // Y axis labels
      ctx.fillStyle = "rgba(159,168,187,0.7)";
      ctx.textAlign = "right";
      for (let i = 0; i <= 4; i++) {
        const v = yMin + ((yMax - yMin) * i) / 4;
        ctx.fillText(v.toPrecision(2), padL - 6, yOf(v) + 3);
      }

      // X axis labels in periods
      ctx.textAlign = "left";
      ctx.fillText("t = 0", padL + 2, padT + h + 16);
      ctx.textAlign = "center";
      for (let i = 1; i < PERIODS; i++) {
        ctx.fillText(`${i}T`, padL + (i / PERIODS) * w, padT + h + 16);
      }
      ctx.textAlign = "right";
      ctx.fillText(`${PERIODS}T`, padL + w - 2, padT + h + 16);
    },
    [spec, mode, mean, rmsTotal],
  );

  return (
    <PlotCanvas
      draw={draw}
      aspect={16 / 6}
      ariaLabel={
        mode === "squared" ? "Kwadrat sygnału x²(t)" : "Przebieg sygnału x(t)"
      }
    />
  );
}
