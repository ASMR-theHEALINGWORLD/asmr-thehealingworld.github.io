import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { FavoriteButton, MeButton } from '../components/FavoriteButton';
import { ChevronLeft, ChevronRight, MapIcon } from '../components/Icons';
import { LowSpecStage } from '../components/LowSpecStage';
import { MuteButton } from '../components/MuteButton';
import { PhotoModal } from '../components/PhotoModal';
import { SoundMixer } from '../components/SoundMixer';
import { StatusPills, ToolDock } from '../components/tools/ToolDock';
import { WORLDS, getWorldIndex } from '../data/worlds';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useMediaSession } from '../hooks/useMediaSession';
import { useSoundStore } from '../hooks/useSoundStore';
import { useSession } from '../store/session';
import { useUser } from '../store/userStore';
import { CameraIntro, ViewShift } from '../three/common';
import { HiddenFind } from '../three/HiddenFind';
import { MyAvatar } from '../three/MyAvatar';
import { SeasonalEffect } from '../three/Seasonal';
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
  const [photoCanvas, setPhotoCanvas] = useState<HTMLCanvasElement | null>(null);
  const [flash, setFlash] = useState(false);
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const lowSpec = useUser((u) => u.settings.lowSpec);
  const sleepMode = useSession((s) => s.sleepMode);
  const { playing, setPlaying } = useSoundStore();

  useEffect(() => {
    audioEngine.preload(world.sounds);
    setHint(true);
    const t = setTimeout(() => setHint(false), 6000);
    return () => clearTimeout(t);
  }, [world]);

  const go = useCallback((w: { id: string }) => navigate({ name: 'world', id: w.id }), [navigate]);
  const mediaHandlers = useMemo(
    () => ({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      next: () => go(next),
      prev: () => go(prev),
    }),
    [setPlaying, go, next, prev],
  );
  useMediaSession(world, playing, mediaHandlers);

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
  const shift = isMobile ? 0 : 170;

  const takePhoto = () => {
    if (!glRef.current) return;
    audioEngine.sfx('pop', 0.4);
    setFlash(true);
    setTimeout(() => setFlash(false), 450);
    setPhotoCanvas(glRef.current);
  };

  return (
    <div className={`screen world ${th.dark ? 'is-dark' : ''}`} style={vars}>
      {lowSpec ? (
        <LowSpecStage world={world} />
      ) : (
        <Canvas
          key={id}
          className="stage"
          shadows
          dpr={[1, 2]}
          frameloop={sleepMode ? 'never' : 'always'}
          gl={{ preserveDrawingBuffer: true }}
          camera={{ fov: isMobile ? 48 : 38, position: camPos }}
          onCreated={({ gl }) => (glRef.current = gl.domElement)}
        >
          <scene.Environment />
          <scene.Diorama />
          <MyAvatar spot={scene.avatar} />
          <HiddenFind worldId={id} {...scene.hidden} />
          <SeasonalEffect underwater={scene.underwater} />
          <CameraIntro position={camPos} target={cam.target} />
          <ViewShift px={shift} />
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
      )}

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
          <StatusPills />
        </div>
        <div className="topbar__right">
          <MeButton onClick={() => navigate({ name: 'me' })} />
          <FavoriteButton worldId={id} title={world.title} />
          <MuteButton />
        </div>
      </header>

      <button className="nav-arrow nav-arrow--left" onClick={() => go(prev)} aria-label={`이전 월드: ${prev.title}`}>
        <ChevronLeft />
        <span className="nav-arrow__label">{prev.title}</span>
      </button>
      <button className="nav-arrow nav-arrow--right" onClick={() => go(next)} aria-label={`다음 월드: ${next.title}`}>
        <span className="nav-arrow__label">{next.title}</span>
        <ChevronRight />
      </button>

      {!lowSpec && <p className={`world-hint ${hint ? 'is-on' : ''}`}>✦ {world.hint}</p>}

      <ToolDock onPhoto={lowSpec ? undefined : takePhoto} />
      <SoundMixer world={world} />

      {flash && <div className="shutter" aria-hidden />}
      {photoCanvas && <PhotoModal world={world} canvas={photoCanvas} shift={shift} onClose={() => setPhotoCanvas(null)} />}
    </div>
  );
}
