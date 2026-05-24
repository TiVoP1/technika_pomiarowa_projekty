export interface AnalyzerSnapshot {
  time: Float32Array;
  freqDb: Float32Array;
  rms: number;
  peak: number;
  dcOffset: number;
  fundamentalHz: number | null;
  thdPercent: number | null;
  sampleRate: number;
  fftSize: number;
}

export function snapshot(node: AnalyserNode, sampleRate: number): AnalyzerSnapshot {
  const fft = node.fftSize;
  const half = node.frequencyBinCount;
  const time = new Float32Array(fft);
  const freqDb = new Float32Array(half);
  node.getFloatTimeDomainData(time);
  node.getFloatFrequencyData(freqDb);

  let sum = 0;
  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < fft; i++) {
    const v = time[i] ?? 0;
    sum += v;
    sumSq += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  const dc = sum / fft;
  const rms = Math.sqrt(sumSq / fft);

  return {
    time,
    freqDb,
    rms,
    peak,
    dcOffset: dc,
    fundamentalHz: null,
    thdPercent: null,
    sampleRate,
    fftSize: fft,
  };
}
