import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useUser } from '../store/userStore';

export type Season = 'snow' | 'petals' | 'leaves' | null;

/** 날짜로 계절 효과 정하기: 겨울(12~2월) 눈, 봄(3~4월) 벚꽃, 가을(10~11월) 낙엽 */
export function seasonOf(d = new Date()): Season {
  const m = d.getMonth() + 1;
  if (m === 12 || m <= 2) return 'snow';
  if (m === 3 || m === 4) return 'petals';
  if (m === 10 || m === 11) return 'leaves';
  return null;
}

const COLORS: Record<Exclude<Season, null>, string[]> = {
  snow: ['#ffffff', '#f4f8ff'],
  petals: ['#ffc6d9', '#ffd9e6', '#ffb3c8'],
  leaves: ['#e9a25b', '#d97b4f', '#f2c46d', '#c9894f'],
};

/** 흩날리는 계절 파티클. underwater 이면 겨울의 '바다 눈'만 보여요 */
export function SeasonalEffect({ count = 70, area = 6, height = 8, underwater = false }: { count?: number; area?: number; height?: number; underwater?: boolean }) {
  const enabled = useUser((u) => u.settings.seasonal === 'auto');
  const season = seasonOf();
  const kind: Season = !enabled ? null : underwater ? (season === 'snow' ? 'snow' : null) : season;
  if (!kind) return null;
  return <Particles kind={kind} count={count} area={area} height={height} />;
}

function Particles({ kind, count, area, height }: { kind: Exclude<Season, null>; count: number; area: number; height: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * area * 2,
        z: (Math.random() - 0.5) * area * 2,
        y: Math.random() * height,
        v: kind === 'snow' ? 0.35 + Math.random() * 0.3 : 0.45 + Math.random() * 0.4,
        p: Math.random() * 10,
        s: 0.7 + Math.random() * 0.6,
      })),
    [count, area, height, kind],
  );
  const colored = useRef(false);
  useFrame(({ clock }, dt) => {
    const m = ref.current;
    if (!m) return;
    if (!colored.current) {
      const pal = COLORS[kind];
      const c = new THREE.Color();
      seeds.forEach((_, i) => m.setColorAt(i, c.set(pal[i % pal.length])));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      colored.current = true;
    }
    const t = clock.elapsedTime;
    seeds.forEach((d, i) => {
      d.y -= d.v * Math.min(dt, 0.1);
      if (d.y < -0.5) d.y = height;
      const sway = Math.sin(t * 0.9 + d.p) * (kind === 'snow' ? 0.25 : 0.5);
      dummy.position.set(d.x + sway, d.y, d.z + Math.cos(t * 0.7 + d.p) * 0.2);
      dummy.rotation.set(t * d.v * 2 + d.p, t * 0.8 + d.p, Math.sin(t + d.p));
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      {kind === 'snow' ? <sphereGeometry args={[0.045, 6, 5]} /> : <circleGeometry args={[kind === 'leaves' ? 0.09 : 0.06, 5]} />}
      <meshStandardMaterial roughness={0.8} side={THREE.DoubleSide} emissive={kind === 'snow' ? '#ffffff' : '#000000'} emissiveIntensity={kind === 'snow' ? 0.3 : 0} />
    </instancedMesh>
  );
}
