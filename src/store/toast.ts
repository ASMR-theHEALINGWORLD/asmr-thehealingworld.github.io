import { createStore } from './createStore';

export interface Toast {
  id: number;
  text: string;
  icon?: string;
}

export const toastStore = createStore<Toast[]>([]);
let seq = 0;

/** 화면 위쪽에 잠깐 떴다 사라지는 알림 */
export function toast(text: string, icon?: string, ms = 2800) {
  const id = ++seq;
  toastStore.set((list) => [...list.slice(-2), { id, text, icon }]);
  setTimeout(() => toastStore.set((list) => list.filter((t) => t.id !== id)), ms);
}
