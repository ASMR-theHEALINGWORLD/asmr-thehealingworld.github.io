import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/**
 * 항상 보이는 스크롤 막대.
 * 모바일(특히 아이폰)은 기본 스크롤 막대가 스크롤할 때만 잠깐 보여서, 직접 그려 줘요.
 * 손가락으로 막대를 끌어서 이동할 수도 있어요.
 */
export function ScrollRail({ target, deps = [] }: { target: RefObject<HTMLElement>; deps?: unknown[] }) {
  const [m, setM] = useState({ show: false, size: 0, pos: 0 });
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; top: number } | null>(null);

  const measure = useCallback(() => {
    const el = target.current;
    const tr = track.current;
    if (!el || !tr) return;
    const { scrollHeight: sh, clientHeight: ch, scrollTop: st } = el;
    const th = tr.clientHeight;
    if (sh <= ch + 2 || th === 0) return setM((p) => (p.show ? { ...p, show: false } : p));
    const size = Math.max(28, (ch / sh) * th);
    const pos = ((st / (sh - ch)) * (th - size)) || 0;
    setM({ show: true, size, pos });
  }, [target]);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    // 접고 펼치는 애니메이션이 끝난 뒤에도 한 번 더
    const t = window.setTimeout(measure, 500);
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  const onDown = (e: React.PointerEvent) => {
    const el = target.current;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, top: el.scrollTop };
  };
  const onMove = (e: React.PointerEvent) => {
    const el = target.current;
    const tr = track.current;
    if (!drag.current || !el || !tr) return;
    const ratio = (el.scrollHeight - el.clientHeight) / Math.max(1, tr.clientHeight - m.size);
    el.scrollTop = drag.current.top + (e.clientY - drag.current.y) * ratio;
  };
  const onUp = () => (drag.current = null);

  return (
    <div className={`scroll-rail ${m.show ? 'is-on' : ''}`} ref={track} aria-hidden>
      <div className="scroll-rail__thumb" style={{ height: m.size, transform: `translateY(${m.pos}px)` }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
    </div>
  );
}
