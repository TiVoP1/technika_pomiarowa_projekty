/**
 * Multimeter error calculation per the standard
 *   Δ = ±( a% odczytu  +  b digits )
 *
 * Some catalogues use   ± (a% reading  +  c% range).  We accept both forms,
 * with the user filling in whichever the spec sheet provides.
 *
 * digits → volts:  one digit on the display corresponds to one count of the
 * least significant displayed position, which equals
 *
 *   1 digit = range / (10^displayedDigits - 1)
 *
 * For a 3½ digit DMM with 4.000 V range and 4 displayed digits, 1 digit on
 * the most sensitive position is 0.001 V.  We let the user enter the
 * resolution directly to avoid ambiguity.
 */

export interface SpecAccuracy {
  percentReading: number; // a, in %
  percentRange: number; // c, in %  (optional, can be 0)
  digits: number; // b, in number of counts of the displayed LSD
  resolution: number; // value of one digit in the same unit as reading
}

export interface ErrorBreakdown {
  reading: number;
  range: number;
  termReading: number; // contribution from a% reading
  termRange: number; // contribution from c% range
  termDigits: number; // contribution from b digits
  absoluteError: number; // total ± error
  relativeError: number; // | absoluteError / reading |
  intervalLow: number;
  intervalHigh: number;
  // Type B uncertainty assuming rectangular distribution
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
  const u = absoluteError / Math.sqrt(3); // rectangular distribution
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

/**
 * A few real-world looking presets inspired by mid-class bench multimeters.
 * They are not literal copies of any one device but match the typical
 * catalogue shape.
 */
export const PRESETS: readonly QuantityPreset[] = [
  {
    id: "dcv-65",
    label: "Napięcie DC (multimetr 6½ cyfry)",
    unit: "V",
    ranges: [
      {
        label: "100 mV",
        range: 0.1,
        resolution: 1e-6,
        spec: { percentReading: 0.0035, percentRange: 0.0005, digits: 10 },
      },
      {
        label: "1 V",
        range: 1,
        resolution: 1e-5,
        spec: { percentReading: 0.0025, percentRange: 0.0006, digits: 5 },
      },
      {
        label: "10 V",
        range: 10,
        resolution: 1e-4,
        spec: { percentReading: 0.002, percentRange: 0.0004, digits: 4 },
      },
      {
        label: "100 V",
        range: 100,
        resolution: 1e-3,
        spec: { percentReading: 0.0035, percentRange: 0.0006, digits: 5 },
      },
      {
        label: "1000 V",
        range: 1000,
        resolution: 1e-2,
        spec: { percentReading: 0.0045, percentRange: 0.001, digits: 5 },
      },
    ],
  },
  {
    id: "acv-65",
    label: "Napięcie AC (50 Hz – 1 kHz)",
    unit: "V",
    ranges: [
      {
        label: "1 V",
        range: 1,
        resolution: 1e-5,
        spec: { percentReading: 0.1, percentRange: 0.03, digits: 0 },
      },
      {
        label: "10 V",
        range: 10,
        resolution: 1e-4,
        spec: { percentReading: 0.06, percentRange: 0.03, digits: 0 },
      },
      {
        label: "100 V",
        range: 100,
        resolution: 1e-3,
        spec: { percentReading: 0.06, percentRange: 0.03, digits: 0 },
      },
      {
        label: "750 V",
        range: 750,
        resolution: 1e-2,
        spec: { percentReading: 0.08, percentRange: 0.04, digits: 0 },
      },
    ],
  },
  {
    id: "dci-portable",
    label: "Prąd DC (multimetr przenośny 4½ cyfry)",
    unit: "A",
    ranges: [
      {
        label: "10 mA",
        range: 10e-3,
        resolution: 1e-7,
        spec: { percentReading: 0.2, percentRange: 0, digits: 3 },
      },
      {
        label: "100 mA",
        range: 100e-3,
        resolution: 1e-6,
        spec: { percentReading: 0.2, percentRange: 0, digits: 3 },
      },
      {
        label: "1 A",
        range: 1,
        resolution: 1e-5,
        spec: { percentReading: 0.3, percentRange: 0, digits: 3 },
      },
      {
        label: "10 A",
        range: 10,
        resolution: 1e-4,
        spec: { percentReading: 0.5, percentRange: 0, digits: 5 },
      },
    ],
  },
  {
    id: "ohm-portable",
    label: "Rezystancja (multimetr przenośny)",
    unit: "Ω",
    ranges: [
      {
        label: "1 kΩ",
        range: 1_000,
        resolution: 0.1,
        spec: { percentReading: 0.3, percentRange: 0, digits: 5 },
      },
      {
        label: "10 kΩ",
        range: 10_000,
        resolution: 1,
        spec: { percentReading: 0.3, percentRange: 0, digits: 3 },
      },
      {
        label: "100 kΩ",
        range: 100_000,
        resolution: 10,
        spec: { percentReading: 0.3, percentRange: 0, digits: 3 },
      },
      {
        label: "1 MΩ",
        range: 1_000_000,
        resolution: 100,
        spec: { percentReading: 0.5, percentRange: 0, digits: 5 },
      },
      {
        label: "10 MΩ",
        range: 10_000_000,
        resolution: 1_000,
        spec: { percentReading: 1.0, percentRange: 0, digits: 10 },
      },
    ],
  },
];
