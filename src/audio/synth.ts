/**
 * 절차적 ASMR 사운드 생성기.
 *
 * 실제 음원 파일(public/sounds/...)이 아직 없을 때 사용하는 대체 사운드입니다.
 * 모든 루프는 "원형(circular)" 방식으로 만들어져 반복 재생 시 이음새가 들리지 않습니다.
 * 실제 녹음 파일을 넣으면 AudioEngine 이 자동으로 파일을 우선 사용합니다.
 */
import type { SfxKind, SynthKind } from '../types';

export const SR = 32000;
type Buf = Float32Array;
type Rand = () => number;

const TAU = Math.PI * 2;
const sec = (s: number) => Math.floor(s * SR);

function makeRng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- 기본 신호 ---------- */
function white(n: number, r: Rand): Buf {
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = r() * 2 - 1;
  return b;
}
function pink(n: number, r: Rand): Buf {
  const b = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = r() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    b[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return b;
}
function brown(n: number, r: Rand): Buf {
  const b = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    last = (last + 0.02 * (r() * 2 - 1)) / 1.02;
    b[i] = last * 3.5;
  }
  return b;
}

/* ---------- 필터 (원형 적용으로 루프 이음새 제거) ---------- */
function circ(x: Buf, fn: (y: Buf) => Buf): Buf {
  const n = x.length;
  const d = new Float32Array(n * 2);
  d.set(x);
  d.set(x, n);
  return fn(d).slice(n);
}
function lp(x: Buf, fc: number): Buf {
  const a = Math.exp((-TAU * fc) / SR);
  const y = new Float32Array(x.length);
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    s = (1 - a) * x[i] + a * s;
    y[i] = s;
  }
  return y;
}
function hp(x: Buf, fc: number): Buf {
  const l = lp(x, fc);
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] - l[i];
  return y;
}
/** 상태변수 밴드패스. fc 는 상수 또는 샘플별 함수 */
function band(x: Buf, fc: number | ((i: number) => number), q = 1): Buf {
  const y = new Float32Array(x.length);
  let low = 0, bp = 0;
  for (let i = 0; i < x.length; i++) {
    const f0 = typeof fc === 'number' ? fc : fc(i);
    const f = 2 * Math.sin((Math.PI * Math.min(f0, SR / 6.5)) / SR);
    low += f * bp;
    const high = x[i] - low - q * bp;
    bp += f * high;
    y[i] = bp;
  }
  return y;
}
/** 간단한 Schroeder 리버브 */
function reverb(x: Buf, mix: number, size = 1, fb = 0.8): Buf {
  return circ(x, (d) => {
    const combs = [1557, 1617, 1491, 1422].map((v) => Math.floor(v * (SR / 44100) * size));
    const out = new Float32Array(d.length);
    for (const len of combs) {
      const buf = new Float32Array(len);
      let idx = 0, damp = 0;
      for (let i = 0; i < d.length; i++) {
        const o = buf[idx];
        damp = o * 0.7 + damp * 0.3;
        buf[idx] = d[i] + damp * fb;
        out[i] += o * 0.25;
        idx = (idx + 1) % len;
      }
    }
    for (const len of [225, 556].map((v) => Math.floor(v * (SR / 44100)))) {
      const buf = new Float32Array(len);
      let idx = 0;
      for (let i = 0; i < out.length; i++) {
        const b = buf[idx];
        const v = out[i];
        buf[idx] = v + b * 0.5;
        out[i] = b - v * 0.5;
        idx = (idx + 1) % len;
      }
    }
    for (let i = 0; i < d.length; i++) out[i] = d[i] * (1 - mix) + out[i] * mix;
    return out;
  });
}

/* ---------- 유틸 ---------- */
function addAt(target: Buf, start: number, src: Buf, gain = 1) {
  const n = target.length;
  for (let j = 0; j < src.length; j++) target[(start + j) % n] += src[j] * gain;
}
function normalize(x: Buf, peak = 0.9): Buf {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m;
  return x;
}
/** 주파수가 변하는 사인 */
function glide(len: number, f: (u: number) => number, env: (u: number) => number, harmonics = [1]): Buf {
  const b = new Float32Array(len);
  let ph = 0;
  for (let j = 0; j < len; j++) {
    const u = j / len;
    ph += (TAU * f(u)) / SR;
    let v = 0;
    harmonics.forEach((h, k) => (v += Math.sin(ph * (k + 1)) * h));
    b[j] = v * env(u);
  }
  return b;
}
/** 샘플&홀드 → 저역통과 랜덤 그레인 (종이/연필 질감) */
function grain(n: number, r: Rand, holdMs: number, smooth: number, pow = 1): Buf {
  const hold = Math.max(1, Math.floor((holdMs / 1000) * SR));
  const b = new Float32Array(n);
  let v = 0;
  for (let i = 0; i < n; i++) {
    if (i % hold === 0) v = Math.pow(r(), pow);
    b[i] = v;
  }
  return lp(b, smooth);
}
function crackle(r: Rand, len: number): Buf {
  const ev = new Float32Array(len);
  let prev = 0;
  for (let j = 0; j < len; j++) {
    const n = r() * 2 - 1;
    ev[j] = (n - prev) * Math.exp(-j / (len * 0.22));
    prev = n;
  }
  return ev;
}
function thump(r: Rand, f0: number, f1: number, decay: number, noiseAmt = 0.5): Buf {
  const len = sec(decay * 6);
  const tone = glide(len, (u) => f1 + (f0 - f1) * Math.exp(-u * 8), (u) => Math.exp((-u * len) / (decay * SR)));
  const nz = lp(white(len, r), 450);
  for (let j = 0; j < len; j++) tone[j] += nz[j] * noiseAmt * 3 * Math.exp(-j / (decay * 0.5 * SR));
  return tone;
}
function bubble(f0: number, durS: number, rise = 1.4): Buf {
  return glide(
    sec(durS),
    (u) => f0 * (1 + rise * u),
    (u) => Math.min(1, u / 0.06) * Math.exp(-u * 3.2),
  );
}

/* ---------- 루프 생성기 ---------- */
const GENERATORS: Record<SynthKind, (r: Rand) => Buf> = {
  fireCrackle(r) {
    const N = sec(12);
    const out = circ(brown(N, r), (d) => lp(d, 480));
    for (let i = 0; i < N; i++) {
      const u = i / N;
      out[i] *= 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(TAU * 3 * u)) * (0.5 + 0.5 * Math.sin(TAU * 7 * u + 1));
    }
    normalize(out, 0.32);
    for (let k = 0; k < 12 * 42; k++) {
      const start = Math.floor(r() * N);
      const dens = 0.5 + 0.5 * Math.sin(TAU * 5 * (start / N) + 2);
      if (r() > 0.35 + dens * 0.65) continue;
      addAt(out, start, crackle(r, 20 + Math.floor(r() * 260)), Math.pow(r(), 3) * 0.85 + 0.03);
    }
    for (let k = 0; k < 9; k++) {
      const start = Math.floor(r() * N);
      const pop = crackle(r, 700);
      const ring = glide(500, () => 1400 + r() * 1200, (u) => Math.exp(-u * 9));
      addAt(out, start, pop, 0.8);
      addAt(out, start, ring, 0.12);
    }
    return normalize(out, 0.9);
  },
  fireSparks(r) {
    const N = sec(10);
    const out = circ(white(N, r), (d) => hp(d, 3000));
    for (let i = 0; i < N; i++) out[i] *= 0.012;
    for (let k = 0; k < 22; k++) {
      let t = Math.floor(r() * N);
      const cluster = r() < 0.5 ? 2 + Math.floor(r() * 3) : 1;
      for (let c = 0; c < cluster; c++) {
        const len = sec(0.05);
        const f = 2500 + r() * 3000;
        const ev = new Float32Array(len);
        for (let j = 0; j < len; j++) {
          ev[j] = (r() * 2 - 1) * Math.exp(-j / (SR * 0.003)) * 0.8 + Math.sin((TAU * f * j) / SR) * Math.exp(-j / (SR * 0.01)) * 0.4;
        }
        addAt(out, t, ev, 0.3 + r() * 0.7);
        t += Math.floor(SR * (0.02 + r() * 0.07));
      }
    }
    return normalize(out, 0.8);
  },
  crickets(r) {
    const N = sec(12);
    const out = new Float32Array(N);
    const bugs = [
      { f: 4300, rate: 0.9, g: 1 },
      { f: 4850, rate: 1.25, g: 0.55 },
      { f: 3900, rate: 0.72, g: 0.4 },
      { f: 5200, rate: 1.6, g: 0.18 },
      { f: 4550, rate: 0.55, g: 0.12 },
    ];
    for (const b of bugs) {
      let t = r() * b.rate;
      while (t < 12) {
        const pulses = 3 + Math.floor(r() * 2);
        for (let p = 0; p < pulses; p++) {
          const len = sec(0.026);
          const ev = new Float32Array(len);
          for (let j = 0; j < len; j++) ev[j] = Math.sin((TAU * b.f * j) / SR) * Math.pow(Math.sin((Math.PI * j) / len), 2);
          addAt(out, sec(t + p * 0.044), ev, b.g * (0.8 + r() * 0.2));
        }
        t += b.rate * (0.85 + r() * 0.3);
      }
    }
    return normalize(out, 0.7);
  },
  windLeaves(r) {
    const N = sec(16);
    const wind = circ(pink(N, r), (d) => hp(lp(d, 1100), 120));
    const rustle = circ(white(N, r), (d) => hp(d, 2600));
    const g = circ(new Float32Array(N), () => grain(N * 2, r, 12, 45, 2));
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const gust = (0.5 + 0.5 * Math.sin(TAU * 2 * u + 0.3)) * 0.6 + (0.5 + 0.5 * Math.sin(TAU * 5 * u + 1)) * 0.4;
      out[i] = wind[i] * (0.3 + 0.7 * gust) * 1.4 + rustle[i] * g[i] * gust * gust * 0.5;
    }
    return normalize(out, 0.85);
  },
  logDrop(r) {
    const N = sec(14);
    const out = new Float32Array(N);
    const drop = (t: number, amp: number) => {
      const slide = lp(white(sec(0.35), r), 900);
      for (let j = 0; j < slide.length; j++) slide[j] *= Math.sin((Math.PI * j) / slide.length) * 0.5;
      addAt(out, sec(t - 0.3), slide, amp);
      addAt(out, sec(t), thump(r, 110, 62, 0.09, 0.6), amp);
      addAt(out, sec(t + 0.08), thump(r, 230, 180, 0.03, 0.2), amp * 0.4);
      for (let k = 0; k < 70; k++) {
        const dt = Math.pow(r(), 1.8) * 2.8;
        addAt(out, sec(t + 0.1 + dt), crackle(r, 30 + Math.floor(r() * 300)), amp * (0.7 - dt * 0.2) * Math.pow(r(), 2));
      }
    };
    drop(1.6, 1);
    drop(8.6, 0.6);
    return normalize(out, 0.85);
  },
  deepHum(r) {
    const N = sec(16);
    const low = circ(brown(N, r), (d) => lp(lp(d, 130), 130));
    normalize(low, 0.6);
    const mid = circ(pink(N, r), (d) => lp(d, 380));
    normalize(mid, 0.18);
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const t = i / SR;
      const sw = 0.7 + 0.3 * Math.sin(TAU * 2 * u);
      out[i] = (low[i] + mid[i] * (0.6 + 0.4 * Math.sin(TAU * 3 * u + 2))) * sw + (Math.sin(TAU * 50 * t) * 0.12 + Math.sin(TAU * 75 * t) * 0.06) * (0.6 + 0.4 * Math.sin(TAU * u));
    }
    return normalize(out, 0.85);
  },
  bubbles(r) {
    const N = sec(10);
    const out = circ(pink(N, r), (d) => lp(d, 300));
    normalize(out, 0.05);
    for (let c = 0; c < 4; c++) {
      let t = r() * 10;
      const count = 4 + Math.floor(r() * 7);
      for (let k = 0; k < count; k++) {
        addAt(out, sec(t), bubble(350 + r() * 800, 0.04 + r() * 0.06), 0.4 + r() * 0.6);
        t += 0.03 + r() * 0.12;
      }
    }
    for (let k = 0; k < 8; k++) addAt(out, sec(r() * 10), bubble(300 + r() * 500, 0.06 + r() * 0.05), 0.3 + r() * 0.4);
    return normalize(out, 0.75);
  },
  gentleWaves(r) {
    const N = sec(14);
    const body = circ(pink(N, r), (d) => hp(lp(d, 520), 60));
    const wash = circ(pink(N, r), (d) => lp(d, 2000));
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const e = Math.pow(0.5 - 0.5 * Math.cos(TAU * 2 * u), 1.6) * 0.8 + 0.2;
      out[i] = body[i] * e + wash[i] * e * e * e * 0.25;
    }
    return normalize(out, 0.85);
  },
  whaleSong() {
    const N = sec(20);
    const out = new Float32Array(N);
    const call = (t: number, dur: number, f0: number, f1: number, f2: number, amp: number) => {
      const ev = glide(
        sec(dur),
        (u) => ((1 - u) ** 2 * f0 + 2 * u * (1 - u) * f1 + u * u * f2) * (1 + 0.015 * Math.sin(TAU * 4 * u * dur)),
        (u) => Math.pow(Math.sin(Math.PI * u), 0.8),
        [1, 0.35, 0.15],
      );
      addAt(out, sec(t), ev, amp);
    };
    call(1, 3.2, 160, 340, 210, 1);
    call(6, 2.4, 260, 420, 300, 0.6);
    call(13, 3.6, 140, 260, 120, 0.9);
    call(10.2, 0.6, 3000, 5200, 3600, 0.08);
    call(10.9, 0.45, 3400, 5000, 4200, 0.06);
    const wet = reverb(out, 0.65, 1.6, 0.86);
    const res = circ(wet, (d) => lp(d, 1800));
    return normalize(res, 0.85);
  },
  fishSwish(r) {
    const N = sec(10);
    const out = circ(pink(N, r), (d) => lp(d, 250));
    normalize(out, 0.04);
    for (let k = 0; k < 4; k++) {
      const len = sec(0.35 + r() * 0.25);
      const lo = 250 + r() * 200;
      const hi = 1100 + r() * 600;
      const sw = band(white(len, r), (i) => lo + (hi - lo) * (i / len), 0.7);
      for (let j = 0; j < len; j++) sw[j] *= Math.pow(Math.sin((Math.PI * j) / len), 2);
      addAt(out, sec(1 + k * 2.4 + r() * 0.8), sw, 0.6 + r() * 0.4);
    }
    return normalize(out, 0.75);
  },
  pageTurn(r) {
    const N = sec(12);
    const out = new Float32Array(N);
    for (const t of [1.0, 5.2, 9.0]) {
      const len = sec(0.75);
      const nz = band(hp(white(len, r), 700), (i) => 2200 + 2000 * (i / len), 0.9);
      const g = grain(len, r, 3, 220, 1.5);
      for (let j = 0; j < len; j++) {
        const u = j / len;
        const slide = u < 0.72 ? 0.25 * Math.sin((Math.PI * u) / 0.72) + 0.08 : 0;
        const flip = u >= 0.7 ? Math.exp(-(u - 0.7) * 22) : 0;
        nz[j] *= (slide + flip) * (0.4 + g[j]);
      }
      addAt(out, sec(t + r() * 0.3), nz, 1);
    }
    return normalize(reverb(out, 0.12, 0.6), 0.85);
  },
  bookShelf(r) {
    const N = sec(14);
    const out = new Float32Array(N);
    for (const [t, a] of [[2, 1], [8.5, 0.8]] as const) {
      const len = sec(0.55);
      const slide = lp(band(white(len, r), (i) => 1300 + 500 * (i / len), 1.7), 4200);
      const g = grain(len, r, 6, 120, 1);
      for (let j = 0; j < len; j++) slide[j] *= Math.pow(Math.sin((Math.PI * j) / len), 1.5) * (0.5 + 0.5 * g[j]);
      addAt(out, sec(t), slide, a * 0.55);
      // 둔탁한 '쿵' 대신 종이가 맞닿는 가벼운 '톡'
      const tap = lp(white(sec(0.05), r), 2400);
      for (let j = 0; j < tap.length; j++) tap[j] *= Math.exp(-j / (SR * 0.008));
      addAt(out, sec(t + 0.55), tap, a * 0.35);
      addAt(out, sec(t + 0.55), thump(r, 320, 250, 0.012, 0.1), a * 0.12);
    }
    return normalize(reverb(out, 0.15, 0.6), 0.75);
  },
  pencil(r) {
    const N = sec(12);
    const out = new Float32Array(N);
    const src = circ(white(N, r), (d) => lp(hp(d, 2800), 7000));
    let t = 0.4;
    while (t < 11.2) {
      const strokes = 3 + Math.floor(r() * 5);
      for (let s = 0; s < strokes; s++) {
        const dur = 0.08 + r() * 0.22;
        const len = sec(dur);
        const g = grain(len, r, 1.5, 600, 1);
        const st = sec(t);
        const ev = new Float32Array(len);
        for (let j = 0; j < len; j++) {
          const env = Math.min(1, j / sec(0.01)) * Math.min(1, (len - j) / sec(0.02));
          ev[j] = src[(st + j) % N] * env * (0.3 + 0.7 * g[j]);
        }
        addAt(out, st, ev, 0.6 + r() * 0.4);
        t += dur + 0.04 + r() * 0.08;
      }
      t += 0.6 + r() * 0.9;
    }
    return normalize(reverb(out, 0.08, 0.5), 0.75);
  },
  teacup(r) {
    const N = sec(14);
    const out = new Float32Array(N);
    const clink = () => {
      const len = sec(0.5);
      const ev = new Float32Array(len);
      const parts: [number, number, number][] = [[2350, 1, 0.3], [3620, 0.6, 0.2], [5180, 0.35, 0.12], [820, 0.3, 0.1]];
      for (let j = 0; j < len; j++) {
        const t = j / SR;
        for (const [f, a, d] of parts) ev[j] += Math.sin(TAU * f * t) * a * Math.exp(-t / d);
      }
      return ev;
    };
    for (const t of [2, 8.8]) {
      addAt(out, sec(t), clink(), 0.55);
      addAt(out, sec(t), thump(r, 420, 300, 0.012, 0.6), 0.5);
      addAt(out, sec(t + 0.075), clink(), 0.22);
    }
    return normalize(reverb(out, 0.18, 0.6), 0.75);
  },
  rain(r) {
    const N = sec(12);
    const bed = circ(pink(N, r), (d) => lp(hp(d, 400), 5000));
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) out[i] = bed[i] * (0.85 + 0.15 * Math.sin((TAU * 3 * i) / N)) * 0.6;
    for (let k = 0; k < 12 * 90; k++) {
      const len = sec(0.002 + r() * 0.006);
      addAt(out, Math.floor(r() * N), crackle(r, len), Math.pow(r(), 2) * 0.45);
    }
    for (let k = 0; k < 12 * 9; k++) {
      const f = 2500 + r() * 2500;
      addAt(out, Math.floor(r() * N), glide(sec(0.015), () => f, (u) => Math.exp(-u * 6)), 0.05 + r() * 0.08);
    }
    return normalize(out, 0.8);
  },
  footsteps(r) {
    const N = sec(12);
    const out = new Float32Array(N);
    for (let k = 0; k < 6; k++) {
      const t = 1 + k * 0.6 + r() * 0.04;
      const a = 0.7 + r() * 0.3;
      addAt(out, sec(t), thump(r, 125, 72, 0.035, 0.6), a);
      addAt(out, sec(t + 0.07), thump(r, 160, 110, 0.02, 0.4), a * 0.35);
    }
    for (const t of [2.2, 7.4]) {
      const len = sec(0.45);
      const saw = new Float32Array(len);
      let ph = 0;
      for (let j = 0; j < len; j++) {
        const u = j / len;
        ph += (180 + 60 * u) / SR;
        saw[j] = ((ph % 1) * 2 - 1) * Math.sin(Math.PI * u) * (0.6 + 0.4 * r());
      }
      addAt(out, sec(t), band(saw, 900, 0.5), 0.12);
    }
    return normalize(reverb(out, 0.22, 0.8), 0.85);
  },
  /* ===== WORLD 04 구름 위 낮잠 정거장 ===== */
  skyWind(r) {
    const N = sec(16);
    const bed = circ(pink(N, r), (d) => lp(hp(d, 350), 2800));
    const whistle = normalize(circ(white(N, r), (d) => band(d, (i) => 760 + 320 * Math.sin((TAU * 2 * (i % N)) / N), 0.06)), 1);
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const g = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(TAU * 2 * u)) * (0.6 + 0.4 * Math.sin(TAU * 3 * u + 1));
      out[i] = bed[i] * g + whistle[i] * 0.07 * g * g;
    }
    return normalize(out, 0.85);
  },
  windChime(r) {
    const N = sec(18);
    const out = new Float32Array(N);
    const notes = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093];
    let t = 0.5;
    while (t < 17) {
      const n = 1 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const f = notes[Math.floor(r() * notes.length)];
        const len = sec(3);
        const ev = new Float32Array(len);
        for (let j = 0; j < len; j++) {
          const s = j / SR;
          ev[j] = (Math.sin(TAU * f * s) * Math.exp(-s / 1.2) + 0.45 * Math.sin(TAU * f * 2.76 * s) * Math.exp(-s / 0.45) + 0.2 * Math.sin(TAU * f * 5.4 * s) * Math.exp(-s / 0.18)) * Math.min(1, s / 0.002);
        }
        addAt(out, sec(t), ev, 0.3 + r() * 0.7);
        t += 0.12 + r() * 0.25;
      }
      t += 1.4 + r() * 2.8;
    }
    return normalize(reverb(out, 0.3, 1.1), 0.7);
  },
  birds(r) {
    const N = sec(16);
    const out = new Float32Array(N);
    for (let b = 0; b < 3; b++) {
      const base = 2800 + r() * 1400;
      const amp = 0.4 + r() * 0.6;
      let t = r() * 4;
      while (t < 16) {
        const n = 2 + Math.floor(r() * 4);
        for (let k = 0; k < n; k++) {
          const dur = 0.05 + r() * 0.07;
          const dir = r() < 0.5 ? -1 : 1;
          const f0 = base * (0.9 + r() * 0.2);
          addAt(out, sec(t), glide(sec(dur), (u) => f0 * (1 + dir * 0.4 * u), (u) => Math.pow(Math.sin(Math.PI * u), 1.5), [1, 0.15]), amp);
          t += dur + 0.06 + r() * 0.09;
        }
        t += 2.5 + r() * 4;
      }
    }
    return normalize(reverb(out, 0.25, 1.2), 0.7);
  },
  clothFlap(r) {
    const N = sec(14);
    const src = circ(white(N, r), (d) => band(d, 520, 0.9));
    const low = circ(brown(N, r), (d) => lp(d, 250));
    normalize(src, 1);
    normalize(low, 1);
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const g = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(TAU * 2 * u + 0.4)) * (0.6 + 0.4 * Math.sin(TAU * 3 * u));
      const fl = 0.5 + 0.5 * Math.sin(TAU * 126 * u + 2 * Math.sin(TAU * 10 * u));
      out[i] = src[i] * g * (0.25 + 0.75 * fl * fl * fl) + low[i] * 0.25 * g;
    }
    for (let k = 0; k < 5; k++) {
      const len = sec(0.04);
      const s = band(white(len, r), 900, 0.7);
      for (let j = 0; j < len; j++) s[j] *= Math.exp(-j / (SR * 0.008));
      addAt(out, Math.floor(r() * N), s, 1.2);
    }
    return normalize(out, 0.8);
  },
  distantBell(r) {
    const N = sec(20);
    const out = new Float32Array(N);
    const ratios: [number, number, number][] = [[0.5, 0.6, 6], [1, 1, 4], [1.2, 0.5, 3], [1.5, 0.4, 2.5], [2, 0.35, 2], [2.5, 0.2, 1.5], [3, 0.15, 1]];
    const bell = (f0: number) => {
      const len = sec(7);
      const ev = new Float32Array(len);
      for (let j = 0; j < len; j++) {
        const s = j / SR;
        for (const [k, a, d] of ratios) ev[j] += Math.sin(TAU * f0 * k * s) * a * Math.exp(-s / d);
        ev[j] *= Math.min(1, s / 0.003);
      }
      return ev;
    };
    const b = bell(330 + r() * 10);
    for (const t of [1.0, 4.2, 7.4]) addAt(out, sec(t), b, 0.8);
    const res = circ(out, (d) => lp(d, 2200));
    return normalize(reverb(res, 0.55, 1.8, 0.85), 0.75);
  },

  /* ===== WORLD 05 비밀의 이끼 정원 ===== */
  leafRustle(r) {
    const N = sec(14);
    const base = circ(white(N, r), (d) => lp(hp(d, 1800), 8000));
    const out = new Float32Array(N);
    const dens = (u: number) => (0.5 + 0.5 * Math.sin(TAU * 3 * u)) * (0.5 + 0.5 * Math.sin(TAU * 5 * u + 2));
    for (let i = 0; i < N; i++) out[i] = base[i] * 0.04 * (0.3 + dens(i / N));
    for (let k = 0; k < 14 * 70; k++) {
      const st = Math.floor(r() * N);
      if (r() > 0.15 + dens(st / N)) continue;
      const len = sec(0.01 + r() * 0.04);
      const ev = new Float32Array(len);
      for (let j = 0; j < len; j++) ev[j] = base[(st + j) % N] * Math.exp(-j / (len * 0.35));
      addAt(out, st, ev, Math.pow(r(), 2));
    }
    return normalize(out, 0.8);
  },
  woodpecker(r) {
    const N = sec(14);
    const out = new Float32Array(N);
    for (const t0 of [1.5, 6.8, 11.0]) {
      const count = 12 + Math.floor(r() * 7);
      const rate = 16 + r() * 4;
      for (let k = 0; k < count; k++) {
        const len = sec(0.03);
        const ev = band(white(len, r), 1100, 0.5);
        for (let j = 0; j < len; j++) ev[j] = ev[j] * Math.exp(-j / (SR * 0.004)) * 3 + Math.sin((TAU * 900 * j) / SR) * Math.exp(-j / (SR * 0.006)) * 0.5;
        addAt(out, sec(t0 + k / rate), ev, 1 - (k / count) * 0.6);
      }
    }
    return normalize(reverb(out, 0.35, 1.3), 0.75);
  },
  songbirds(r) {
    const N = sec(16);
    const out = new Float32Array(N);
    for (let b = 0; b < 4; b++) {
      const base = 2400 + r() * 2200;
      const amp = 0.35 + r() * 0.65;
      let t = r() * 3;
      while (t < 16) {
        const kind = r();
        if (kind < 0.4) {
          const n = 6 + Math.floor(r() * 7);
          const hi = base * 1.25;
          for (let k = 0; k < n; k++) {
            const f = k % 2 ? hi : base;
            addAt(out, sec(t), glide(sec(0.035), () => f, (u) => Math.sin(Math.PI * u)), amp * 0.8);
            t += 0.045;
          }
        } else if (kind < 0.75) {
          const dur = 0.3 + r() * 0.3;
          addAt(out, sec(t), glide(sec(dur), (u) => base * (1 + 0.3 * Math.sin(Math.PI * u)) * (1 + 0.04 * Math.sin(TAU * 25 * u * dur)), (u) => Math.pow(Math.sin(Math.PI * u), 0.8), [1, 0.12]), amp);
          t += dur;
        } else {
          for (let k = 0; k < 3; k++) {
            const f0 = base * (1 - k * 0.08);
            addAt(out, sec(t), glide(sec(0.09), (u) => f0 * (1.3 - 0.4 * u), (u) => Math.sin(Math.PI * u)), amp);
            t += 0.14;
          }
        }
        t += 1.2 + r() * 2.5;
      }
    }
    return normalize(reverb(out, 0.22, 1.1), 0.7);
  },
  grassSteps(r) {
    const N = sec(12);
    const out = new Float32Array(N);
    for (let k = 0; k < 8; k++) {
      const len = sec(0.18);
      const ev = band(white(len, r), 2600, 1.2);
      const g = grain(len, r, 2, 400, 2);
      for (let j = 0; j < len; j++) ev[j] *= g[j] * Math.min(1, j / sec(0.02)) * Math.exp(-j / (len * 0.4)) * 3;
      const t = 0.8 + k * 0.58 + r() * 0.04;
      const a = 0.6 + r() * 0.4;
      addAt(out, sec(t), ev, a);
      addAt(out, sec(t), thump(r, 90, 60, 0.03, 0.3), a * 0.2);
    }
    return normalize(reverb(out, 0.1, 0.8), 0.75);
  },
  bambooChime(r) {
    const N = sec(16);
    const out = new Float32Array(N);
    const tones = [520, 620, 700, 830, 930];
    let t = 0.6;
    while (t < 15.5) {
      const n = 2 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const f = tones[Math.floor(r() * tones.length)];
        const len = sec(0.7);
        const ev = new Float32Array(len);
        for (let j = 0; j < len; j++) {
          const s = j / SR;
          ev[j] = (Math.sin(TAU * f * s) + 0.25 * Math.sin(TAU * f * 2.7 * s) * Math.exp(-s / 0.08)) * Math.exp(-s / 0.22) * Math.min(1, s / 0.002);
        }
        const click = band(white(sec(0.008), r), 1500, 0.6);
        addAt(out, sec(t), ev, 0.5 + r() * 0.5);
        addAt(out, sec(t), click, 0.5);
        t += 0.08 + r() * 0.14;
      }
      t += 1.8 + r() * 2.4;
    }
    return normalize(reverb(out, 0.2, 0.9), 0.75);
  },

  /* ===== WORLD 06 달빛 기차역 ===== */
  trainRumble(r) {
    const N = sec(24);
    const low = circ(brown(N, r), (d) => lp(d, 180));
    const mid = circ(pink(N, r), (d) => band(d, 450, 0.6));
    normalize(low, 1);
    normalize(mid, 1);
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const pass = 0.22 + 0.78 * Math.exp(-(((u - 0.5) / 0.18) ** 2));
      const rattle = 0.6 + 0.4 * Math.sin(TAU * 24 * 6 * u);
      out[i] = low[i] * pass + mid[i] * pass * pass * 0.45 * rattle;
    }
    for (let t = 7; t < 17; t += 0.55) addAt(out, sec(t), thump(r, 140, 90, 0.03, 0.4), 0.25 * Math.exp(-(((t - 12) / 3) ** 2)));
    return normalize(circ(out, (d) => lp(d, 1200)), 0.85);
  },
  railClack(r) {
    const N = sec(12);
    const out = circ(brown(N, r), (d) => lp(d, 220));
    normalize(out, 0.2);
    const clack = (amp: number, t: number) => {
      addAt(out, sec(t), thump(r, 170, 110, 0.03, 0.6), amp);
      const n = band(white(sec(0.015), r), 1800, 0.7);
      addAt(out, sec(t), n, amp * 0.6);
      addAt(out, sec(t), glide(sec(0.04), () => 2300, (u) => Math.exp(-u * 5)), amp * 0.12);
    };
    for (let k = 0; k < 10; k++) {
      const t = k * 1.2 + r() * 0.02;
      clack(1, t);
      clack(0.8, t + 0.14);
      clack(0.55, t + 0.55);
      clack(0.45, t + 0.69);
    }
    return normalize(out, 0.85);
  },
  clockTick(r) {
    const N = sec(12);
    const out = new Float32Array(N);
    for (let s = 0; s < 12; s++) {
      const len = sec(0.03);
      const ev = band(white(len, r), s % 2 ? 2800 : 2300, 0.4);
      const f = s % 2 ? 3400 : 2900;
      for (let j = 0; j < len; j++) ev[j] = ev[j] * Math.exp(-j / (SR * 0.0025)) * 3 + Math.sin((TAU * f * j) / SR) * Math.exp(-j / (SR * 0.008)) * 0.3;
      addAt(out, sec(s), ev, 1);
    }
    return normalize(reverb(out, 0.15, 0.6), 0.6);
  },
  platformSteps(r) {
    const N = sec(14);
    const out = new Float32Array(N);
    for (let k = 0; k < 7; k++) {
      const t = 1 + k * 0.62 + r() * 0.03;
      const a = 0.7 + r() * 0.3;
      addAt(out, sec(t), thump(r, 170, 105, 0.025, 0.4), a);
      const c = hp(white(sec(0.008), r), 2500);
      for (let j = 0; j < c.length; j++) c[j] *= 1 - j / c.length;
      addAt(out, sec(t), c, a * 0.5);
    }
    return normalize(reverb(out, 0.4, 1.6, 0.82), 0.8);
  },
  announcement(r) {
    const N = sec(22);
    const out = new Float32Array(N);
    const tone = (f: number) => glide(sec(1.4), () => f, (u) => Math.exp(-u * 4) * Math.min(1, u / 0.003), [1, 0.2]);
    addAt(out, sec(1.0), tone(784), 0.6);
    addAt(out, sec(1.6), tone(659), 0.6);
    let t = 2.8;
    while (t < 8) {
      const dur = 0.12 + r() * 0.1;
      const len = sec(dur);
      const p0 = 170 + r() * 70;
      const saw = new Float32Array(len);
      let ph = 0;
      for (let j = 0; j < len; j++) {
        ph += (p0 * (1 - 0.1 * (j / len))) / SR;
        saw[j] = (ph % 1) * 2 - 1;
      }
      const f1 = band(saw, 500 + r() * 300, 0.3);
      const f2 = band(saw, 1100 + r() * 800, 0.3);
      const ev = new Float32Array(len);
      for (let j = 0; j < len; j++) ev[j] = (f1[j] + f2[j] * 0.6) * Math.pow(Math.sin((Math.PI * j) / len), 0.6);
      addAt(out, sec(t), ev, 0.5);
      t += dur + 0.03 + r() * 0.05 + (r() < 0.15 ? 0.25 : 0);
    }
    const pa = circ(out, (d) => hp(lp(d, 2800), 300));
    return normalize(reverb(pa, 0.5, 1.8, 0.85), 0.7);
  },
  trainDoor(r) {
    const N = sec(18);
    const out = new Float32Array(N);
    const hiss = (t: number, a: number) => {
      const len = sec(0.6);
      const h = hp(white(len, r), 2500);
      for (let j = 0; j < len; j++) h[j] *= Math.exp(-j / (len * 0.35));
      addAt(out, sec(t), h, a);
    };
    const slide = (t: number) => {
      const len = sec(0.7);
      const s = band(white(len, r), 700, 0.8);
      const g = grain(len, r, 4, 150, 1);
      for (let j = 0; j < len; j++) s[j] *= Math.sin((Math.PI * j) / len) * (0.4 + g[j]) * 2;
      addAt(out, sec(t), s, 0.6);
    };
    hiss(2.0, 0.5);
    slide(2.15);
    addAt(out, sec(2.85), thump(r, 140, 90, 0.04, 0.6), 0.8);
    for (const b of [10.0, 10.3, 10.6]) addAt(out, sec(b), glide(sec(0.12), () => 1046, (u) => Math.min(1, u / 0.05) * (1 - u)), 0.3);
    slide(11.0);
    addAt(out, sec(11.7), thump(r, 140, 90, 0.04, 0.6), 1);
    hiss(11.75, 0.3);
    return normalize(reverb(out, 0.25, 1.3), 0.8);
  },
};

const SFX: Record<SfxKind, (r: Rand) => Buf> = {
  pop: () => glide(sec(0.16), (u) => 520 + 900 * u, (u) => Math.min(1, u / 0.05) * Math.exp(-u * 5)),
  chime: () => {
    const len = sec(1.2);
    const b = new Float32Array(len);
    for (let j = 0; j < len; j++) {
      const t = j / SR;
      b[j] = (Math.sin(TAU * 1320 * t) + 0.5 * Math.sin(TAU * 1980 * t) + 0.25 * Math.sin(TAU * 2640 * t)) * Math.exp(-t / 0.35) * Math.min(1, t / 0.004);
    }
    return b;
  },
  bubble: (r) => {
    const out = new Float32Array(sec(0.7));
    let t = 0;
    for (let k = 0; k < 5; k++) {
      addAt(out, sec(t), bubble(450 + r() * 600, 0.06), 0.7);
      t += 0.06 + r() * 0.08;
    }
    return out;
  },
  log: (r) => {
    const out = new Float32Array(sec(1.6));
    addAt(out, 0, thump(r, 110, 62, 0.09, 0.6), 1);
    for (let k = 0; k < 40; k++) addAt(out, sec(0.1 + r() * 1.3), crackle(r, 30 + Math.floor(r() * 250)), Math.pow(r(), 2) * 0.8);
    return out;
  },
  book: (r) => {
    // 부드러운 종이 스침 (천천히 시작해서 사르르)
    const len = sec(0.45);
    const nz = lp(band(white(len, r), (i) => 1800 + 900 * (i / len), 1.4), 5000);
    for (let j = 0; j < len; j++) {
      const u = j / len;
      nz[j] *= Math.min(1, u / 0.15) * Math.exp(-u * 4);
    }
    return nz;
  },
  honk: () => {
    // 장난감 버스 '빵빵'
    const out = new Float32Array(sec(0.42));
    const beep = () =>
      glide(sec(0.13), (u) => 700 * (1 - 0.04 * u), (u) => Math.min(1, u / 0.06) * Math.min(1, (1 - u) / 0.25), [1, 0.55, 0.35, 0.22, 0.14]);
    const low = () => glide(sec(0.13), (u) => 560 * (1 - 0.04 * u), (u) => Math.min(1, u / 0.06) * Math.min(1, (1 - u) / 0.25), [1, 0.5, 0.3]);
    for (const t of [0, 0.2]) {
      addAt(out, sec(t), beep(), 0.6);
      addAt(out, sec(t), low(), 0.45);
    }
    return out;
  },
  meow: () => {
    // 고양이 '냐옹': 올라갔다 내려오는 음 + 입 모양 울림
    const len = sec(0.62);
    const raw = new Float32Array(len);
    let ph = 0;
    for (let j = 0; j < len; j++) {
      const u = j / len;
      const f = (u < 0.3 ? 520 + 330 * (u / 0.3) : 850 - 380 * ((u - 0.3) / 0.7)) * (1 + 0.012 * Math.sin(TAU * 6 * u * 0.62));
      ph += f / SR;
      let v = 0;
      for (let k = 1; k <= 8; k++) v += Math.sin(TAU * ph * k) / k;
      raw[j] = v * Math.min(1, u / 0.06) * Math.pow(1 - u, 0.6) * (u < 0.12 ? 0.55 + 0.45 * (u / 0.12) : 1);
    }
    const f1 = band(raw, (i) => 900 + 500 * Math.sin(Math.PI * (i / len)), 0.5);
    const f2 = band(raw, 2600, 0.7);
    const out = new Float32Array(len);
    for (let j = 0; j < len; j++) out[j] = f1[j] + f2[j] * 0.5 + raw[j] * 0.08;
    return reverb(out, 0.12, 0.5);
  },
  jelly: (r) => {
    // 해파리 '뽀용': 물속에서 몽글몽글
    const len = sec(0.55);
    const out = glide(
      len,
      (u) => (u < 0.45 ? 260 + 300 * (u / 0.45) : 560 - 140 * ((u - 0.45) / 0.55)) * (1 + 0.05 * Math.sin(TAU * 16 * u * 0.55)),
      (u) => Math.min(1, u / 0.08) * Math.pow(1 - u, 1.2),
      [1, 0.25],
    );
    addAt(out, sec(0.12), bubble(700 + r() * 200, 0.05), 0.3);
    addAt(out, sec(0.3), bubble(900 + r() * 200, 0.05), 0.25);
    return lp(out, 1600);
  },
  sparkle: (r) => {
    // 요정 '샤라랑': 빠르게 올라가는 반짝임
    const notes = [1319, 1568, 1760, 2093, 2349, 2637, 3136];
    const out = new Float32Array(sec(1.0));
    notes.forEach((f, i) => addAt(out, sec(i * 0.045), glide(sec(0.35), () => f, (u) => Math.exp(-u * 7) * Math.min(1, u / 0.01), [1, 0.15]), 0.5 - i * 0.03));
    const sh = hp(white(sec(0.6), r), 6000);
    for (let j = 0; j < sh.length; j++) sh[j] *= Math.min(1, j / sec(0.1)) * Math.exp(-j / sec(0.18)) * (0.5 + 0.5 * Math.sin(j / 9));
    addAt(out, sec(0.05), sh, 0.25);
    return reverb(out, 0.25, 0.7);
  },
  whale: () => {
    // 멀리서 들리는 고래 울음
    const len = sec(2.2);
    const call = glide(
      sec(1.6),
      (u) => ((1 - u) ** 2 * 170 + 2 * u * (1 - u) * 330 + u * u * 200) * (1 + 0.015 * Math.sin(TAU * 4 * u * 1.6)),
      (u) => Math.pow(Math.sin(Math.PI * u), 0.8),
      [1, 0.35, 0.15],
    );
    const out = new Float32Array(len);
    addAt(out, 0, call, 1);
    return lp(reverb(out, 0.55, 1.6, 0.84), 1800);
  },
  vending: (r) => {
    // 자판기: 버튼 '삑' → 캔이 '덜컹' 떨어지고 '데굴'
    const out = new Float32Array(sec(1.1));
    addAt(out, 0, glide(sec(0.09), () => 1320, (u) => Math.min(1, u / 0.05) * (1 - u)), 0.35);
    addAt(out, sec(0.38), thump(r, 170, 95, 0.045, 0.6), 0.9);
    const ring = new Float32Array(sec(0.25));
    for (let j = 0; j < ring.length; j++) {
      const t = j / SR;
      ring[j] = (Math.sin(TAU * 880 * t) + 0.6 * Math.sin(TAU * 1460 * t)) * Math.exp(-t / 0.06);
    }
    addAt(out, sec(0.38), ring, 0.25);
    for (const [t, a] of [[0.52, 0.35], [0.62, 0.25], [0.7, 0.18], [0.85, 0.3]] as const) addAt(out, sec(t), thump(r, 240, 160, 0.02, 0.4), a);
    return out;
  },
  tweet: () => {
    const out = new Float32Array(sec(0.3));
    addAt(out, 0, glide(sec(0.09), (u) => 2800 + 1400 * u, (u) => Math.sin(Math.PI * u)), 1);
    addAt(out, sec(0.13), glide(sec(0.1), (u) => 3400 - 600 * u, (u) => Math.sin(Math.PI * u)), 0.8);
    return out;
  },
  whistle: () =>
    glide(sec(1.1), (u) => 523 * (1 + 0.006 * Math.sin(TAU * 6 * u)), (u) => Math.min(1, u / 0.08) * Math.min(1, (1 - u) / 0.3), [1, 0.5, 0.25]),
  splash: (r) => {
    const len = sec(0.5);
    const nz = band(white(len, r), (i) => 1400 - 900 * (i / len), 0.8);
    for (let j = 0; j < len; j++) nz[j] *= Math.sin((Math.PI * j) / len) ** 2;
    return nz;
  },
};

let seed = 7;
export function synthLoop(kind: SynthKind): Buf {
  return GENERATORS[kind](makeRng(seed++ * 9973));
}
export function synthSfx(kind: SfxKind): Buf {
  return normalize(SFX[kind](makeRng(seed++ * 7919)), 0.7);
}
