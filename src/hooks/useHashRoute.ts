import { useCallback, useEffect, useState } from 'react';
import type { Route } from '../types';
import { getWorld } from '../data/worlds';

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'map') return { name: 'map' };
  if (parts[0] === 'world' && parts[1] && getWorld(parts[1])) return { name: 'world', id: parts[1] };
  return { name: 'home' };
}
export function toHash(r: Route) {
  return r.name === 'home' ? '#/' : r.name === 'map' ? '#/map' : `#/world/${r.id}`;
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
