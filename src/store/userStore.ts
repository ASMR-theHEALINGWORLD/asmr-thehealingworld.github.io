/**
 * 사용자 데이터 — 로그인 없이 이 브라우저에만 저장됩니다.
 * (즐겨찾기, 최근 월드, 믹스 프리셋, 내 캐릭터, 힐링 기록, 설정)
 */
import type { HairStyle } from '../three/Character';
import type { SoundMix } from '../types';
import { createStore, readLocal, useStore, writeLocal } from './createStore';
import { addDays, dayKey } from './dates';

export type MoodId = 'tired' | 'anxious' | 'sleepless' | 'focus' | 'empty' | 'lonely' | 'good';

export interface Preset {
  id: string;
  name: string;
  worldId: string;
  mix: Record<string, SoundMix>;
}

export interface Avatar {
  enabled: boolean;
  hairStyle: HairStyle;
  hair: string;
  top: string;
  bottom: string;
  bottomType: 'skirt' | 'pants';
}

export interface DayRecord {
  sec: number;
  mood?: MoodId;
  visited?: boolean;
}

export interface UserData {
  v: 1;
  favorites: string[];
  recent: string[];
  presets: Preset[];
  avatar: Avatar;
  settings: { lowSpec: boolean; seasonal: 'auto' | 'off' };
  days: Record<string, DayRecord>;
  worlds: Record<string, { sec: number; visits: number }>;
  found: Record<string, boolean>;
}

const KEY = 'healing-world:user:v1';

export const DEFAULT_AVATAR: Avatar = {
  enabled: false,
  hairStyle: 'bob',
  hair: '#6b4a3a',
  top: '#ffd08a',
  bottom: '#9db8e8',
  bottomType: 'pants',
};

const initial = (): UserData => ({
  v: 1,
  favorites: [],
  recent: [],
  presets: [],
  avatar: DEFAULT_AVATAR,
  settings: { lowSpec: false, seasonal: 'auto' },
  days: {},
  worlds: {},
  found: {},
});

function load(): UserData {
  const saved = readLocal<Partial<UserData>>(KEY);
  const base = initial();
  if (!saved || saved.v !== 1) return base;
  return {
    ...base,
    ...saved,
    avatar: { ...base.avatar, ...saved.avatar },
    settings: { ...base.settings, ...saved.settings },
  } as UserData;
}

export const userStore = createStore<UserData>(load());
userStore.subscribe(() => writeLocal(KEY, userStore.get()));

export const useUser = <U,>(sel: (u: UserData) => U) => useStore(userStore, sel);

const update = (fn: (u: UserData) => UserData) => userStore.set(fn);
const today = () => dayKey();
const dayOf = (u: UserData, k = today()): DayRecord => u.days[k] ?? { sec: 0 };

export const userActions = {
  toggleFavorite(worldId: string) {
    update((u) => ({
      ...u,
      favorites: u.favorites.includes(worldId) ? u.favorites.filter((x) => x !== worldId) : [...u.favorites, worldId],
    }));
  },
  /** 월드에 들어갈 때: 최근 목록 + 방문 수 + 오늘 방문 표시 */
  visitWorld(worldId: string) {
    update((u) => ({
      ...u,
      recent: [worldId, ...u.recent.filter((x) => x !== worldId)].slice(0, 6),
      worlds: { ...u.worlds, [worldId]: { sec: u.worlds[worldId]?.sec ?? 0, visits: (u.worlds[worldId]?.visits ?? 0) + 1 } },
      days: { ...u.days, [today()]: { ...dayOf(u), visited: true } },
    }));
  },
  /** 소리를 들은 시간 누적 */
  addListen(worldId: string, sec: number) {
    update((u) => ({
      ...u,
      worlds: { ...u.worlds, [worldId]: { visits: u.worlds[worldId]?.visits ?? 1, sec: (u.worlds[worldId]?.sec ?? 0) + sec } },
      days: { ...u.days, [today()]: { ...dayOf(u), sec: dayOf(u).sec + sec, visited: true } },
    }));
  },
  setMood(mood: MoodId) {
    update((u) => ({ ...u, days: { ...u.days, [today()]: { ...dayOf(u), mood } } }));
  },
  markFound(worldId: string) {
    let isNew = false;
    update((u) => {
      if (u.found[worldId]) return u;
      isNew = true;
      return { ...u, found: { ...u.found, [worldId]: true } };
    });
    return isNew;
  },
  savePreset(worldId: string, name: string, mix: Record<string, SoundMix>) {
    const id = Math.random().toString(36).slice(2, 9);
    update((u) => ({ ...u, presets: [...u.presets, { id, name, worldId, mix }] }));
  },
  deletePreset(id: string) {
    update((u) => ({ ...u, presets: u.presets.filter((p) => p.id !== id) }));
  },
  setAvatar(patch: Partial<Avatar>) {
    update((u) => ({ ...u, avatar: { ...u.avatar, ...patch } }));
  },
  setSettings(patch: Partial<UserData['settings']>) {
    update((u) => ({ ...u, settings: { ...u.settings, ...patch } }));
  },
  resetRecords() {
    update((u) => ({ ...u, days: {}, worlds: {}, found: {}, recent: [] }));
  },
};

/** 오늘까지 이어진 연속 방문 일수 (오늘 아직 안 왔으면 어제까지) */
export function streakOf(u: UserData) {
  let d = new Date();
  if (!u.days[dayKey(d)]?.visited) d = addDays(d, -1);
  let n = 0;
  while (u.days[dayKey(d)]?.visited) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
