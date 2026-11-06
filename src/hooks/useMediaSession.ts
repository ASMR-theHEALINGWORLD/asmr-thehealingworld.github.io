import { useEffect } from 'react';
import type { WorldDef } from '../types';

/** 휴대폰 잠금화면·알림창의 재생 컨트롤 (Media Session API) */
export function useMediaSession(world: WorldDef, playing: boolean, h: { play: () => void; pause: () => void; next: () => void; prev: () => void }) {
  useEffect(() => {
    const ms = navigator.mediaSession;
    if (!ms || typeof MediaMetadata === 'undefined') return;
    ms.metadata = new MediaMetadata({
      title: world.title,
      artist: '힐링 월드',
      album: world.tagline.replace(/\n/g, ' '),
      artwork: [
        { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    const set = (a: MediaSessionAction, fn: (() => void) | null) => {
      try {
        ms.setActionHandler(a, fn);
      } catch {
        /* 지원하지 않는 동작 */
      }
    };
    set('play', h.play);
    set('pause', h.pause);
    set('nexttrack', h.next);
    set('previoustrack', h.prev);
    return () => {
      (['play', 'pause', 'nexttrack', 'previoustrack'] as MediaSessionAction[]).forEach((a) => set(a, null));
    };
  }, [world, h.play, h.pause, h.next, h.prev]);

  useEffect(() => {
    if (navigator.mediaSession) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [playing]);
}
