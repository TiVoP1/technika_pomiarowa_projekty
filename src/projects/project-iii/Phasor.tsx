import { useCallback } from "react";
import { PlotCanvas } from "@/components/plot/PlotCanvas";
import { cMag } from "@/lib/complex";
import type { Complex } from "@/lib/complex";

export interface PhasorProps {
  z: Complex;
}

/**
 * Draws Z = R + jX on the complex plane, plus the |Z| circle and phase arc.
 */
export function PhasorView({ z }: PhasorProps) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      const mag = cMag(z);
      const cx = width / 2;
      const cy = height / 2;
      const margin = 28;
      const maxComponent = Math.max(Math.abs(z.re), Math.abs(z.im), mag) || 1;
      const scale = (Math.min(width, height) / 2 - margin) / maxComponent;

      // Grid axes
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      // Concentric circles
      for (let r = maxComponent / 4; r <= maxComponent; r += maxComponent / 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Axes
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(margin, cy);
      ctx.lineTo(width - margin, cy);
      ctx.moveTo(cx, margin);
      ctx.lineTo(cx, height - margin);
      ctx.stroke();

      ctx.fillStyle = "rgba(159,168,187,0.8)";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("Re Z (R)", width - margin - 50, cy - 6);
      ctx.textAlign = "left";
      ctx.fillText("Im Z (X)", cx + 6, margin + 10);

      // Z phasor
      const px = cx + z.re * scale;
      const py = cy - z.im * scale;

      // R component (along x)
      ctx.strokeStyle = "rgba(122,162,255,0.5)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, cy);
      ctx.stroke();
      // X component (vertical)
      ctx.strokeStyle = "rgba(79,209,164,0.5)";
      ctx.beginPath();
      ctx.moveTo(px, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arc for phase
      const arcR = Math.min(40, Math.min(width, height) / 6);
      const phase = Math.atan2(z.im, z.re);
      ctx.strokeStyle = "rgba(245,181,75,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (phase >= 0) {
        ctx.arc(cx, cy, arcR, -phase, 0);
      } else {
        ctx.arc(cx, cy, arcR, 0, -phase);
      }
      ctx.stroke();

      // Phasor arrow
      ctx.strokeStyle = "#f5b54b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      // Arrow head
      const ang = Math.atan2(py - cy, px - cx);
      const head = 8;
      ctx.fillStyle = "#f5b54b";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - head * Math.cos(ang - 0.4), py - head * Math.sin(ang - 0.4));
      ctx.lineTo(px - head * Math.cos(ang + 0.4), py - head * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "12px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `|Z| = ${mag.toPrecision(3)} Ω,  ϕ = ${((phase * 180) / Math.PI).toFixed(1)}°`,
        12,
        height - 12,
      );
    },
    [z],
  );

  return <PlotCanvas draw={draw} aspect={1} ariaLabel="Wskaz Z na płaszczyźnie zespolonej" />;
}
