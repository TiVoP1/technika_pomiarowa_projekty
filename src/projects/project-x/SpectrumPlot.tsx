import { useCallback } from "react";
import { PlotCanvas } from "@/components/plot/PlotCanvas";
import { magToDb } from "@/projects/project-x/spectrum";

export interface SpectrumPlotProps {
  freq: Float64Array;
  mag: Float64Array;
  sampleRate: number;
  expectedLines: readonly { f: number; label: string }[];
  scale: "linear" | "db";
}

export function SpectrumPlot({
  freq,
  mag,
  sampleRate,
  expectedLines,
  scale,
}: SpectrumPlotProps) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      const padL = 56;
      const padR = 24;
      const padT = 16;
      const padB = 32;
      const w = width - padL - padR;
      const h = height - padT - padB;
      const fMax = sampleRate / 2;

      let yMin: number;
      let yMax: number;
      if (scale === "db") {
        yMin = -120;
        let peak = 1e-12;
        for (const m of mag) {
          if (m > peak) peak = m;
        }
        const peakDb = 20 * Math.log10(peak);
        yMax = Math.ceil((peakDb + 6) / 10) * 10;
      } else {
        yMin = 0;
        let peak = 0;
        for (const m of mag) {
          if (m > peak) peak = m;
        }
        yMax = Math.max(peak * 1.15, 0.01);
      }

      const xOf = (f: number): number => padL + (f / fMax) * w;
      const yOf = (m: number): number => {
        const v = scale === "db" ? magToDb(m, 1) : m;
        return padT + (1 - (v - yMin) / (yMax - yMin)) * h;
      };

      // Grid
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(padL, padT, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      const xTicks = 10;
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(159,168,187,0.7)";
      ctx.textAlign = "center";
      for (let i = 0; i <= xTicks; i++) {
        const f = (i / xTicks) * fMax;
        const x = xOf(f);
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
        ctx.fillText(prettyFreq(f), x, padT + h + 16);
      }
      const yTicks = 6;
      ctx.textAlign = "right";
      for (let i = 0; i <= yTicks; i++) {
        const v = yMin + ((yMax - yMin) * i) / yTicks;
        const y = padT + (1 - (v - yMin) / (yMax - yMin)) * h;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + w, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(159,168,187,0.7)";
        const lbl = scale === "db" ? `${v.toFixed(0)} dB` : v.toPrecision(2);
        ctx.fillText(lbl, padL - 6, y + 3);
      }

      // Expected lines (where ideal Fourier line would be)
      for (const line of expectedLines) {
        const fAlias = aliasInto(line.f, sampleRate);
        const x = xOf(fAlias);
        if (x < padL || x > padL + w) continue;
        ctx.strokeStyle = "rgba(245,181,75,0.6)";
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#f5b54b";
        ctx.textAlign = "left";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.fillText(`${line.label} → ${prettyFreq(fAlias)}`, x + 4, padT + 12);
      }

      // Spectrum
      ctx.strokeStyle = "#7aa2ff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < mag.length; i++) {
        const x = xOf(freq[i] ?? 0);
        const y = yOf(mag[i] ?? 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Fill under curve
      ctx.lineTo(padL + w, padT + h);
      ctx.lineTo(padL, padT + h);
      ctx.closePath();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#7aa2ff";
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    [freq, mag, sampleRate, expectedLines, scale],
  );

  return <PlotCanvas draw={draw} aspect={16 / 8} ariaLabel="Widmo amplitudowe" />;
}

function prettyFreq(f: number): string {
  if (f >= 1000) return `${(f / 1000).toFixed(1)} kHz`;
  return `${f.toFixed(0)} Hz`;
}

function aliasInto(f: number, fs: number): number {
  const half = fs / 2;
  const remainder = ((f % fs) + fs) % fs;
  if (remainder <= half) return remainder;
  return fs - remainder;
}
