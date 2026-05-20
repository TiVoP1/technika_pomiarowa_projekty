export interface SarStep {
  bit: number;
  trial: number;
  kept: boolean;
  current: number;
}

export interface SarResult {
  steps: SarStep[];
  code: number;
  dacOut: number;
  error: number;
}

export function sarConvert(v: number, vref: number, bits: number): SarResult {
  const max = (1 << bits) - 1;
  const clamped = Math.max(0, Math.min(vref, v));
  let code = 0;
  const steps: SarStep[] = [];
  for (let i = bits - 1; i >= 0; i--) {
    const trialCode = code | (1 << i);
    const trialVoltage = (trialCode / max) * vref;
    const kept = clamped >= trialVoltage;
    if (kept) {
      code = trialCode;
    }
    steps.push({
      bit: i,
      trial: trialVoltage,
      kept,
      current: (code / max) * vref,
    });
  }
  const dacOut = (code / max) * vref;
  return { steps, code, dacOut, error: clamped - dacOut };
}
