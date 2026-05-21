import { type WaveformSpec } from "@/lib/signals";

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

export interface AcquiredFrame {
  duration: number;
  samplesPerCh: number;
  data: readonly Float64Array[];
  triggerFound: boolean;
  triggerIndex: number;
}

export const SCOPE_DIVS_X = 10;
export const SCOPE_DIVS_Y = 8;
