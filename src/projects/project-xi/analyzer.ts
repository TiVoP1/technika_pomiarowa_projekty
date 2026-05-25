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

/**
 * Pull current time and frequency data from an AnalyserNode and compute a
 * handful of measurements. Frequency data comes back in dBFS already so we
 * convert to linear to estimate THD.
 */
export function snapshot(node: AnalyserNode, sampleRate: number): AnalyzerSnapshot {
  const fft = node.fftSize;
  const half = node.frequencyBinCount;
  const time = new Float32Array(fft);
  const freqDb = new Float32Array(half);
  node.getFloatTimeDomainData(time);
  node.getFloatFrequencyData(freqDb);

  // Time domain stats
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

  // Frequency domain: find fundamental
  const linMag = new Float32Array(half);
  let max = -Infinity;
  let maxIdx = -1;
  // Ignore DC bin and the very lowest bins where 1/f noise sits
  const startBin = Math.max(2, Math.floor((20 / sampleRate) * fft));
  for (let i = 0; i < half; i++) {
    const db = freqDb[i] ?? -240;
    linMag[i] = Math.pow(10, db / 20);
    if (i >= startBin && db > max) {
      max = db;
      maxIdx = i;
    }
  }

  let fundamental: number | null = null;
  let thd: number | null = null;
  if (maxIdx > 0 && max > -80) {
    fundamental = (maxIdx * sampleRate) / fft;
    // Sum power at harmonics 2..6 around predicted bin
    const fundMag = linMag[maxIdx] ?? 0;
    let harmonicPower = 0;
    for (let k = 2; k <= 6; k++) {
      const idx = Math.round((k * fundamental * fft) / sampleRate);
      if (idx >= half) break;
      // Take peak in a small window to be robust against off-bin energy
      let local = 0;
      const span = 2;
      for (let j = idx - span; j <= idx + span; j++) {
        if (j < 0 || j >= half) continue;
        const m = linMag[j] ?? 0;
        if (m > local) local = m;
      }
      harmonicPower += local * local;
    }
    if (fundMag > 0) {
      thd = (Math.sqrt(harmonicPower) / fundMag) * 100;
    }
  }

  return {
    time,
    freqDb,
    rms,
    peak,
    dcOffset: dc,
    fundamentalHz: fundamental,
    thdPercent: thd,
    sampleRate,
    fftSize: fft,
  };
}
