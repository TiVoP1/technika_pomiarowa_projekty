import { cInv, cplx, type Complex } from "@/lib/complex";

export type ElementKind = "resistor" | "inductor" | "capacitor";

export interface RealResistor {
  kind: "resistor";
  r: number;
  l: number;
  c: number;
}

export interface RealInductor {
  kind: "inductor";
  l: number;
  rs: number;
  c: number;
}

export interface RealCapacitor {
  kind: "capacitor";
  c: number;
  esr: number;
  esl: number;
}

export type RealElement = RealResistor | RealInductor | RealCapacitor;

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

export interface BodePoint {
  f: number;
  mag: number;
  phase: number;
}
