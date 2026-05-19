export interface Complex {
  re: number;
  im: number;
}

export const cplx = (re: number, im: number): Complex => ({ re, im });

export const cAdd = (a: Complex, b: Complex): Complex => ({
  re: a.re + b.re,
  im: a.im + b.im,
});

export const cMul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const cDiv = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d,
  };
};

export const cInv = (a: Complex): Complex => cDiv({ re: 1, im: 0 }, a);

export const cMag = (a: Complex): number => Math.sqrt(a.re * a.re + a.im * a.im);

export const cArg = (a: Complex): number => Math.atan2(a.im, a.re);

export const cFromPolar = (mag: number, arg: number): Complex => ({
  re: mag * Math.cos(arg),
  im: mag * Math.sin(arg),
});
