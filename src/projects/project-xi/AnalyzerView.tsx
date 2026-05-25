import { useCallback } from "react";
import { PlotCanvas } from "@/components/plot/PlotCanvas";
import type { AnalyzerSnapshot } from "@/projects/project-xi/analyzer";

export function ScopeView({ snap }: { snap: AnalyzerSnapshot }) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      const padL = 32;
      const padR = 16;
      const padT = 16;
      const padB = 24;
      const w = width - padL - padR;
      const h = height - padT - padB;

      ctx.fillStyle = "#04050a";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(122,162,255,0.12)";
      for (let i = 0; i <= 10; i++) {
        const x = padL + (i / 10) * w;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
      }
      const yCenter = padT + h / 2;
      for (let j = 0; j <= 8; j++) {
        const y = padT + (j / 8) * h;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + w, y);
        ctx.stroke();
      }

      const n = snap.time.length;
      ctx.strokeStyle = "#7aa2ff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const halfH = h / 2 * 0.9;
      for (let i = 0; i < n; i++) {
        const x = padL + (i / (n - 1)) * w;
        const y = yCenter - (snap.time[i] ?? 0) * halfH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Axes labels
      ctx.fillStyle = "rgba(159,168,187,0.7)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText("+1", padL - 4, padT + 12);
      ctx.fillText("0", padL - 4, yCenter + 3);
      ctx.fillText("−1", padL - 4, padT + h - 4);
      ctx.textAlign = "left";
      ctx.fillText("0 ms", padL + 2, padT + h + 14);
      ctx.textAlign = "right";
      const duration = (n / snap.sampleRate) * 1000;
      ctx.fillText(`${duration.toFixed(1)} ms`, padL + w - 2, padT + h + 14);
    },
    [snap],
  );
  return <PlotCanvas draw={draw} aspect={16 / 6} ariaLabel="Sygnał z mikrofonu w czasie" />;
}

export function SpectrumView({ snap }: { snap: AnalyzerSnapshot }) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      const padL = 44;
      const padR = 16;
      const padT = 16;
      const padB = 26;
      const w = width - padL - padR;
      const h = height - padT - padB;
      const fMax = snap.sampleRate / 2;
      const dbMin = -100;
      const dbMax = 0;

      ctx.fillStyle = "#04050a";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let i = 1; i < 10; i++) {
        const x = padL + (i / 10) * w;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
      }
      for (let i = 1; i < 5; i++) {
        const y = padT + (i / 5) * h;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + w, y);
        ctx.stroke();
      }

      // Bars
      const n = snap.freqDb.length;
      const grad = ctx.createLinearGradient(0, padT, 0, padT + h);
      grad.addColorStop(0, "#7aa2ff");
      grad.addColorStop(1, "#3c5bb8");
      ctx.fillStyle = grad;
      for (let i = 0; i < n; i++) {
        const f = (i * snap.sampleRate) / snap.fftSize;
        if (f > fMax) break;
        const x = padL + (f / fMax) * w;
        const db = snap.freqDb[i] ?? -240;
        const v = Math.max(dbMin, Math.min(dbMax, db));
        const yTop = padT + (1 - (v - dbMin) / (dbMax - dbMin)) * h;
        const bw = Math.max(1, w / n);
        ctx.fillRect(x, yTop, bw, padT + h - yTop);
      }

      // Fundamental marker
      if (snap.fundamentalHz !== null) {
        const x = padL + (snap.fundamentalHz / fMax) * w;
        ctx.strokeStyle = "rgba(245,181,75,0.7)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#f5b54b";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`f₀ = ${snap.fundamentalHz.toFixed(1)} Hz`, x + 4, padT + 14);
      }

      // Axis labels
      ctx.fillStyle = "rgba(159,168,187,0.7)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      for (let i = 0; i <= 5; i++) {
        const v = dbMin + ((dbMax - dbMin) * i) / 5;
        const y = padT + (1 - (v - dbMin) / (dbMax - dbMin)) * h;
        ctx.fillText(`${v.toFixed(0)} dB`, padL - 4, y + 3);
      }
      ctx.textAlign = "center";
      for (let i = 0; i <= 5; i++) {
        const f = (i / 5) * fMax;
        const x = padL + (f / fMax) * w;
        ctx.fillText(prettyHz(f), x, padT + h + 14);
      }
    },
    [snap],
  );
  return <PlotCanvas draw={draw} aspect={16 / 7} ariaLabel="Widmo audio" />;
}

function prettyHz(f: number): string {
  if (f >= 1000) return `${(f / 1000).toFixed(1)} kHz`;
  return `${f.toFixed(0)} Hz`;
}
