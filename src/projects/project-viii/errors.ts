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

export function computeError(
  reading: number,
  range: number,
  spec: SpecAccuracy,
): ErrorBreakdown {
  const termReading = (spec.percentReading / 100) * Math.abs(reading);
  const termRange = (spec.percentRange / 100) * Math.abs(range);
  const termDigits = spec.digits * spec.resolution;
  const absoluteError = termReading + termRange + termDigits;
  const relativeError = reading !== 0 ? absoluteError / Math.abs(reading) : Infinity;
  const u = absoluteError / Math.sqrt(3);
  return {
    reading,
    range,
    termReading,
    termRange,
    termDigits,
    absoluteError,
    relativeError,
    intervalLow: reading - absoluteError,
    intervalHigh: reading + absoluteError,
    standardUncertainty: u,
    expandedUncertaintyK2: 2 * u,
  };
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
