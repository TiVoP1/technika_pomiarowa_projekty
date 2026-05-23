import { applyWindow, fftRadix2, type WindowKind } from "@/lib/fft";
import { sample, type WaveformSpec } from "@/lib/signals";

export interface SpectrumInput {
  signals: readonly WaveformSpec[];
  sampleRate: number;
  fftSize: number; // power of two
  window: WindowKind;
}

export interface SpectrumOutput {
  // Time-domain ideal (no aliasing) reference
  timeIdeal: Float64Array;
  // Time-domain after sampling at fs
  timeSampled: Float64Array;
  // Windowed time domain (what FFT sees)
  timeWindowed: Float64Array;
  // Frequency bins
  freq: Float64Array;
  // Magnitude (single-sided, normalised to amplitude)
  mag: Float64Array;
}

export function computeSpectrum(input: SpectrumInput): SpectrumOutput {
  const { signals, sampleRate, fftSize, window } = input;
  const dt = 1 / sampleRate;

  // Time-domain ideal reference (oversampled by 8x for plotting)
  const overFactor = 8;
  const timeIdeal = new Float64Array(fftSize * overFactor);
  for (let i = 0; i < timeIdeal.length; i++) {
    const t = (i / overFactor) * dt;
    let v = 0;
    for (const sig of signals) v += sample(sig, t);
    timeIdeal[i] = v;
  }

  // Sampled at fs
  const timeSampled = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    const t = i * dt;
    let v = 0;
    for (const sig of signals) v += sample(sig, t);
    timeSampled[i] = v;
  }

  // Apply window
  const timeWindowed = new Float64Array(timeSampled);
  const winSum = applyWindow(timeWindowed, window);
  const coherentGain = winSum / fftSize;

  // FFT
  const re = new Float64Array(timeWindowed);
  const im = new Float64Array(fftSize);
  fftRadix2(re, im);

  // Single-sided magnitude, normalised to amplitude of input sinus
  const half = fftSize / 2;
  const mag = new Float64Array(half);
  const freq = new Float64Array(half);
  for (let k = 0; k < half; k++) {
    const m = Math.sqrt((re[k] ?? 0) ** 2 + (im[k] ?? 0) ** 2);
    mag[k] = (2 * m) / (fftSize * coherentGain);
    freq[k] = (k * sampleRate) / fftSize;
  }
  if (mag.length > 0) {
    // DC bin gets normalised differently
    mag[0] = (mag[0] ?? 0) / 2;
  }

  return { timeIdeal, timeSampled, timeWindowed, freq, mag };
}

export function magToDb(mag: number, ref: number): number {
  if (mag <= 0) return -240;
  return 20 * Math.log10(mag / ref);
}
