import { useState } from 'react';
import { formatClock } from '../../store/dates';
import { sessionActions, useSession } from '../../store/session';

const SLEEP_OPTIONS = [15, 30, 45, 60, 90];
const FOCUS_OPTIONS: [number, number][] = [
  [25, 5],
  [50, 10],
];

/** 수면 타이머 / 집중 타이머 */
export function TimerPanel() {
  const [tab, setTab] = useState<'sleep' | 'focus'>('sleep');
  const now = useSession((s) => s.now);
  const sleep = useSession((s) => s.sleep);
  const focus = useSession((s) => s.focus);
  return (
    <div className="panel">
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === 'sleep'} className={tab === 'sleep' ? 'is-on' : ''} onClick={() => setTab('sleep')}>
          🌙 수면 타이머
        </button>
        <button role="tab" aria-selected={tab === 'focus'} className={tab === 'focus' ? 'is-on' : ''} onClick={() => setTab('focus')}>
          🍅 집중 타이머
        </button>
      </div>

      {tab === 'sleep' ? (
        <div className="panel__body">
          {sleep.endsAt !== null ? (
            <>
              <p className="panel__big">{formatClock(sleep.endsAt - now)}</p>
              <p className="panel__desc">시간이 다 되면 1분 동안 소리가 서서히 작아지다 꺼져요.</p>
              <button className="pill" onClick={() => sessionActions.stopSleep()}>
                타이머 끄기
              </button>
            </>
          ) : (
            <>
              <p className="panel__desc">정한 시간이 지나면 소리를 살며시 꺼 드려요.</p>
              <div className="chips">
                {SLEEP_OPTIONS.map((m) => (
                  <button key={m} className="chip" onClick={() => sessionActions.startSleep(m)}>
                    {m}분
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="panel__body">
          {focus.running ? (
            <>
              <p className="panel__label">{focus.phase === 'focus' ? `📚 ${focus.round}번째 집중` : '🍵 휴식 시간'}</p>
              <p className="panel__big">{formatClock(focus.endsAt - now)}</p>
              <button className="pill" onClick={() => sessionActions.stopFocus()}>
                집중 타이머 끄기
              </button>
            </>
          ) : (
            <>
              <p className="panel__desc">집중과 휴식을 번갈아 알려드려요. 바뀔 때 맑은 소리가 나요.</p>
              <div className="chips">
                {FOCUS_OPTIONS.map(([f, b]) => (
                  <button key={f} className="chip" onClick={() => sessionActions.startFocus(f, b)}>
                    {f}분 집중 · {b}분 휴식
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
