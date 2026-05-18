const SI_PREFIXES: readonly { exp: number; symbol: string }[] = [
  { exp: 12, symbol: "T" },
  { exp: 9, symbol: "G" },
  { exp: 6, symbol: "M" },
  { exp: 3, symbol: "k" },
  { exp: 0, symbol: "" },
  { exp: -3, symbol: "m" },
  { exp: -6, symbol: "µ" },
  { exp: -9, symbol: "n" },
  { exp: -12, symbol: "p" },
  { exp: -15, symbol: "f" },
];

export function formatSI(value: number, unit = "", sigDigits = 3): string {
  if (!Number.isFinite(value)) return `— ${unit}`;
  if (value === 0) return `0 ${unit}`.trimEnd();
  const abs = Math.abs(value);
  const exp = Math.floor(Math.log10(abs));
  const chosen =
    SI_PREFIXES.find((p) => exp >= p.exp) ??
    SI_PREFIXES[SI_PREFIXES.length - 1] ??
    { exp: 0, symbol: "" };
  const scaled = value / Math.pow(10, chosen.exp);
  const mantissa = scaled.toPrecision(sigDigits);
  return `${mantissa} ${chosen.symbol}${unit}`.trimEnd();
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  return value.toPrecision(digits);
}

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
