/**
 * 세션 상태 — 수면 타이머, 집중 타이머, 월드 여행 모드, 수면 모드, 호흡 가이드.
 * (새로고침하면 초기화되는 일시적인 상태)
 */
import { createStore, useStore } from './createStore';

export interface Session {
  now: number;
  sleep: { endsAt: number | null; minutes: number };
  focus: { running: boolean; phase: 'focus' | 'break'; endsAt: number; focusMin: number; breakMin: number; round: number };
  travel: { on: boolean; minutes: number; nextAt: number };
  sleepMode: boolean;
  breathing: boolean;
}

export const sessionStore = createStore<Session>({
  now: Date.now(),
  sleep: { endsAt: null, minutes: 30 },
  focus: { running: false, phase: 'focus', endsAt: 0, focusMin: 25, breakMin: 5, round: 1 },
  travel: { on: false, minutes: 5, nextAt: 0 },
  sleepMode: false,
  breathing: false,
});

export const useSession = <U,>(sel: (s: Session) => U) => useStore(sessionStore, sel);
const set = sessionStore.set;

export const sessionActions = {
  startSleep(minutes: number) {
    set((s) => ({ ...s, now: Date.now(), sleep: { minutes, endsAt: Date.now() + minutes * 60_000 } }));
  },
  stopSleep() {
    set((s) => ({ ...s, sleep: { ...s.sleep, endsAt: null } }));
  },
  startFocus(focusMin: number, breakMin: number) {
    set((s) => ({ ...s, now: Date.now(), focus: { running: true, phase: 'focus', focusMin, breakMin, round: 1, endsAt: Date.now() + focusMin * 60_000 } }));
  },
  stopFocus() {
    set((s) => ({ ...s, focus: { ...s.focus, running: false } }));
  },
  setTravel(on: boolean, minutes?: number) {
    set((s) => {
      const m = minutes ?? s.travel.minutes;
      return { ...s, now: Date.now(), travel: { on, minutes: m, nextAt: Date.now() + m * 60_000 } };
    });
  },
  setSleepMode(on: boolean) {
    set((s) => ({ ...s, sleepMode: on }));
  },
  setBreathing(on: boolean) {
    set((s) => ({ ...s, breathing: on }));
  },
};

export const anyTimerActive = (s: Session) => s.sleep.endsAt !== null || s.focus.running || s.travel.on;
