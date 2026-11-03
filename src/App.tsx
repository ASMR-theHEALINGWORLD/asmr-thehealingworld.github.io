import { useEffect, useState } from 'react';
import { audioEngine } from './audio/AudioEngine';
import { useHashRoute, toHash } from './hooks/useHashRoute';
import { useSoundStore } from './hooks/useSoundStore';
import { HomeScreen } from './screens/HomeScreen';
import { WorldDetailScreen } from './screens/WorldDetailScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import type { Route } from './types';

const FADE_MS = 520;

export default function App() {
  const { route, navigate } = useHashRoute();
  const [shown, setShown] = useState<Route>(route);
  const [curtain, setCurtain] = useState(false);
  const { setActiveWorld } = useSoundStore();

  // 화면 전환: 구름 커튼이 덮였다가 걷히는 부드러운 전환
  useEffect(() => {
    if (toHash(route) === toHash(shown)) return;
    setCurtain(true);
    const t = setTimeout(() => {
      setShown(route);
      setTimeout(() => setCurtain(false), 120);
    }, FADE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  useEffect(() => {
    setActiveWorld(shown.name === 'world' ? shown.id : null);
  }, [shown, setActiveWorld]);

  // 모바일 브라우저 오디오 잠금 해제
  useEffect(() => {
    const unlock = () => audioEngine.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  return (
    <div className="app">
      {shown.name === 'home' && <HomeScreen navigate={navigate} />}
      {shown.name === 'map' && <WorldMapScreen navigate={navigate} />}
      {shown.name === 'world' && <WorldDetailScreen key={shown.id} id={shown.id} navigate={navigate} />}
      <div className={`curtain ${curtain ? 'is-on' : ''}`} aria-hidden>
        <div className="curtain__cloud">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
