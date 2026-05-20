import { useCallback } from "react";
import { PlotCanvas } from "@/components/plot/PlotCanvas";
import type { BodePoint } from "@/projects/project-iii/circuits";

export interface BodePlotProps {
  points: readonly BodePoint[];
  markerFreq: number;
}

export function BodePlot({ points, markerFreq }: BodePlotProps) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      if (points.length === 0) return;
      const padL = 60;
      const padR = 56;
      const padT = 18;
      const padB = 36;
      const w = width - padL - padR;
      const h = height - padT - padB;
      const halfH = h / 2;

      const fMin = points[0]?.f ?? 1;
      const fMax = points[points.length - 1]?.f ?? 1e6;
      const logMin = Math.log10(fMin);
      const logMax = Math.log10(fMax);

      // Magnitude in dBΩ (20 log |Z|)
      let dbMin = Infinity;
      let dbMax = -Infinity;
      for (const p of points) {
        const db = 20 * Math.log10(Math.max(p.mag, 1e-12));
        if (db < dbMin) dbMin = db;
        if (db > dbMax) dbMax = db;
      }
      if (!Number.isFinite(dbMin) || !Number.isFinite(dbMax)) return;
      const pad = Math.max(6, (dbMax - dbMin) * 0.1);
      dbMin -= pad;
      dbMax += pad;
      if (dbMax - dbMin < 1) {
        dbMax += 1;
        dbMin -= 1;
      }

      const xOf = (f: number): number =>
        padL + ((Math.log10(f) - logMin) / (logMax - logMin)) * w;
      const yMag = (db: number): number =>
        padT + (1 - (db - dbMin) / (dbMax - dbMin)) * halfH;
      const yPh = (deg: number): number =>
        padT + halfH + (1 - (deg + 90) / 180) * halfH;

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(159,168,187,0.7)";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      const decadeStart = Math.floor(logMin);
      const decadeEnd = Math.ceil(logMax);
      for (let d = decadeStart; d <= decadeEnd; d++) {
        for (let k = 1; k < 10; k++) {
          const f = k * Math.pow(10, d);
          if (f < fMin || f > fMax) continue;
          const x = xOf(f);
          ctx.strokeStyle =
            k === 1 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)";
          ctx.beginPath();
          ctx.moveTo(x, padT);
          ctx.lineTo(x, padT + h);
          ctx.stroke();
          if (k === 1) {
            ctx.fillStyle = "rgba(159,168,187,0.7)";
            ctx.textAlign = "center";
            ctx.fillText(`1e${d}`, x, padT + h + 16);
          }
        }
      }

      // Horizontal grid for magnitude
      const magTicks = 6;
      ctx.textAlign = "right";
      for (let i = 0; i <= magTicks; i++) {
        const db = dbMin + ((dbMax - dbMin) * i) / magTicks;
        const y = yMag(db);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + w, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(159,168,187,0.7)";
        ctx.fillText(`${db.toFixed(0)} dBΩ`, padL - 6, y);
      }

      // Phase grid: -90, -45, 0, 45, 90
      for (const deg of [-90, -45, 0, 45, 90]) {
        const y = yPh(deg);
        ctx.strokeStyle =
          deg === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + w, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(159,168,187,0.7)";
        ctx.textAlign = "right";
        ctx.fillText(`${deg}°`, padL - 6, y);
      }

      // Divider line
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.moveTo(padL, padT + halfH);
      ctx.lineTo(padL + w, padT + halfH);
      ctx.stroke();

      // Curves
      drawCurve(ctx, points, "#7aa2ff", (p) => yMag(20 * Math.log10(Math.max(p.mag, 1e-12))), xOf);
      drawCurve(ctx, points, "#4fd1a4", (p) => yPh(p.phase), xOf);

      // Frequency marker
      if (markerFreq >= fMin && markerFreq <= fMax) {
        const x = xOf(markerFreq);
        ctx.strokeStyle = "rgba(245,181,75,0.6)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Legends
      ctx.fillStyle = "#7aa2ff";
      ctx.textAlign = "left";
      ctx.fillText("|Z(f)|", padL + 8, padT + 6);
      ctx.fillStyle = "#4fd1a4";
      ctx.fillText("∠Z(f)", padL + 8, padT + halfH + 6);
    },
    [points, markerFreq],
  );

  return <PlotCanvas draw={draw} aspect={16 / 9} ariaLabel="Wykres Bodego" />;
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  pts: readonly BodePoint[],
  color: string,
  yOf: (p: BodePoint) => number,
  xOf: (f: number) => number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (!p) continue;
    const x = xOf(p.f);
    const y = yOf(p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Glow
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}
