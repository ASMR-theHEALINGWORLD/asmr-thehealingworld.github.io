import { useEffect, useRef, useState } from 'react';
import { sessionActions, useSession } from '../../store/session';

interface Pattern {
  id: string;
  name: string;
  desc: string;
  steps: { label: string; sec: number; scale: number }[];
}

const PATTERNS: Pattern[] = [
  {
    id: 'calm',
    name: '편안한 호흡',
    desc: '4초 들이쉬고 6초 내쉬기',
    steps: [
      { label: '들이쉬어요', sec: 4, scale: 1 },
      { label: '내쉬어요', sec: 6, scale: 0.45 },
    ],
  },
  {
    id: '478',
    name: '4-7-8 호흡',
    desc: '잠들기 전에 좋아요',
    steps: [
      { label: '들이쉬어요', sec: 4, scale: 1 },
      { label: '멈춰요', sec: 7, scale: 1 },
      { label: '내쉬어요', sec: 8, scale: 0.45 },
    ],
  },
  {
    id: 'box',
    name: '상자 호흡',
    desc: '4초씩 네 번, 긴장을 풀 때',
    steps: [
      { label: '들이쉬어요', sec: 4, scale: 1 },
      { label: '멈춰요', sec: 4, scale: 1 },
      { label: '내쉬어요', sec: 4, scale: 0.45 },
      { label: '멈춰요', sec: 4, scale: 0.45 },
    ],
  },
];

/** 호흡 가이드: 원이 커졌다 작아지며 호흡을 안내해요 */
export function BreathingOverlay() {
  const open = useSession((s) => s.breathing);
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0]);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timer = useRef<number>();

  useEffect(() => {
    if (!open) {
      setRunning(false);
      setStep(0);
      setCycles(0);
    }
  }, [open]);

  useEffect(() => {
    if (!running) return;
    const st = pattern.steps[step];
    setCount(st.sec);
    let left = st.sec;
    timer.current = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        window.clearInterval(timer.current);
        const next = (step + 1) % pattern.steps.length;
        if (next === 0) setCycles((c) => c + 1);
        setStep(next);
      } else setCount(left);
    }, 1000);
    return () => window.clearInterval(timer.current);
  }, [running, step, pattern]);

  if (!open) return null;
  const st = pattern.steps[step];
  const scale = running ? st.scale : 0.6;

  return (
    <div className="breath" role="dialog" aria-label="호흡 가이드">
      <button className="breath__close icon-btn" onClick={() => sessionActions.setBreathing(false)} aria-label="호흡 가이드 닫기">
        ✕
      </button>
      <div className="breath__stage">
        <div className="breath__ring" style={{ transform: `scale(${scale})`, transitionDuration: `${running ? st.sec : 0.6}s` }} />
        <div className="breath__text">
          {running ? (
            <>
              <strong>{st.label}</strong>
              <span className="breath__count">{count}</span>
            </>
          ) : (
            <strong>준비되면 시작해요</strong>
          )}
        </div>
      </div>
      {running ? (
        <div className="breath__foot">
          <span>{cycles > 0 ? `${cycles}번째 호흡을 마쳤어요` : pattern.name}</span>
          <button className="pill" onClick={() => setRunning(false)}>
            멈추기
          </button>
        </div>
      ) : (
        <div className="breath__foot">
          <div className="breath__patterns">
            {PATTERNS.map((p) => (
              <button key={p.id} className={`chip ${p.id === pattern.id ? 'is-on' : ''}`} onClick={() => setPattern(p)}>
                <strong>{p.name}</strong>
                <span>{p.desc}</span>
              </button>
            ))}
          </div>
          <button
            className="cta cta--small"
            onClick={() => {
              setStep(0);
              setCycles(0);
              setRunning(true);
            }}
          >
            시작하기 <span className="cta__arrow">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
