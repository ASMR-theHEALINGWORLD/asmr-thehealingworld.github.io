import { Canvas } from '@react-three/fiber';
import { audioEngine } from '../audio/AudioEngine';
import { MuteButton } from '../components/MuteButton';
import { useIsMobile } from '../hooks/useMediaQuery';
import { HomeScene } from '../scenes/HomeScene';
import type { Route } from '../types';

export function HomeScreen({ navigate }: { navigate: (r: Route) => void }) {
  const isMobile = useIsMobile();
  return (
    <div className="screen home">
      <Canvas className="stage" shadows dpr={[1, 2]} camera={{ fov: isMobile ? 46 : 34, position: [0, 4, 12] }}>
        <HomeScene offsetX={isMobile ? 0 : 2.3} mobile={isMobile} />
      </Canvas>

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">☁</span> Healing World
        </div>
        <MuteButton />
      </header>

      <section className="home__hero">
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
      </section>
    </div>
  );
}
