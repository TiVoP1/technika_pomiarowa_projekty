import { useCallback } from "react";
import { PlotCanvas } from "@/components/plot/PlotCanvas";
import { quantize } from "@/projects/project-vi/sar";
import { sample, type WaveformSpec } from "@/lib/signals";

export interface QuantPlotProps {
  spec: WaveformSpec;
  vref: number;
  bits: number;
  sampleRate: number;
  durationSec: number;
}

export function QuantPlot({
  spec,
  vref,
  bits,
  sampleRate,
  durationSec,
}: QuantPlotProps) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      const padL = 40;
      const padR = 16;
      const padT = 16;
      const padB = 28;
      const w = width - padL - padR;
      const h = height - padT - padB;
      const halfH = h / 2;

      const xOf = (t: number): number => padL + (t / durationSec) * w;
      const yOf = (v: number): number => padT + (1 - v / vref) * halfH;
      const yErr = (e: number): number => {
        const lsbV = vref / ((1 << bits) - 1);
        return padT + halfH + (0.5 - e / lsbV) * halfH;
      };

      // Background grid
      ctx.fillStyle = "#04050a";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = padL + (i / 10) * w;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
      }

      // Divider between signal and error plots
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(padL, padT + halfH);
      ctx.lineTo(padL + w, padT + halfH);
      ctx.stroke();

      // Quantization levels (top half)
      const levels = 1 << bits;
      if (levels <= 64) {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        for (let i = 0; i <= levels; i++) {
          const y = yOf((i / levels) * vref);
          ctx.beginPath();
          ctx.moveTo(padL, y);
          ctx.lineTo(padL + w, y);
          ctx.stroke();
        }
      }

      // Continuous signal
      ctx.strokeStyle = "#9fbcff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const N = 800;
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * durationSec;
        const v = sample(spec, t) + vref / 2;
        const clamped = Math.max(0, Math.min(vref, v));
        const x = xOf(t);
        const y = yOf(clamped);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Quantized staircase
      const samplesCount = Math.max(2, Math.floor(durationSec * sampleRate));
      ctx.strokeStyle = "#f5b54b";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let prevX = 0;
      let prevY = 0;
      for (let i = 0; i < samplesCount; i++) {
        const t = (i / sampleRate);
        if (t > durationSec) break;
        const v = sample(spec, t) + vref / 2;
        const q = quantize(v, vref, bits);
        const x = xOf(t);
        const y = yOf(q);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, prevY);
          ctx.lineTo(x, y);
        }
        prevX = x;
        prevY = y;
      }
      // Extend last step
      ctx.lineTo(padL + w, prevY);
      void prevX;
      ctx.stroke();

      // Quantization error in lower half
      ctx.strokeStyle = "#ef5d6a";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < samplesCount; i++) {
        const t = i / sampleRate;
        if (t > durationSec) break;
        const v = sample(spec, t) + vref / 2;
        const clamped = Math.max(0, Math.min(vref, v));
        const q = quantize(v, vref, bits);
        const err = clamped - q;
        const x = xOf(t);
        const y = yErr(err);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Labels
      ctx.fillStyle = "rgba(159,168,187,0.75)";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("Sygnał i schody", padL + 8, padT + 14);
      ctx.fillText("Błąd kwantyzacji (±½ LSB)", padL + 8, padT + halfH + 14);
      ctx.textAlign = "right";
      ctx.fillText(`Vref = ${vref.toFixed(2)} V`, padL + w - 6, padT + 14);
      ctx.fillText(`fs = ${sampleRate.toFixed(0)} Hz`, padL + w - 6, padT + halfH + 14);
    },
    [spec, vref, bits, sampleRate, durationSec],
  );

  return <PlotCanvas draw={draw} aspect={16 / 7} ariaLabel="Kwantyzacja i błąd" />;
}
