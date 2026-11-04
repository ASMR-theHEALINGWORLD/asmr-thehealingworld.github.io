import { useEffect, useRef, useState } from 'react';
import { formatClock } from '../../store/dates';
import { sessionActions, useSession } from '../../store/session';
import { TimerPanel } from './TimerPanel';
import { TravelPanel } from './TravelPanel';

type Panel = 'timer' | 'travel' | null;

/** 월드 화면 아래쪽의 작은 도구 모음 */
export function ToolDock({ onPhoto }: { onPhoto?: () => void }) {
  const [panel, setPanel] = useState<Panel>(null);
  const ref = useRef<HTMLDivElement>(null);
  const sleepOn = useSession((s) => s.sleep.endsAt !== null);
  const focusOn = useSession((s) => s.focus.running);
  const travelOn = useSession((s) => s.travel.on);

  useEffect(() => {
    if (!panel) return;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPanel(null);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [panel]);

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));
  const tools = [
    { id: 'timer', icon: '⏰', label: '타이머', active: sleepOn || focusOn, onClick: () => toggle('timer') },
    { id: 'breath', icon: '🌬️', label: '호흡', active: false, onClick: () => sessionActions.setBreathing(true) },
    ...(onPhoto ? [{ id: 'photo', icon: '📸', label: '사진', active: false, onClick: onPhoto }] : []),
    { id: 'sleep', icon: '🌙', label: '수면 모드', active: false, onClick: () => sessionActions.setSleepMode(true) },
    { id: 'travel', icon: '🧭', label: '여행', active: travelOn, onClick: () => toggle('travel') },
  ];

  return (
    <div className="dock" ref={ref}>
      {panel && (
        <div className="dock__panel">
          {panel === 'timer' && <TimerPanel />}
          {panel === 'travel' && <TravelPanel />}
        </div>
      )}
      <div className="dock__row">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`dock__btn ${t.active ? 'is-active' : ''} ${panel === t.id ? 'is-open' : ''}`}
            onClick={t.onClick}
            aria-label={t.label}
            aria-pressed={t.active || panel === t.id}
          >
            <span className="dock__icon">{t.icon}</span>
            <span className="dock__label">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 켜져 있는 타이머를 작은 알약 모양으로 보여줘요 */
export function StatusPills() {
  const now = useSession((s) => s.now);
  const sleep = useSession((s) => s.sleep);
  const focus = useSession((s) => s.focus);
  const travel = useSession((s) => s.travel);
  const pills: string[] = [];
  if (sleep.endsAt !== null) pills.push(`🌙 ${formatClock(sleep.endsAt - now)}`);
  if (focus.running) pills.push(`${focus.phase === 'focus' ? '📚 집중' : '🍵 휴식'} ${formatClock(focus.endsAt - now)}`);
  if (travel.on) pills.push(`🧭 다음 월드 ${formatClock(travel.nextAt - now)}`);
  if (!pills.length) return null;
  return (
    <div className="status-pills" aria-live="off">
      {pills.map((p, i) => (
        <span key={i} className="status-pill">
          {p}
        </span>
      ))}
    </div>
  );
}
