import { sample, type WaveformSpec } from "@/lib/signals";

export type TriggerSlope = "rising" | "falling";

export interface ScopeChannel {
  id: "A" | "B";
  enabled: boolean;
  vDiv: number; // volts per division
  offset: number; // volts
  color: string;
  spec: WaveformSpec;
  noise: number; // additive gaussian, V rms
}

export interface TriggerSettings {
  source: "A" | "B";
  level: number; // volts
  slope: TriggerSlope;
  auto: boolean; // ignore trigger if not found
}

export interface ScopeConfig {
  tDiv: number; // seconds per division
  sampleRate: number; // Hz
  channels: readonly ScopeChannel[];
  trigger: TriggerSettings;
}

const DIVS_X = 10;
const DIVS_Y = 8;

export interface AcquiredFrame {
  duration: number;
  samplesPerCh: number;
  data: readonly Float64Array[];
  triggerFound: boolean;
  triggerIndex: number;
}

let noiseSeed = 1;

function pseudoNoise(rms: number): number {
  // Cheap box-Muller using LCG
  noiseSeed = (noiseSeed * 9301 + 49297) % 233280;
  const u1 = (noiseSeed + 1) / 233281;
  noiseSeed = (noiseSeed * 9301 + 49297) % 233280;
  const u2 = (noiseSeed + 1) / 233281;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * rms;
}

/**
 * Acquire one screenful of data with simple level/slope triggering. We
 * generate a wide buffer, walk forward to find a trigger event in the
 * trigger channel, then return the window centred on that event.
 */
export function acquire(config: ScopeConfig, frameStart: number): AcquiredFrame {
  const duration = config.tDiv * DIVS_X;
  const samplesPerCh = Math.max(64, Math.floor(duration * config.sampleRate));
  // We over-sample by a factor of 3 to give the trigger search room.
  const overSampled = samplesPerCh * 3;
  const buffers = config.channels.map(() => new Float64Array(overSampled));
  const dt = duration / samplesPerCh;
  for (let i = 0; i < overSampled; i++) {
    const t = frameStart + i * dt;
    for (let c = 0; c < config.channels.length; c++) {
      const ch = config.channels[c];
      if (!ch) continue;
      const v = sample(ch.spec, t) + (ch.noise > 0 ? pseudoNoise(ch.noise) : 0);
      const buf = buffers[c];
      if (buf) buf[i] = v;
    }
  }

  // Trigger detection in the trigger source channel
  const triggerChIndex = config.channels.findIndex(
    (c) => c.id === config.trigger.source,
  );
  let trigIndex = samplesPerCh; // default "centre"
  let triggerFound = false;
  if (triggerChIndex >= 0) {
    const buf = buffers[triggerChIndex];
    if (buf) {
      const level = config.trigger.level;
      const start = samplesPerCh; // ignore the very beginning
      for (let i = start; i < overSampled - 1; i++) {
        const a = buf[i] ?? 0;
        const b = buf[i + 1] ?? 0;
        const rising = a < level && b >= level;
        const falling = a > level && b <= level;
        if (
          (config.trigger.slope === "rising" && rising) ||
          (config.trigger.slope === "falling" && falling)
        ) {
          trigIndex = i;
          triggerFound = true;
          break;
        }
      }
    }
  }

  if (!triggerFound && !config.trigger.auto) {
    trigIndex = samplesPerCh;
  }

  // Window centred on trigger
  const half = Math.floor(samplesPerCh / 2);
  const startIdx = Math.max(0, Math.min(overSampled - samplesPerCh, trigIndex - half));
  const out: Float64Array[] = buffers.map((buf) => {
    const slice = new Float64Array(samplesPerCh);
    for (let i = 0; i < samplesPerCh; i++) {
      slice[i] = buf[startIdx + i] ?? 0;
    }
    return slice;
  });
  return {
    duration,
    samplesPerCh,
    data: out,
    triggerFound,
    triggerIndex: trigIndex - startIdx,
  };
}

export interface ChannelStats {
  vMin: number;
  vMax: number;
  vPp: number;
  vMean: number;
  vRms: number;
  frequency: number | null;
  period: number | null;
}

export function computeStats(
  data: Float64Array,
  duration: number,
): ChannelStats {
  let vMin = Infinity;
  let vMax = -Infinity;
  let sum = 0;
  let sumSq = 0;
  const n = data.length;
  for (let i = 0; i < n; i++) {
    const v = data[i] ?? 0;
    if (v < vMin) vMin = v;
    if (v > vMax) vMax = v;
    sum += v;
    sumSq += v * v;
  }
  const vMean = sum / n;
  const vRms = Math.sqrt(sumSq / n);

  // Period via zero-crossings of (signal - mean)
  let firstCross = -1;
  let lastCross = -1;
  let crossings = 0;
  const offset = vMean;
  for (let i = 1; i < n; i++) {
    const a = (data[i - 1] ?? 0) - offset;
    const b = (data[i] ?? 0) - offset;
    if (a <= 0 && b > 0) {
      // rising zero crossing, interpolate
      const frac = -a / (b - a);
      const idx = i - 1 + frac;
      if (firstCross < 0) firstCross = idx;
      lastCross = idx;
      crossings++;
    }
  }
  let frequency: number | null = null;
  let period: number | null = null;
  if (crossings >= 2 && firstCross >= 0 && lastCross > firstCross) {
    const samplesPerCycle = (lastCross - firstCross) / (crossings - 1);
    const dt = duration / n;
    period = samplesPerCycle * dt;
    frequency = period > 0 ? 1 / period : null;
  }

  return {
    vMin,
    vMax,
    vPp: vMax - vMin,
    vMean,
    vRms,
    frequency,
    period,
  };
}

export const SCOPE_DIVS_X = DIVS_X;
export const SCOPE_DIVS_Y = DIVS_Y;
