import { useCallback } from "react";
import { PlotCanvas } from "@/components/plot/PlotCanvas";
import {
  SCOPE_DIVS_X,
  SCOPE_DIVS_Y,
  type AcquiredFrame,
  type ScopeChannel,
  type TriggerSettings,
} from "@/projects/project-vii/scope";

export interface ScopeScreenProps {
  frame: AcquiredFrame;
  channels: readonly ScopeChannel[];
  trigger: TriggerSettings;
  tDiv: number;
}

export function ScopeScreen({
  frame,
  channels,
  trigger,
  tDiv,
}: ScopeScreenProps) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      const pad = 24;
      const w = width - pad * 2;
      const h = height - pad * 2;
      const cx = pad + w / 2;
      const cy = pad + h / 2;
      const divW = w / SCOPE_DIVS_X;
      const divH = h / SCOPE_DIVS_Y;

      // Screen background with phosphor gradient
      const grad = ctx.createRadialGradient(
        cx,
        cy,
        20,
        cx,
        cy,
        Math.max(w, h) / 1.6,
      );
      grad.addColorStop(0, "#0b1322");
      grad.addColorStop(1, "#04050a");
      ctx.fillStyle = grad;
      ctx.fillRect(pad, pad, w, h);

      // Outer border
      ctx.strokeStyle = "rgba(122,162,255,0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(pad, pad, w, h);

      // Reticule
      ctx.strokeStyle = "rgba(122,162,255,0.18)";
      ctx.beginPath();
      for (let i = 1; i < SCOPE_DIVS_X; i++) {
        const x = pad + i * divW;
        ctx.moveTo(x, pad);
        ctx.lineTo(x, pad + h);
      }
      for (let j = 1; j < SCOPE_DIVS_Y; j++) {
        const y = pad + j * divH;
        ctx.moveTo(pad, y);
        ctx.lineTo(pad + w, y);
      }
      ctx.stroke();

      // Centre tick marks
      ctx.strokeStyle = "rgba(122,162,255,0.45)";
      // Horizontal centre with sub-ticks
      const yc = pad + h / 2;
      const xc = pad + w / 2;
      ctx.beginPath();
      ctx.moveTo(pad, yc);
      ctx.lineTo(pad + w, yc);
      ctx.moveTo(xc, pad);
      ctx.lineTo(xc, pad + h);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= SCOPE_DIVS_X * 5; i++) {
        const x = pad + (i / (SCOPE_DIVS_X * 5)) * w;
        ctx.moveTo(x, yc - 3);
        ctx.lineTo(x, yc + 3);
      }
      for (let j = 0; j <= SCOPE_DIVS_Y * 5; j++) {
        const y = pad + (j / (SCOPE_DIVS_Y * 5)) * h;
        ctx.moveTo(xc - 3, y);
        ctx.lineTo(xc + 3, y);
      }
      ctx.stroke();

      // Trigger level line
      const trigCh = channels.find((c) => c.id === trigger.source && c.enabled);
      if (trigCh) {
        const yTrig =
          cy - ((trigger.level - trigCh.offset) / trigCh.vDiv) * divH;
        if (yTrig >= pad && yTrig <= pad + h) {
          ctx.strokeStyle = "rgba(245,181,75,0.7)";
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(pad, yTrig);
          ctx.lineTo(pad + w, yTrig);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#f5b54b";
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.textAlign = "left";
          ctx.fillText(`T ${trigger.source}`, pad + 4, yTrig - 4);
        }
      }

      // Trigger point indicator
      const xTrig = pad + (frame.triggerIndex / frame.samplesPerCh) * w;
      ctx.fillStyle = "#f5b54b";
      ctx.beginPath();
      ctx.moveTo(xTrig, pad - 1);
      ctx.lineTo(xTrig - 5, pad - 9);
      ctx.lineTo(xTrig + 5, pad - 9);
      ctx.closePath();
      ctx.fill();

      // Traces
      const n = frame.samplesPerCh;
      channels.forEach((ch, ci) => {
        if (!ch.enabled) return;
        const series = frame.data[ci];
        if (!series) return;
        // Glow
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.18;
        traceLine(ctx, series, n, pad, w, cy, divH, ch);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.6;
        traceLine(ctx, series, n, pad, w, cy, divH, ch);

        // Zero indicator
        const yZero = cy - (-ch.offset / ch.vDiv) * divH;
        if (yZero >= pad && yZero <= pad + h) {
          ctx.fillStyle = ch.color;
          ctx.beginPath();
          ctx.moveTo(pad - 6, yZero);
          ctx.lineTo(pad, yZero - 5);
          ctx.lineTo(pad, yZero + 5);
          ctx.closePath();
          ctx.fill();
          ctx.font = "10px 'JetBrains Mono', monospace";
          ctx.fillText(ch.id, pad - 16, yZero + 3);
        }
      });

      // HUD: time/div and trigger status
      ctx.fillStyle = "rgba(159,168,187,0.85)";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `${prettyTime(tDiv)} / dz`,
        pad + 6,
        pad + h - 8,
      );
      ctx.textAlign = "right";
      ctx.fillStyle = frame.triggerFound ? "#4fd1a4" : "#f5b54b";
      ctx.fillText(
        frame.triggerFound ? "TRIG OK" : "AUTO",
        pad + w - 6,
        pad + h - 8,
      );
    },
    [frame, channels, trigger, tDiv],
  );

  return <PlotCanvas draw={draw} aspect={16 / 9} ariaLabel="Ekran oscyloskopu" />;
}

function traceLine(
  ctx: CanvasRenderingContext2D,
  series: Float64Array,
  n: number,
  pad: number,
  w: number,
  cy: number,
  divH: number,
  ch: ScopeChannel,
): void {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = pad + (i / (n - 1)) * w;
    const y = cy - (((series[i] ?? 0) - ch.offset) / ch.vDiv) * divH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function prettyTime(t: number): string {
  if (t >= 1) return `${t.toFixed(2)} s`;
  if (t >= 1e-3) return `${(t * 1e3).toFixed(2)} ms`;
  if (t >= 1e-6) return `${(t * 1e6).toFixed(2)} µs`;
  return `${(t * 1e9).toFixed(0)} ns`;
}
