export function fftRadix2(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  if (n !== imag.length) {
    throw new Error("FFT: real/imag length mismatch");
  }
  if ((n & (n - 1)) !== 0) {
    throw new Error("FFT: length must be a power of two");
  }
  if (n <= 1) return;

  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      const tr = real[i] ?? 0;
      const ti = imag[i] ?? 0;
      real[i] = real[j] ?? 0;
      imag[i] = imag[j] ?? 0;
      real[j] = tr;
      imag[j] = ti;
    }
  }

  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const angleStep = (-2 * Math.PI) / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k++) {
        const angle = angleStep * k;
        const wr = Math.cos(angle);
        const wi = Math.sin(angle);
        const iEven = start + k;
        const iOdd = start + k + half;
        const er = real[iEven] ?? 0;
        const ei = imag[iEven] ?? 0;
        const or_ = real[iOdd] ?? 0;
        const oi = imag[iOdd] ?? 0;
        const tr = wr * or_ - wi * oi;
        const ti = wr * oi + wi * or_;
        real[iEven] = er + tr;
        imag[iEven] = ei + ti;
        real[iOdd] = er - tr;
        imag[iOdd] = ei - ti;
      }
    }
  }
}
