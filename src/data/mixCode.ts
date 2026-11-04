import type { SoundMix, WorldDef } from '../types';

/**
 * 믹스를 짧은 코드로 바꿔 링크에 담습니다.
 * 사운드 순서대로 볼륨(0~100)을 '-'로 이어 붙이고, 0이면 꺼진 소리예요. 예: 75-40-35-0-50
 */
export function encodeMix(world: WorldDef, mix: Record<string, SoundMix>) {
  return world.sounds.map((s) => (mix[s.id]?.on ? Math.max(1, Math.round((mix[s.id].volume ?? 0) * 100)) : 0)).join('-');
}

export function decodeMix(world: WorldDef, code: string): Record<string, SoundMix> | null {
  const nums = code.split('-').map((x) => Number(x));
  if (nums.length !== world.sounds.length || nums.some((n) => !Number.isFinite(n) || n < 0 || n > 100)) return null;
  return Object.fromEntries(
    world.sounds.map((s, i) => [s.id, nums[i] > 0 ? { on: true, volume: nums[i] / 100 } : { on: false, volume: s.defaultVolume }]),
  );
}

export function shareUrl(world: WorldDef, mix: Record<string, SoundMix>) {
  const base = window.location.href.split('#')[0];
  return `${base}#/world/${world.id}/mix/${encodeMix(world, mix)}`;
}
