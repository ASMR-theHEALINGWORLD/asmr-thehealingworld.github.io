import { useEffect, useState } from 'react';
import { comfortOfDay } from '../../data/comfort';
import { formatClock } from '../../store/dates';
import { sessionActions, useSession } from '../../store/session';

const OPTIONS = [15, 30, 45, 60, 90];

/** 수면 모드: 화면을 아주 어둡게 하고, 시계와 '소리 끌 시간'만 은은하게 */
export function SleepOverlay() {
  const on = useSession((s) => s.sleepMode);
  const sleep = useSession((s) => s.sleep);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [on]);
  if (!on) return null;
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const active = sleep.endsAt !== null;
  return (
    <div className="sleep-overlay" role="dialog" aria-label="수면 모드" onClick={() => sessionActions.setSleepMode(false)}>
      <span className="sleep-overlay__glow" aria-hidden />
      <span className="sleep-overlay__clock">
        {hh}
        <i>:</i>
        {mm}
      </span>
      <span className="sleep-overlay__msg">{comfortOfDay()}</span>
      <div className="sleep-overlay__timer" onClick={(e) => e.stopPropagation()}>
        <span className="sleep-overlay__label">
          {active ? <>🌙 {formatClock(sleep.endsAt! - now.getTime())} 뒤에 소리가 서서히 꺼져요</> : '🌙 언제 소리를 끌까요?'}
        </span>
        <div className="sleep-overlay__chips">
          {OPTIONS.map((m) => (
            <button key={m} className={`sleep-chip ${active && sleep.minutes === m ? 'is-on' : ''}`} onClick={() => sessionActions.startSleep(m)}>
              {m}분
            </button>
          ))}
          <button className={`sleep-chip ${!active ? 'is-on' : ''}`} onClick={() => sessionActions.stopSleep()}>
            끄지 않기
          </button>
        </div>
      </div>
      <button className="sleep-overlay__wake" onClick={() => sessionActions.setSleepMode(false)}>
        수면 모드 끄기
      </button>
    </div>
  );
}
