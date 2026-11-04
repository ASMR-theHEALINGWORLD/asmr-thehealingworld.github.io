/**
 * 홈 화면 설치(PWA) + 오프라인 지원
 * - 배포 버전에서만 서비스 워커를 등록해요 (개발 중 캐시 문제 방지)
 * - 안드로이드/PC 크롬: 설치 버튼으로 바로 설치
 * - 아이폰 사파리: 공유 → '홈 화면에 추가' 안내
 */
import { createStore, useStore } from './store/createStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const nav = typeof navigator !== 'undefined' ? navigator : ({} as Navigator);
export const isIOS = /iphone|ipad|ipod/i.test(nav.userAgent ?? '') || (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1);
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

const pwaStore = createStore<{ prompt: BeforeInstallPromptEvent | null; installed: boolean }>({ prompt: null, installed: false });
export const usePwa = () => useStore(pwaStore, (s) => s);

export function setupPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pwaStore.set((s) => ({ ...s, prompt: e as BeforeInstallPromptEvent }));
  });
  window.addEventListener('appinstalled', () => pwaStore.set(() => ({ prompt: null, installed: true })));
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => undefined);
    });
  }
}

export async function promptInstall() {
  const p = pwaStore.get().prompt;
  if (!p) return false;
  await p.prompt();
  const { outcome } = await p.userChoice;
  pwaStore.set((s) => ({ ...s, prompt: null, installed: outcome === 'accepted' }));
  return outcome === 'accepted';
}
