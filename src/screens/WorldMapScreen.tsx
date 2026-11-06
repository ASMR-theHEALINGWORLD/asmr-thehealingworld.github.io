import { Canvas } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { ChevronLeft, ChevronRight } from '../components/Icons';
import { MeButton } from '../components/FavoriteButton';
import { MuteButton } from '../components/MuteButton';
import { SKY, useDayPhase } from '../hooks/useDayPhase';
import { useUser, userStore } from '../store/userStore';
import { WORLDS } from '../data/worlds';
import { useIsMobile } from '../hooks/useMediaQuery';
import { MapScene } from '../scenes/MapScene';
import type { Route } from '../types';

export function WorldMapScreen({ navigate }: { navigate: (r: Route) => void }) {
  const compact = useIsMobile();
  const phase = useDayPhase();
  const lowSpec = useUser((u) => u.settings.lowSpec);
  const favorites = useUser((u) => u.favorites);
  // 모바일 캐러셀은 최근에 머문 월드부터
  const [focus, setFocus] = useState(() => Math.max(0, WORLDS.findIndex((x) => x.id === userStore.get().recent[0])));
  const swipe = useRef<{ x: number; t: number } | null>(null);
  const go = (id: string) => {
    audioEngine.unlock();
    navigate({ name: 'world', id });
  };
  const step = (d: number) => setFocus((f) => (f + d + WORLDS.length) % WORLDS.length);
  const w = WORLDS[focus];

  return (
    <div
      className="screen map"
      data-phase={phase}
      onPointerDown={(e) => (swipe.current = { x: e.clientX, t: Date.now() })}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!compact || !s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 50 && Date.now() - s.t < 700) step(dx < 0 ? 1 : -1);
      }}
    >
      {lowSpec ? (
        <div className="map-list">
          {WORLDS.map((x) => (
            <button key={x.id} className="map-list__item" style={{ background: `linear-gradient(135deg, ${x.theme.gradient[0]}, ${x.theme.gradient[1]})` }} onClick={() => go(x.id)}>
              <span className="map-list__no">WORLD {x.no}{favorites.includes(x.id) ? ' ♥' : ''}</span>
              <strong>{x.title}</strong>
              <span>{x.tagline}</span>
            </button>
          ))}
        </div>
      ) : (
      <Canvas className="stage" shadows dpr={[1, 1.75]} camera={{ fov: compact ? 44 : 34, position: [0, 9, 20] }}>
        <MapScene
          sky={SKY[phase]}
          compact={compact}
          focus={focus}
          onFocus={setFocus}
          onSelect={(id) => {
            const i = WORLDS.findIndex((x) => x.id === id);
            if (compact && i !== focus) setFocus(i);
            else go(id);
          }}
        />
      </Canvas>
      )}

      <header className="topbar">
        <button className="pill" onClick={() => navigate({ name: 'home' })}>
          <span className="brand__mark">☁</span> 힐링 월드
        </button>
        <div className="topbar__right">
          <MeButton onClick={() => navigate({ name: 'me' })} />
          <MuteButton />
        </div>
      </header>

      <div className="map__title">
        <p className="eyebrow">WORLD MAP</p>
        <h2>오늘은 어디에서 쉬어갈까요?</h2>
      </div>

      {lowSpec ? null : compact ? (
        <div className="map__pager">
          <button className="icon-btn" onClick={() => step(-1)} aria-label="이전 월드">
            <ChevronLeft />
          </button>
          <div className="map__card">
            <span className="map__no" style={{ color: w.theme.accent }}>
              WORLD {w.no}
            </span>
            <strong>
              {w.title}
              {favorites.includes(w.id) && <span className="map__fav"> ♥</span>}
            </strong>
            <p>{w.description}</p>
            <div className="dots">
              {WORLDS.map((x, i) => (
                <i key={x.id} className={i === focus ? 'is-on' : ''} />
              ))}
            </div>
            <button className="cta cta--small" onClick={() => go(w.id)}>
              들어가기 <span className="cta__arrow">→</span>
            </button>
          </div>
          <button className="icon-btn" onClick={() => step(1)} aria-label="다음 월드">
            <ChevronRight />
          </button>
        </div>
      ) : (
        <p className="map__hint">섬을 눌러 그 공간으로 들어가 보세요</p>
      )}
    </div>
  );
}
