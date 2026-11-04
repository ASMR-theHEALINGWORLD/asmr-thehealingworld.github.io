import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { MeButton } from '../components/FavoriteButton';
import { MoodSheet, recommendFor, useTodayMood } from '../components/MoodSheet';
import { MuteButton } from '../components/MuteButton';
import { comfortOfDay } from '../data/comfort';
import { SKY, useDayPhase } from '../hooks/useDayPhase';
import { useIsMobile } from '../hooks/useMediaQuery';
import { HomeScene } from '../scenes/HomeScene';
import { useUser } from '../store/userStore';
import type { Route } from '../types';

export function HomeScreen({ navigate }: { navigate: (r: Route) => void }) {
  const isMobile = useIsMobile();
  const phase = useDayPhase();
  const lowSpec = useUser((u) => u.settings.lowSpec);
  const [moodOpen, setMoodOpen] = useState(false);
  const mood = useTodayMood();
  const rec = mood ? recommendFor(mood) : null;
  const comfort = comfortOfDay();

  return (
    <div className="screen home" data-phase={phase}>
      {lowSpec ? (
        <div className="lowspec lowspec--home" aria-hidden>
          <span className="lowspec__blob lowspec__blob--1" />
          <span className="lowspec__blob lowspec__blob--2" />
          <span className="lowspec__icon">☁️</span>
        </div>
      ) : (
        <Canvas className="stage" shadows dpr={[1, 2]} camera={{ fov: isMobile ? 46 : 34, position: [0, 4, 12] }}>
          <HomeScene offsetX={isMobile ? 0 : 2.3} mobile={isMobile} sky={SKY[phase]} />
        </Canvas>
      )}

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">☁</span> Healing World
        </div>
        <div className="topbar__right">
          <MeButton onClick={() => navigate({ name: 'me' })} />
          <MuteButton />
        </div>
      </header>

      <p className="home__comfort home__comfort--top">
        <span>💌 오늘의 한마디</span>
        {comfort}
      </p>

      <section className="home__hero">
        <p className="home__comfort home__comfort--inline">
          <span>💌 오늘의 한마디</span>
          {comfort}
        </p>
        <p className="eyebrow">ASMR MINIATURE HEALING WORLD</p>
        <h1 className="logo">
          힐링 월드
          <span className="logo__en">Healing World</span>
        </h1>
        <p className="home__desc">
          작은 친구들이 살고 있는 미니어처 세계에서
          <br />
          잠시 마음을 내려놓고, 소리에 기대어 쉬어가요.
        </p>
        <button
          className="cta"
          onClick={() => {
            audioEngine.unlock();
            navigate({ name: 'map' });
          }}
        >
          힐링하러 가기
          <span className="cta__arrow">→</span>
        </button>
        <button className="mood-pill" onClick={() => setMoodOpen(true)}>
          {mood && rec ? (
            <>
              <span>{mood.emoji}</span> 오늘의 추천 · {rec.title}
            </>
          ) : (
            <>
              <span>🙂</span> 오늘 기분은 어때요?
            </>
          )}
        </button>
      </section>

      {moodOpen && (
        <MoodSheet
          onClose={() => setMoodOpen(false)}
          navigate={(r) => {
            audioEngine.unlock();
            navigate(r);
          }}
        />
      )}
    </div>
  );
}
