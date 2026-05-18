export type WaveformKind = "sine" | "square" | "triangle" | "sawtooth" | "pulse";

export interface WaveformSpec {
  kind: WaveformKind;
  frequency: number; // Hz
  amplitude: number; // peak
  phase: number; // radians
  dcOffset: number;
  duty: number; // 0..1, used for pulse
}

export function sample(spec: WaveformSpec, t: number): number {
  const phase = 2 * Math.PI * spec.frequency * t + spec.phase;
  const base = waveCore(spec.kind, phase, spec.duty);
  return spec.dcOffset + spec.amplitude * base;
}

function waveCore(kind: WaveformKind, phase: number, duty: number): number {
  const tau = 2 * Math.PI;
  // Normalize phase to [0, tau)
  const x = ((phase % tau) + tau) % tau;
  const u = x / tau; // 0..1
  switch (kind) {
    case "sine":
      return Math.sin(phase);
    case "square":
      return u < 0.5 ? 1 : -1;
    case "triangle":
      // 0..0.5: -1 -> 1, 0.5..1: 1 -> -1
      return u < 0.5 ? -1 + 4 * u : 3 - 4 * u;
    case "sawtooth":
      // -1..1 ramp
      return 2 * u - 1;
    case "pulse": {
      const d = Math.min(0.999, Math.max(0.001, duty));
      return u < d ? 1 : -1;
    }
  }
}

/**
 * Analytical RMS of a unit-amplitude, zero-offset periodic waveform.
 */
export function rmsOfUnit(kind: WaveformKind, duty: number): number {
  switch (kind) {
    case "sine":
      return 1 / Math.SQRT2;
    case "square":
      return 1;
    case "triangle":
      return 1 / Math.sqrt(3);
    case "sawtooth":
      return 1 / Math.sqrt(3);
    case "pulse": {
      const d = Math.min(0.999, Math.max(0.001, duty));
      // For a {+1,-1} pulse with duty d: RMS = sqrt(d * 1 + (1-d) * 1) = 1.
      // But for {+1, 0} pulse, RMS = sqrt(d). The convention here is symmetric.
      return Math.sqrt(d * 1 + (1 - d) * 1);
    }
  }
}

/**
 * Total RMS including DC offset for a unipolar/bipolar interpretation.
 * For symmetric (±1) waveforms scaled by A with offset D:
 *   RMS_total = sqrt(D^2 + (A * rmsUnit)^2)
 */
export function totalRMS(spec: WaveformSpec): number {
  const r = rmsOfUnit(spec.kind, spec.duty);
  const ac = spec.amplitude * r;
  return Math.sqrt(spec.dcOffset * spec.dcOffset + ac * ac);
}

export const WAVEFORM_LABEL: Record<WaveformKind, string> = {
  sine: "Sinus",
  square: "Prostokąt",
  triangle: "Trójkąt",
  sawtooth: "Piła",
  pulse: "Impuls",
};
