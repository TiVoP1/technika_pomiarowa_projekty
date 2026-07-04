import { sample, type WaveformKind, type WaveformSpec } from "@/lib/signals";
import { clamp } from "@/lib/format";

interface UnitMoments {
  mean: number;
  meanSquare: number;
  max: number;
  min: number;
}

function unitMoments(kind: WaveformKind, duty: number): UnitMoments {
  const d = clamp(duty, 0.001, 0.999);
  switch (kind) {
    case "sine":
      return { mean: 0, meanSquare: 1 / 2, max: 1, min: -1 };
    case "sawtooth":
    case "triangle":
      return { mean: 0, meanSquare: 1 / 3, max: 1, min: -1 };
    case "square":
      return { mean: 0, meanSquare: 1, max: 1, min: -1 };
    case "pulse":
      // ±1 pulse with duty d has nonzero mean
      return { mean: 2 * d - 1, meanSquare: 1, max: 1, min: -1 };
  }
}

export interface RmsAnalysis {
  mean: number;
  rmsTotal: number;
  rmsAC: number;
  peak: number;
  crest: number;
  avgRect: number;
  form: number;
  avgMeterReading: number;
  avgMeterErrorPct: number;
}

/** Scaling constant of average-responding meters: pi / (2*sqrt(2)). */
export const SINE_FORM_FACTOR = Math.PI / (2 * Math.SQRT2);

export function analyzeRms(spec: WaveformSpec, samples = 8192): RmsAnalysis {
  const m = unitMoments(spec.kind, spec.duty);
  const A = spec.amplitude;
  const D = spec.dcOffset;

  const mean = D + A * m.mean;
  // E[(D + A*u)^2] = D^2 + 2*D*A*E[u] + A^2*E[u^2]
  const meanSquare = D * D + 2 * D * A * m.mean + A * A * m.meanSquare;
  const rmsTotal = Math.sqrt(Math.max(0, meanSquare));
  const rmsAC = Math.sqrt(Math.max(0, meanSquare - mean * mean));
  const peak = Math.max(Math.abs(D + A * m.max), Math.abs(D + A * m.min));

  // avg|x| depends on zero-crossing positions, so integrate numerically
  let acc = 0;
  for (let i = 0; i < samples; i++) {
    acc += Math.abs(sample(spec, (i + 0.5) / samples));
  }
  const avgRect = acc / samples;

  const avgMeterReading = SINE_FORM_FACTOR * avgRect;
  const avgMeterErrorPct =
    rmsTotal > 0 ? ((avgMeterReading - rmsTotal) / rmsTotal) * 100 : 0;

  return {
    mean,
    rmsTotal,
    rmsAC,
    peak,
    crest: rmsTotal > 0 ? peak / rmsTotal : NaN,
    avgRect,
    form: avgRect > 0 ? rmsTotal / avgRect : NaN,
    avgMeterReading,
    avgMeterErrorPct,
  };
}

export function numericRms(spec: WaveformSpec, samples = 8192): number {
  let acc = 0;
  for (let i = 0; i < samples; i++) {
    const v = sample(spec, (i + 0.5) / samples);
    acc += v * v;
  }
  return Math.sqrt(acc / samples);
}

export interface DerivationStep {
  text?: string;
  formula?: string;
}

export interface Derivation {
  intro: string;
  steps: readonly DerivationStep[];
  result: string;
}

export const DERIVATIONS: Record<WaveformKind, Derivation> = {
  sine: {
    intro:
      "Punktem wyjścia jest zawsze definicja: wartość skuteczna to pierwiastek ze średniej kwadratu sygnału po jednym okresie.",
    steps: [
      { text: "Sygnał:", formula: "x(t) = A·sin(ωt),  ω = 2π/T" },
      {
        text: "Definicja wartości skutecznej:",
        formula: "X² = (1/T) ∫₀ᵀ A²·sin²(ωt) dt",
      },
      {
        text: "Korzystamy z tożsamości trygonometrycznej:",
        formula: "sin²α = (1 − cos 2α) / 2",
      },
      {
        text: "Całka z cos(2ωt) po całkowitej liczbie okresów znika, zostaje tylko składnik stały ½:",
        formula: "X² = (A²/T) ∫₀ᵀ ½ dt = A²/2",
      },
    ],
    result: "X = A/√2 ≈ 0,7071·A",
  },
  sawtooth: {
    intro:
      "Piła narasta liniowo od −A do +A w ciągu okresu. Kwadrat funkcji liniowej całkuje się elementarnie.",
    steps: [
      { text: "Sygnał na jednym okresie:", formula: "x(t) = A·(2t/T − 1),  t ∈ [0, T)" },
      {
        text: "Definicja:",
        formula: "X² = (1/T) ∫₀ᵀ A²·(2t/T − 1)² dt",
      },
      {
        text: "Podstawienie u = 2t/T − 1, du = (2/T)dt:",
        formula: "X² = (A²/2) ∫₋₁¹ u² du = (A²/2)·[u³/3]₋₁¹ = A²/3",
      },
    ],
    result: "X = A/√3 ≈ 0,5774·A",
  },
  triangle: {
    intro:
      "Trójkąt składa się z dwóch odcinków liniowych przebiegających cały zakres od −A do +A. Na każdym z nich kwadrat sygnału daje taką samą całkę jak dla piły, więc wynik jest identyczny.",
    steps: [
      {
        text: "Na odcinku narastającym (połowa okresu):",
        formula: "x(t) = A·(4t/T − 1),  t ∈ [0, T/2)",
      },
      {
        text: "Średnia kwadratu na tym odcinku (podstawienie u = 4t/T − 1):",
        formula: "(2/T) ∫₀^{T/2} A²·(4t/T − 1)² dt = (A²/2) ∫₋₁¹ u² du = A²/3",
      },
      {
        text: "Odcinek opadający jest lustrzanym odbiciem, więc daje tę samą wartość. Średnia po całym okresie:",
        formula: "X² = A²/3",
      },
    ],
    result: "X = A/√3 ≈ 0,5774·A",
  },
  square: {
    intro:
      "Prostokąt symetryczny to przypadek trywialny: kwadrat sygnału jest stały, niezależnie od znaku.",
    steps: [
      { text: "Sygnał przyjmuje tylko wartości ±A, więc:", formula: "x²(t) = A²  dla każdego t" },
      { text: "Średnia z funkcji stałej to ta sama stała:", formula: "X² = A²" },
    ],
    result: "X = A  (wartość skuteczna równa amplitudzie)",
  },
  pulse: {
    intro:
      "Impuls bipolarny: +A przez czas d·T i −A przez (1−d)·T, gdzie d to współczynnik wypełnienia. Kluczowa obserwacja: kwadrat sygnału nie zależy od wypełnienia, ale składowa stała już tak.",
    steps: [
      {
        text: "Średnia kwadratu — kwadrat obu poziomów wynosi A²:",
        formula: "X² = d·A² + (1−d)·A² = A²   →   X = A (niezależnie od d!)",
      },
      {
        text: "Składowa stała rośnie liniowo z wypełnieniem:",
        formula: "X₀ = d·A + (1−d)·(−A) = A·(2d − 1)",
      },
      {
        text: "Wartość skuteczna składowej przemiennej z rozkładu X² = X₀² + X_AC²:",
        formula: "X_AC = √(A² − A²(2d−1)²) = 2A·√(d(1−d))",
      },
      {
        text: "Dla d = 0,5 dostajemy prostokąt: X₀ = 0 i X_AC = A. Przy d → 0 lub d → 1 cała energia przechodzi do składowej stałej.",
      },
    ],
    result: "X = A,   X₀ = A(2d−1),   X_AC = 2A·√(d(1−d))",
  },
};

export const DC_DECOMPOSITION: Derivation = {
  intro:
    "Każdy sygnał można rozłożyć na składową stałą X₀ (wartość średnią) i składową przemienną x~(t) o średniej zerowej. Wartości skuteczne tych składowych sumują się geometrycznie.",
  steps: [
    { text: "Rozkład sygnału:", formula: "x(t) = X₀ + x~(t),  gdzie  ⟨x~⟩ = 0" },
    {
      text: "Podstawiamy do definicji i rozwijamy kwadrat:",
      formula: "X² = ⟨(X₀ + x~)²⟩ = X₀² + 2·X₀·⟨x~⟩ + ⟨x~²⟩",
    },
    {
      text: "Składnik mieszany znika, bo średnia składowej przemiennej jest zerowa:",
      formula: "X² = X₀² + X_AC²",
    },
  ],
  result: "X = √(X₀² + X_AC²)  — jak suma wektorów prostopadłych",
};

export interface WaveformTableRow {
  kind: WaveformKind;
  rms: string;
  rmsValue: number;
  avgRect: string;
  crest: string;
  form: string;
}

export const WAVEFORM_TABLE: readonly WaveformTableRow[] = [
  {
    kind: "sine",
    rms: "A/√2 ≈ 0,707·A",
    rmsValue: 1 / Math.SQRT2,
    avgRect: "2A/π ≈ 0,637·A",
    crest: "√2 ≈ 1,414",
    form: "π/(2√2) ≈ 1,111",
  },
  {
    kind: "triangle",
    rms: "A/√3 ≈ 0,577·A",
    rmsValue: 1 / Math.sqrt(3),
    avgRect: "A/2 = 0,5·A",
    crest: "√3 ≈ 1,732",
    form: "2/√3 ≈ 1,155",
  },
  {
    kind: "sawtooth",
    rms: "A/√3 ≈ 0,577·A",
    rmsValue: 1 / Math.sqrt(3),
    avgRect: "A/2 = 0,5·A",
    crest: "√3 ≈ 1,732",
    form: "2/√3 ≈ 1,155",
  },
  {
    kind: "square",
    rms: "A",
    rmsValue: 1,
    avgRect: "A",
    crest: "1",
    form: "1",
  },
  {
    kind: "pulse",
    rms: "A (całkowita)",
    rmsValue: 1,
    avgRect: "A",
    crest: "1 … ∞ (po odjęciu X₀)",
    form: "zależny od d",
  },
];
