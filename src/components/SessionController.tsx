/**
 * 화면에는 보이지 않고 뒤에서 일하는 컨트롤러:
 * - 수면 타이머: 마지막 1분 동안 소리를 서서히 줄이고 끔
 * - 집중 타이머: 집중/휴식 전환 때 알림
 * - 월드 여행 모드: 정해진 시간마다 다음 월드로 이동
 * - 힐링 기록: 소리를 들은 시간을 10초 단위로 저장
 */
import { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { WORLDS, getWorldIndex } from '../data/worlds';
import { useSoundStore } from '../hooks/useSoundStore';
import { formatDuration } from '../store/dates';
import { anyTimerActive, sessionActions, sessionStore } from '../store/session';
import { toast } from '../store/toast';
import { userActions } from '../store/userStore';
import type { Route } from '../types';

export function SessionController({ route, navigate }: { route: Route; navigate: (r: Route) => void }) {
  const { activeWorldId, playing, muted, setPlaying } = useSoundStore();
  const live = useRef({ activeWorldId, playing, muted, route });
  live.current = { activeWorldId, playing, muted, route };
  const listened = useRef(0);

  // 월드 방문 기록
  const worldId = route.name === 'world' ? route.id : null;
  useEffect(() => {
    if (worldId) userActions.visitWorld(worldId);
  }, [worldId]);

  useEffect(() => {
    const flush = () => {
      const w = live.current.activeWorldId;
      if (w && listened.current > 0) userActions.addListen(w, listened.current);
      listened.current = 0;
    };
    const tick = () => {
      const now = Date.now();
      const s = sessionStore.get();
      const { activeWorldId: w, playing: p, muted: m, route: r } = live.current;

      // 힐링 기록
      if (w && p && !m) {
        listened.current += 1;
        if (listened.current >= 10) flush();
      }

      if (!anyTimerActive(s)) return;
      sessionStore.set((x) => ({ ...x, now }));

      // 수면 타이머
      if (s.sleep.endsAt !== null) {
        const left = s.sleep.endsAt - now;
        if (left <= 0) {
          setPlaying(false);
          audioEngine.setLevel(1);
          sessionActions.stopSleep();
          toast('푹 쉬어요. 소리를 살며시 껐어요', '🌙', 4000);
        } else {
          audioEngine.setLevel(left < 60_000 ? left / 60_000 : 1);
        }
      }

      // 집중 타이머
      if (s.focus.running && now >= s.focus.endsAt) {
        const toBreak = s.focus.phase === 'focus';
        audioEngine.sfx('chime', 0.5);
        sessionStore.set((x) => ({
          ...x,
          focus: {
            ...x.focus,
            phase: toBreak ? 'break' : 'focus',
            round: toBreak ? x.focus.round : x.focus.round + 1,
            endsAt: now + (toBreak ? x.focus.breakMin : x.focus.focusMin) * 60_000,
          },
        }));
        toast(
          toBreak ? `${formatDuration(s.focus.focusMin * 60)} 집중 완료! 잠깐 쉬어가요` : '다시 집중해 볼까요?',
          toBreak ? '🍵' : '📚',
          4000,
        );
      }

      // 월드 여행 모드
      if (s.travel.on && now >= s.travel.nextAt) {
        sessionStore.set((x) => ({ ...x, travel: { ...x.travel, nextAt: now + x.travel.minutes * 60_000 } }));
        if (r.name === 'world') {
          const next = WORLDS[(getWorldIndex(r.id) + 1) % WORLDS.length];
          navigate({ name: 'world', id: next.id });
          toast(`다음 여행지: ${next.title}`, '🧭');
        }
      }
    };
    const id = window.setInterval(tick, 1000);
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [navigate, setPlaying]);

  // 수면 타이머를 끄면 볼륨 원래대로
  useEffect(
    () =>
      sessionStore.subscribe(() => {
        if (sessionStore.get().sleep.endsAt === null) audioEngine.setLevel(1);
      }),
    [],
  );

  return null;
}
