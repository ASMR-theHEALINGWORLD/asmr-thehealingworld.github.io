import { useState } from 'react';
import { MOODS, type Mood } from '../data/comfort';
import { WORLDS, getWorld } from '../data/worlds';
import { dayKey } from '../store/dates';
import { userStore, useUser, userActions } from '../store/userStore';
import type { Route } from '../types';

/** 기분에 맞는 월드 추천 ('기분 좋아요'는 즐겨찾기 → 최근 → 오늘 날짜 순) */
export function recommendFor(m: Mood) {
  if (m.world) return getWorld(m.world)!;
  const u = userStore.get();
  const id = u.favorites[0] ?? u.recent[0] ?? WORLDS[new Date().getDate() % WORLDS.length].id;
  return getWorld(id)!;
}

export function useTodayMood() {
  const id = useUser((u) => u.days[dayKey()]?.mood);
  return MOODS.find((m) => m.id === id) ?? null;
}

/** 오늘 기분 체크인 → 추천 월드 */
export function MoodSheet({ onClose, navigate }: { onClose: () => void; navigate: (r: Route) => void }) {
  const today = useTodayMood();
  const [picked, setPicked] = useState<Mood | null>(today);
  const rec = picked ? recommendFor(picked) : null;
  return (
    <div className="modal" role="dialog" aria-label="오늘 기분 체크인" onClick={onClose}>
      <div className="modal__card mood" onClick={(e) => e.stopPropagation()}>
        <button className="modal__x icon-btn icon-btn--sm" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        <p className="eyebrow">MOOD CHECK-IN</p>
        <h2 className="mood__title">오늘 기분은 어때요?</h2>
        <div className="mood__grid">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={`mood__chip ${picked?.id === m.id ? 'is-on' : ''}`}
              onClick={() => {
                setPicked(m);
                userActions.setMood(m.id);
              }}
            >
              <span className="mood__emoji">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
        {picked && rec && (
          <div className="mood__rec" style={{ ['--accent' as string]: rec.theme.accent }}>
            <span className="mood__rec-label">추천 월드 · WORLD {rec.no}</span>
            <strong>{rec.title}</strong>
            <p>{picked.reason}</p>
            <button className="cta cta--small" onClick={() => navigate({ name: 'world', id: rec.id })}>
              들어가기 <span className="cta__arrow">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
