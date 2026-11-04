import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { WORLDS, getWorld } from '../data/worlds';
import type { SoundMix } from '../types';

type Mixes = Record<string, Record<string, SoundMix>>;

interface SoundStore {
  activeWorldId: string | null;
  setActiveWorld: (id: string | null) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  muted: boolean;
  toggleMute: () => void;
  mixes: Mixes;
  updateSound: (worldId: string, soundId: string, patch: Partial<SoundMix>) => void;
  resetWorld: (worldId: string) => void;
  /** 프리셋/공유 링크로 월드 믹스 전체를 바꿉니다 */
  setWorldMix: (worldId: string, mix: Record<string, SoundMix>) => void;
}

const STORAGE_KEY = 'healing-world:mix:v1';

const defaults = (): Mixes =>
  Object.fromEntries(
    WORLDS.map((w) => [w.id, Object.fromEntries(w.sounds.map((s) => [s.id, { on: s.defaultOn, volume: s.defaultVolume }]))]),
  );

function loadMixes(): Mixes {
  const base = defaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Mixes;
    for (const w of Object.keys(base)) for (const s of Object.keys(base[w])) if (saved[w]?.[s]) base[w][s] = { ...base[w][s], ...saved[w][s] };
  } catch {
    /* 저장소를 사용할 수 없는 환경 */
  }
  return base;
}

const Ctx = createContext<SoundStore | null>(null);

export function SoundStoreProvider({ children }: { children: ReactNode }) {
  const [activeWorldId, setActiveWorld] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [mixes, setMixes] = useState<Mixes>(loadMixes);

  const updateSound = useCallback((worldId: string, soundId: string, patch: Partial<SoundMix>) => {
    setMixes((m) => ({ ...m, [worldId]: { ...m[worldId], [soundId]: { ...m[worldId][soundId], ...patch } } }));
  }, []);
  const resetWorld = useCallback((worldId: string) => setMixes((m) => ({ ...m, [worldId]: defaults()[worldId] })), []);
  const toggleMute = useCallback(() => setMuted((v) => !v), []);
  const setWorldMix = useCallback((worldId: string, mix: Record<string, SoundMix>) => setMixes((m) => ({ ...m, [worldId]: { ...defaults()[worldId], ...mix } })), []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mixes));
    } catch {
      /* noop */
    }
  }, [mixes]);

  useEffect(() => audioEngine.setMuted(muted), [muted]);

  // 상태 → 오디오 엔진 동기화
  useEffect(() => {
    const world = activeWorldId ? getWorld(activeWorldId) : undefined;
    void audioEngine.sync(world?.id ?? null, world?.sounds ?? [], world ? mixes[world.id] : {}, playing);
  }, [activeWorldId, mixes, playing]);

  const value = useMemo(
    () => ({ activeWorldId, setActiveWorld, playing, setPlaying, muted, toggleMute, mixes, updateSound, resetWorld, setWorldMix }),
    [activeWorldId, playing, muted, toggleMute, mixes, updateSound, resetWorld, setWorldMix],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSoundStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('SoundStoreProvider missing');
  return v;
}
