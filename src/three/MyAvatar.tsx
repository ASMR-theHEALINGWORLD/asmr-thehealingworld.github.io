import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { createStore } from '../store/createStore';
import { toast } from '../store/toast';
import { useUser, userStore } from '../store/userStore';
import { Character, type Holding } from './Character';
import { Glow } from './common';

export interface AvatarSpot {
  position: [number, number, number];
  rotation?: number;
  holding?: Holding;
  snorkel?: boolean;
}

/** 걸어 다닐 수 있는 바닥 (원 또는 사각형) */
export type WalkArea = { y: number; circle: number } | { y: number; x: [number, number]; z: [number, number] };

/** 바닥을 누른 곳 → 내 캐릭터가 걸어갈 목표 */
const walkTarget = createStore<{ x: number; z: number; seq: number } | null>(null);

function clampTo(area: WalkArea, x: number, z: number): [number, number] {
  if ('circle' in area) {
    const d = Math.hypot(x, z);
    return d > area.circle ? [(x / d) * area.circle, (z / d) * area.circle] : [x, z];
  }
  return [Math.min(Math.max(x, area.x[0]), area.x[1]), Math.min(Math.max(z, area.z[0]), area.z[1])];
}

let hintShown = false;

/** 투명한 바닥: 누르면 그곳으로 걸어가요 (드래그로 화면을 돌릴 때는 무시) */
export function WalkFloor({ area }: { area: WalkArea }) {
  const down = useRef<{ x: number; y: number } | null>(null);
  const enabled = useUser((u) => u.avatar.enabled);
  useEffect(() => {
    if (enabled && !hintShown) {
      hintShown = true;
      const t = setTimeout(() => toast('바닥을 톡 누르면 내 캐릭터가 걸어가요', '👣', 3500), 2500);
      return () => clearTimeout(t);
    }
  }, [enabled]);
  const onDown = (e: ThreeEvent<PointerEvent>) => (down.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const d = down.current;
    if (d && Math.hypot(e.nativeEvent.clientX - d.x, e.nativeEvent.clientY - d.y) > 6) return;
    e.stopPropagation();
    if (!userStore.get().avatar.enabled) {
      toast('마이 힐링 › 내 캐릭터에서 “월드에 함께하기”를 켜면 걸어 다닐 수 있어요', '🧸', 4000);
      return;
    }
    const [x, z] = clampTo(area, e.point.x, e.point.z);
    walkTarget.set((p) => ({ x, z, seq: (p?.seq ?? 0) + 1 }));
  };
  const geo = useMemo(() => {
    if ('circle' in area) return new THREE.CircleGeometry(area.circle + 0.3, 40);
    return new THREE.PlaneGeometry(area.x[1] - area.x[0] + 0.4, area.z[1] - area.z[0] + 0.4);
  }, [area]);
  const center: [number, number, number] = 'circle' in area ? [0, area.y + 0.015, 0] : [(area.x[0] + area.x[1]) / 2, area.y + 0.015, (area.z[0] + area.z[1]) / 2];
  return (
    <mesh geometry={geo} position={center} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={onDown} onClick={onClick}>
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** 마이 힐링에서 꾸민 '내 캐릭터' — 바닥을 누르면 그곳으로 걸어가요 */
export function MyAvatar({ spot }: { spot: AvatarSpot }) {
  const a = useUser((u) => u.avatar);
  const ref = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);
  const goal = useRef<{ x: number; z: number; at: number } | null>(null);
  const [walking, setWalking] = useState(false);
  const yaw = useRef(spot.rotation ?? 0);

  useEffect(() => {
    walkTarget.set(() => null);
    return walkTarget.subscribe(() => {
      const t = walkTarget.get();
      if (t) goal.current = { x: t.x, z: t.z, at: performance.now() };
    });
  }, []);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = goal.current;
    if (marker.current) {
      const age = target ? (performance.now() - target.at) / 1000 : 9;
      marker.current.visible = age < 1.2;
      if (target) {
        marker.current.position.set(target.x, spot.position[1] + 0.03, target.z);
        const k = Math.min(1, age / 1.2);
        marker.current.scale.setScalar(0.6 + k * 0.8);
        (marker.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - k);
      }
    }
    if (!target) return;
    const dx = target.x - g.position.x;
    const dz = target.z - g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      goal.current = null;
      setWalking(false);
      return;
    }
    if (!walking) setWalking(true);
    const step = Math.min(dist, 1.3 * Math.min(dt, 0.12));
    g.position.x += (dx / dist) * step;
    g.position.z += (dz / dist) * step;
    const want = Math.atan2(dx, dz);
    let diff = want - yaw.current;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    yaw.current += diff * Math.min(1, dt * 10);
    g.rotation.y = yaw.current;
  });

  if (!a.enabled) return null;
  return (
    <>
      <group ref={ref} position={spot.position} rotation={[0, spot.rotation ?? 0, 0]}>
        <Character
          look={{ hair: a.hair, hairStyle: a.hairStyle, top: a.top, bottom: a.bottom, bottomType: a.bottomType }}
          pose={walking ? 'walk' : 'stand'}
          holding={walking ? 'none' : spot.holding ?? 'wave'}
          snorkel={spot.snorkel}
          phase={0.7}
          emojis={['💛', '😊', '✨']}
        />
        <Html position={[0, 1.42, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <span className="me-tag">나</span>
        </Html>
      </group>
      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.16, 0.22, 28]} />
        <Glow color="#ffffff" opacity={0.8} />
      </mesh>
    </>
  );
}
