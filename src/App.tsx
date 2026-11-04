import { useEffect, useRef, useState } from 'react';
import { audioEngine } from './audio/AudioEngine';
import { SessionController } from './components/SessionController';
import { Toaster } from './components/Toaster';
import { BreathingOverlay } from './components/tools/BreathingOverlay';
import { SleepOverlay } from './components/tools/SleepOverlay';
import { decodeMix } from './data/mixCode';
import { getWorld } from './data/worlds';
import { screenKey, toHash, useHashRoute } from './hooks/useHashRoute';
import { useSoundStore } from './hooks/useSoundStore';
import { HomeScreen } from './screens/HomeScreen';
import { MeScreen } from './screens/MeScreen';
import { WorldDetailScreen } from './screens/WorldDetailScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import { toast } from './store/toast';
import type { Route } from './types';

const FADE_MS = 520;

export default function App() {
  const { route, navigate } = useHashRoute();
  const [shown, setShown] = useState<Route>(route);
  const [curtain, setCurtain] = useState(false);
  const { setActiveWorld, setWorldMix, setPlaying } = useSoundStore();

  // 화면 전환: 구름 커튼이 덮였다가 걷히는 부드러운 전환 (같은 화면 안의 탭 이동은 바로)
  useEffect(() => {
    if (screenKey(route) === screenKey(shown)) {
      if (toHash(route) !== toHash(shown)) setShown(route);
      return;
    }
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

  // 친구가 공유한 믹스 링크로 들어온 경우
  const appliedMix = useRef<string | null>(null);
  useEffect(() => {
    if (route.name !== 'world' || !route.mix || appliedMix.current === route.mix) return;
    appliedMix.current = route.mix;
    const world = getWorld(route.id);
    const mix = world && decodeMix(world, route.mix);
    if (mix) {
      setWorldMix(route.id, mix);
      setPlaying(true);
      toast('친구가 공유한 믹스를 불러왔어요', '🎧', 3500);
    }
    history.replaceState(null, '', toHash({ name: 'world', id: route.id }));
  }, [route, setWorldMix, setPlaying]);

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
      {shown.name === 'me' && <MeScreen tab={shown.tab ?? 'record'} navigate={navigate} />}
      {shown.name === 'world' && <WorldDetailScreen key={shown.id} id={shown.id} navigate={navigate} />}
      <SessionController route={shown} navigate={navigate} />
      <BreathingOverlay />
      <SleepOverlay />
      <Toaster />
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
