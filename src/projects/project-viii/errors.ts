export interface SpecAccuracy {
  percentReading: number;
  percentRange: number;
  digits: number;
  resolution: number;
}

export interface ErrorBreakdown {
  reading: number;
  range: number;
  termReading: number;
  termRange: number;
  termDigits: number;
  absoluteError: number;
  relativeError: number;
  intervalLow: number;
  intervalHigh: number;
  standardUncertainty: number;
  expandedUncertaintyK2: number;
}

export interface QuantityPreset {
  id: string;
  label: string;
  unit: string;
  ranges: readonly {
    label: string;
    range: number;
    resolution: number;
    spec: Omit<SpecAccuracy, "resolution">;
  }[];
}
