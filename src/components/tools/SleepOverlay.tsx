import { useEffect, useState } from 'react';
import { comfortOfDay } from '../../data/comfort';
import { formatClock } from '../../store/dates';
import { sessionActions, useSession } from '../../store/session';

/** 수면 모드: 화면을 아주 어둡게 하고, 시계와 남은 타이머만 은은하게 */
export function SleepOverlay() {
  const on = useSession((s) => s.sleepMode);
  const endsAt = useSession((s) => s.sleep.endsAt);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [on]);
  if (!on) return null;
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return (
    <button className="sleep-overlay" onClick={() => sessionActions.setSleepMode(false)} aria-label="수면 모드 끄기">
      <span className="sleep-overlay__glow" aria-hidden />
      <span className="sleep-overlay__clock">
        {hh}
        <i>:</i>
        {mm}
      </span>
      <span className="sleep-overlay__msg">{comfortOfDay()}</span>
      {endsAt !== null && <span className="sleep-overlay__timer">🌙 {formatClock(endsAt - now.getTime())} 뒤에 소리가 꺼져요</span>}
      <span className="sleep-overlay__hint">화면을 누르면 깨어나요</span>
    </button>
  );
}
