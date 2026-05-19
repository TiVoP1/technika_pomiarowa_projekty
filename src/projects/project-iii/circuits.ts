import { cArg, cMag, cInv, cplx, type Complex } from "@/lib/complex";

export type ElementKind = "resistor" | "inductor" | "capacitor";

export interface RealResistor {
  kind: "resistor";
  r: number; // Ω
  l: number; // H  (parasitic series inductance, lead)
  c: number; // F  (parasitic parallel capacitance)
}

export interface RealInductor {
  kind: "inductor";
  l: number; // H
  rs: number; // Ω (winding resistance, series)
  c: number; // F  (inter-winding capacitance, parallel)
}

export interface RealCapacitor {
  kind: "capacitor";
  c: number; // F
  esr: number; // Ω  (equivalent series resistance)
  esl: number; // H  (equivalent series inductance)
}

export type RealElement = RealResistor | RealInductor | RealCapacitor;

/**
 * Build the full physical impedance Z(jω) of a real passive element.
 *
 * Resistor model:  (R in series with L)  ||  C
 * Inductor model:  (L in series with Rs) ||  C
 * Capacitor model: ESR  +  jωESL  +  1/(jωC)
 */
export function impedance(element: RealElement, omega: number): Complex {
  const j = (x: number): Complex => cplx(0, x);
  switch (element.kind) {
    case "resistor": {
      const branch = cAddReal(element.r, j(omega * element.l));
      if (element.c <= 0) return branch;
      const yC = j(omega * element.c);
      const yBranch = cInv(branch);
      return cInv(cAddC(yBranch, yC));
    }
    case "inductor": {
      const branch = cAddReal(element.rs, j(omega * element.l));
      if (element.c <= 0) return branch;
      const yC = j(omega * element.c);
      const yBranch = cInv(branch);
      return cInv(cAddC(yBranch, yC));
    }
    case "capacitor": {
      // ESR + jωL_lead + 1/(jωC)  =  ESR + jωL_lead - j/(ωC)
      const zC = element.c > 0 ? -1 / (omega * element.c) : 0;
      return cplx(element.esr, omega * element.esl + zC);
    }
  }
}

function cAddReal(r: number, c: Complex): Complex {
  return cplx(c.re + r, c.im);
}
function cAddC(a: Complex, b: Complex): Complex {
  return cplx(a.re + b.re, a.im + b.im);
}

export interface EquivalentSet {
  z: Complex;
  rs: number; // series resistance (Re Z)
  xs: number; // series reactance (Im Z)
  rp: number; // parallel resistance
  xp: number; // parallel reactance (signed)
  q: number; // |Xs|/Rs
  d: number; // 1/Q
  // Equivalent single-element form at this frequency, signed by sign(Im Z)
  equivL: number | null; // H if Im Z > 0
  equivC: number | null; // F if Im Z < 0
  equivLpar: number | null;
  equivCpar: number | null;
}

/**
 * Convert a given impedance into the canonical series and parallel
 * representations, plus the equivalent single inductor or capacitor at the
 * working frequency.
 */
export function equivalents(z: Complex, omega: number): EquivalentSet {
  const rs = z.re;
  const xs = z.im;
  const mag2 = rs * rs + xs * xs;
  // Parallel: 1/Z = G + jB, then Rp = 1/G, Xp = -1/B
  const g = rs / mag2;
  const b = -xs / mag2;
  const rp = g !== 0 ? 1 / g : Infinity;
  const xp = b !== 0 ? -1 / b : Infinity;
  const q = rs > 0 ? Math.abs(xs) / rs : Infinity;
  const d = q > 0 ? 1 / q : Infinity;

  let equivL: number | null = null;
  let equivC: number | null = null;
  let equivLpar: number | null = null;
  let equivCpar: number | null = null;
  if (omega > 0) {
    if (xs > 0) equivL = xs / omega;
    if (xs < 0) equivC = -1 / (omega * xs);
    if (xp > 0) equivLpar = xp / omega;
    if (xp < 0) equivCpar = -1 / (omega * xp);
  }

  return { z, rs, xs, rp, xp, q, d, equivL, equivC, equivLpar, equivCpar };
}

export function magnitudePhase(z: Complex): { mag: number; phaseDeg: number } {
  return { mag: cMag(z), phaseDeg: (cArg(z) * 180) / Math.PI };
}

export interface BodePoint {
  f: number;
  mag: number;
  phase: number; // degrees
}

export function bode(
  element: RealElement,
  fMin: number,
  fMax: number,
  count: number,
): BodePoint[] {
  const out: BodePoint[] = [];
  const logMin = Math.log10(fMin);
  const logMax = Math.log10(fMax);
  for (let i = 0; i < count; i++) {
    const f = Math.pow(10, logMin + ((logMax - logMin) * i) / (count - 1));
    const z = impedance(element, 2 * Math.PI * f);
    const { mag, phaseDeg } = magnitudePhase(z);
    out.push({ f, mag, phase: phaseDeg });
  }
  return out;
}
