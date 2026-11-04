import { useSyncExternalStore } from 'react';

/**
 * 아주 작은 전역 상태 저장소.
 * React 컨텍스트와 달리 3D Canvas 안쪽 컴포넌트에서도 그대로 구독할 수 있어요.
 */
export interface Store<T> {
  get: () => T;
  set: (fn: (s: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (fn) => {
      const next = fn(state);
      if (next === state) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export function useStore<T, U>(store: Store<T>, selector: (s: T) => U): U {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()), () => selector(store.get()));
}

/** localStorage 읽기/쓰기 (사생활 보호 모드 등에서 실패해도 앱은 계속 동작) */
export function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장할 수 없는 환경 */
  }
}
