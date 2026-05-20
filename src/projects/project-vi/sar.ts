/**
 * Successive Approximation Register ADC.
 *
 * For an N-bit converter with reference Vref and bipolar input range
 * [-Vref/2, +Vref/2] (two's complement style), the converter walks bits
 * from MSB to LSB. At each step the candidate code is updated with the
 * current bit, the DAC output is compared to the input, and the bit is
 * either kept (input > DAC) or cleared.
 *
 * We model the simpler unipolar [0, Vref] convention here:
 *   code = round( v * (2^N - 1) / Vref )
 */

export interface SarStep {
  bit: number; // bit index, MSB first
  trial: number; // value tried before the comparator decision
  kept: boolean; // bit kept after compare
  current: number; // DAC output after this step
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

export function quantize(v: number, vref: number, bits: number): number {
  const max = (1 << bits) - 1;
  const clamped = Math.max(0, Math.min(vref, v));
  const code = Math.round((clamped / vref) * max);
  return (code / max) * vref;
}

export function lsb(vref: number, bits: number): number {
  const max = (1 << bits) - 1;
  return vref / max;
}

/**
 * Theoretical SNR of an ideal N-bit converter for a full scale sine:
 *   SNR = 6.02 N + 1.76  [dB]
 */
export function idealSNRdB(bits: number): number {
  return 6.02 * bits + 1.76;
}

export function codeToBits(code: number, bits: number): string {
  return code.toString(2).padStart(bits, "0");
}
