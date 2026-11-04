import { useEffect, useState } from 'react';

export type DayPhase = 'morning' | 'day' | 'sunset' | 'night';

/** 기기 시간에 따라 하늘 분위기 (메인·월드맵) */
export function dayPhaseOf(d = new Date()): DayPhase {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5 && h < 8) return 'morning';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 19.5) return 'sunset';
  return 'night';
}

export function useDayPhase() {
  const [p, setP] = useState(dayPhaseOf);
  useEffect(() => {
    const id = setInterval(() => setP(dayPhaseOf()), 60_000);
    return () => clearInterval(id);
  }, []);
  return p;
}

export interface SkyPalette {
  bg: string;
  fog: string;
  ambient: number;
  hemi: [string, string, number];
  sun: [string, number];
  sea: string;
  stars: boolean;
}

export const SKY: Record<DayPhase, SkyPalette> = {
  morning: { bg: '#f6e3e8', fog: '#f6e3e8', ambient: 0.75, hemi: ['#fff4f0', '#c9d8ee', 0.8], sun: ['#ffd9c2', 1.6], sea: '#b9dcef', stars: false },
  day: { bg: '#d7eef6', fog: '#d7eef6', ambient: 0.8, hemi: ['#ffffff', '#9fd0e0', 0.8], sun: ['#fff1dc', 1.8], sea: '#9fd8ec', stars: false },
  sunset: { bg: '#f7d2c0', fog: '#f7d2c0', ambient: 0.65, hemi: ['#ffe2cc', '#b9a4cf', 0.75], sun: ['#ffb98a', 1.7], sea: '#c9b7d9', stars: false },
  night: { bg: '#2b3262', fog: '#2b3262', ambient: 0.45, hemi: ['#9aa6e8', '#2a2f55', 0.7], sun: ['#c9d2ff', 0.9], sea: '#3d4a85', stars: true },
};
