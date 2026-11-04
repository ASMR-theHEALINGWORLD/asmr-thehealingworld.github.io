import { useCallback, useEffect, useState } from 'react';
import type { Route } from '../types';
import { getWorld } from '../data/worlds';

/**
 * #/                         메인
 * #/map                      월드맵
 * #/me , #/me/avatar ...     마이 힐링
 * #/world/<id>               월드
 * #/world/<id>/mix/<코드>    친구가 공유한 믹스로 월드 열기
 */
function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'map') return { name: 'map' };
  if (parts[0] === 'me') {
    const tab = parts[1] === 'avatar' || parts[1] === 'settings' ? parts[1] : 'record';
    return { name: 'me', tab };
  }
  if (parts[0] === 'world' && parts[1] && getWorld(parts[1])) {
    return parts[2] === 'mix' && parts[3] ? { name: 'world', id: parts[1], mix: parts[3] } : { name: 'world', id: parts[1] };
  }
  return { name: 'home' };
}

/** 화면 단위 주소 (믹스 코드는 제외) */
export function toHash(r: Route) {
  switch (r.name) {
    case 'home':
      return '#/';
    case 'map':
      return '#/map';
    case 'me':
      return r.tab && r.tab !== 'record' ? `#/me/${r.tab}` : '#/me';
    case 'world':
      return `#/world/${r.id}`;
  }
}

/** 화면 전환 여부를 판단할 때 쓰는 키 (마이 화면의 탭 이동은 같은 화면으로 취급) */
export function screenKey(r: Route) {
  return r.name === 'me' ? '#/me' : toHash(r);
}

/** 해시 기반의 아주 작은 라우터 (뒤로가기 지원, 의존성 없음) */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const navigate = useCallback((r: Route) => {
    window.location.hash = toHash(r);
  }, []);
  return { route, navigate };
}
