import { type Complex } from "@/lib/complex";

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

export interface BodePoint {
  f: number;
  mag: number;
  phase: number;
}

export type _Z = Complex;
