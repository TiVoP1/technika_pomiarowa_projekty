import { sample, type WaveformSpec } from "@/lib/signals";

export type TriggerSlope = "rising" | "falling";

export interface ScopeChannel {
  id: "A" | "B";
  enabled: boolean;
  vDiv: number;
  offset: number;
  color: string;
  spec: WaveformSpec;
  noise: number;
}

export interface TriggerSettings {
  source: "A" | "B";
  level: number;
  slope: TriggerSlope;
  auto: boolean;
}

export interface ScopeConfig {
  tDiv: number;
  sampleRate: number;
  channels: readonly ScopeChannel[];
  trigger: TriggerSettings;
}

const DIVS_X = 10;

export interface AcquiredFrame {
  duration: number;
  samplesPerCh: number;
  data: readonly Float64Array[];
  triggerFound: boolean;
  triggerIndex: number;
}

let noiseSeed = 1;

function pseudoNoise(rms: number): number {
  noiseSeed = (noiseSeed * 9301 + 49297) % 233280;
  const u1 = (noiseSeed + 1) / 233281;
  noiseSeed = (noiseSeed * 9301 + 49297) % 233280;
  const u2 = (noiseSeed + 1) / 233281;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * rms;
}

export function acquire(config: ScopeConfig, frameStart: number): AcquiredFrame {
  const duration = config.tDiv * DIVS_X;
  const samplesPerCh = Math.max(64, Math.floor(duration * config.sampleRate));
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

  const triggerChIndex = config.channels.findIndex(
    (c) => c.id === config.trigger.source,
  );
  let trigIndex = samplesPerCh;
  let triggerFound = false;
  if (triggerChIndex >= 0) {
    const buf = buffers[triggerChIndex];
    if (buf) {
      const level = config.trigger.level;
      const start = samplesPerCh;
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

export const SCOPE_DIVS_X = DIVS_X;
export const SCOPE_DIVS_Y = 8;
