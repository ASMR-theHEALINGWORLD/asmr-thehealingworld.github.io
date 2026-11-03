import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, MapIcon } from '../components/Icons';
import { MuteButton } from '../components/MuteButton';
import { SoundMixer } from '../components/SoundMixer';
import { WORLDS, getWorldIndex } from '../data/worlds';
import { audioEngine } from '../audio/AudioEngine';
import { useIsMobile } from '../hooks/useMediaQuery';
import { CameraIntro, ViewShift } from '../three/common';
import { WORLD_SCENES } from '../worlds/registry';
import type { Route } from '../types';

export function WorldDetailScreen({ id, navigate }: { id: string; navigate: (r: Route) => void }) {
  const idx = getWorldIndex(id);
  const world = WORLDS[idx];
  const scene = WORLD_SCENES[id];
  const isMobile = useIsMobile();
  const prev = WORLDS[(idx - 1 + WORLDS.length) % WORLDS.length];
  const next = WORLDS[(idx + 1) % WORLDS.length];
  const [hint, setHint] = useState(true);

  useEffect(() => {
    audioEngine.preload(world.sounds);
    setHint(true);
    const t = setTimeout(() => setHint(false), 6000);
    return () => clearTimeout(t);
  }, [world]);

  const th = world.theme;
  const vars = {
    '--bg': th.background,
    '--panel': th.panel,
    '--panel-border': th.panelBorder,
    '--text': th.text,
    '--sub': th.subText,
    '--accent': th.accent,
    '--accent-soft': th.accentSoft,
  } as CSSProperties;

  const cam = world.camera;
  const camPos: [number, number, number] = isMobile ? [cam.position[0] * 1.25, cam.position[1] * 1.3, cam.position[2] * 1.35] : cam.position;
  const go = (w: { id: string }) => navigate({ name: 'world', id: w.id });

  return (
    <div className={`screen world ${th.dark ? 'is-dark' : ''}`} style={vars}>
      <Canvas key={id} className="stage" shadows dpr={[1, 2]} camera={{ fov: isMobile ? 48 : 38, position: camPos }}>
        <scene.Environment />
        <scene.Diorama />
        <CameraIntro position={camPos} target={cam.target} />
        <ViewShift px={isMobile ? 0 : 170} />
        <OrbitControls
          makeDefault
          target={cam.target}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={isMobile ? 20 : 16}
          minPolarAngle={0.45}
          maxPolarAngle={1.38}
          rotateSpeed={0.6}
          {...(id === 'bookstore' ? { minAzimuthAngle: -0.3, maxAzimuthAngle: 1.2 } : {})}
        />
      </Canvas>

      <header className="topbar">
        <button className="pill" onClick={() => navigate({ name: 'map' })}>
          <MapIcon /> <span className="hide-sm">월드맵</span>
        </button>
        <div className="world-title">
          <span className="world-title__no">WORLD {world.no}</span>
          <h1>{world.title}</h1>
          <p className="world-title__moods">
            {world.moods.map((m) => (
              <span key={m}>#{m}</span>
            ))}
          </p>
        </div>
        <MuteButton />
      </header>

      <button className="nav-arrow nav-arrow--left" onClick={() => go(prev)} aria-label={`이전 월드: ${prev.title}`}>
        <ChevronLeft />
        <span className="nav-arrow__label">{prev.title}</span>
      </button>
      <button className="nav-arrow nav-arrow--right" onClick={() => go(next)} aria-label={`다음 월드: ${next.title}`}>
        <span className="nav-arrow__label">{next.title}</span>
        <ChevronRight />
      </button>

      <p className={`world-hint ${hint ? 'is-on' : ''}`}>✦ {world.hint}</p>

      <SoundMixer world={world} />
    </div>
  );
}
