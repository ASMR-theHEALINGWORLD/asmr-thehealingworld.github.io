import { Html, Sparkles, Stars } from '@react-three/drei';
import { SKY, type SkyPalette } from '../hooks/useDayPhase';
import { useUser } from '../store/userStore';
import { SeasonalEffect } from '../three/Seasonal';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { WORLDS } from '../data/worlds';
import { Cloud } from '../three/common';
import { WORLD_SCENES } from '../worlds/registry';
import type { WorldDef } from '../types';

const SPACING = 5.3;
const COLS = 3;

/** 데스크톱은 3열 격자, 모바일은 한 줄로 늘어놓고 카메라가 이동 */
function islandPos(i: number, compact: boolean): [number, number, number] {
  if (compact) return [i * SPACING, 0, 0];
  const rows = Math.ceil(WORLDS.length / COLS);
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  return [(col - (COLS - 1) / 2) * 5.7, 0, (row - (rows - 1) / 2) * 6.6];
}

/** 미리보기 안의 오브젝트들은 개별 인터랙션 대신 섬 전체 클릭으로 처리 */
function NoRaycast({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      o.raycast = () => undefined;
    });
  });
  return <group ref={ref}>{children}</group>;
}

function MapIsland({ world, index, position, onSelect, onHover, active, showLabel }: { world: WorldDef; index: number; position: [number, number, number]; onSelect: (id: string) => void; onHover: (i: number | null) => void; active: boolean; showLabel: boolean }) {
  const scene = WORLD_SCENES[world.id];
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const lift = hovered || active;
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime + index * 1.7;
    const target = lift ? 1.1 : 1;
    const s = THREE.MathUtils.damp(g.scale.x, target, 6, dt);
    g.scale.setScalar(s);
    g.position.y = THREE.MathUtils.damp(g.position.y, (lift ? 0.35 : 0) + Math.sin(t * 0.8) * 0.12, 5, dt);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, (lift ? 0.25 : 0) + Math.sin(t * 0.3) * 0.08, 3, dt);
  });
  const { Diorama } = scene;
  const fav = useUser((u) => u.favorites.includes(world.id));
  const recent = useUser((u) => u.recent[0] === world.id);
  return (
    <group position={position}>
      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(world.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(index);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
          document.body.style.cursor = '';
        }}
      >
        <group scale={scene.mapScale}>
          <NoRaycast>
            <Diorama lite />
          </NoRaycast>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[5.0, 5.0, 5, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {scene.dome && (
            <>
              <mesh position={[0, -0.05, 0]} raycast={() => undefined}>
                <sphereGeometry args={[5.1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={scene.dome} transparent opacity={0.28} roughness={0.05} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[5.1, 0.12, 10, 64]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
            </>
          )}
        </group>
      </group>
      {showLabel && (
      <Html position={[0, -0.9, 1.75]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`map-label ${lift ? 'is-lift' : ''}`} style={{ ['--accent' as string]: world.theme.accent }}>
          <span className="map-label__no">
            WORLD {world.no}
            {fav && <i className="map-label__badge">♥</i>}
            {recent && <i className="map-label__badge map-label__badge--recent">최근</i>}
          </span>
          <strong>{world.title}</strong>
          <span className="map-label__tag">{world.tagline}</span>
        </div>
      </Html>
      )}
    </group>
  );
}

function CameraRig({ compact, focus }: { compact: boolean; focus: number }) {
  const { camera, pointer } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const fx = compact ? focus * SPACING : 0;
    const px = compact ? 0 : pointer.x * 0.8;
    const py = compact ? 0 : pointer.y * 0.4;
    const tx = fx + px;
    const ty = compact ? 4.2 : 15.5 + py;
    const tz = compact ? 9.8 : 15.2;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 3, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tz, 3, dt);
    look.set(THREE.MathUtils.damp(look.x, fx, 3, dt), compact ? 0.4 : -0.9, compact ? 0 : -0.1);
    camera.lookAt(look);
  });
  return null;
}

export function MapScene({ compact, focus, onSelect, onFocus, sky = SKY.day }: { compact: boolean; focus: number; onSelect: (id: string) => void; onFocus: (i: number) => void; sky?: SkyPalette }) {
  return (
    <>
      <color attach="background" args={[sky.bg]} />
      <fog attach="fog" args={[sky.fog, 16, 36]} />
      <ambientLight intensity={sky.ambient} color="#fff8ee" />
      <hemisphereLight args={sky.hemi} />
      {sky.stars && <Stars radius={60} depth={25} count={1500} factor={3} saturation={0} fade speed={0.5} />}
      <SeasonalEffect count={70} area={12} height={10} />
      <directionalLight position={[4, 10, 6]} intensity={sky.sun[1]} color={sky.sun[0]} castShadow shadow-mapSize={[2048, 1024]} shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={5} shadow-camera-bottom={-5} />

      {WORLDS.map((w, i) => (
        <MapIsland key={w.id} world={w} index={i} position={islandPos(i, compact)} onSelect={onSelect} onHover={(h) => h !== null && !compact && onFocus(h)} active={compact ? focus === i : false} showLabel={!compact} />
      ))}

      <mesh position={[0, -2.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[50, 48]} />
        <meshStandardMaterial color={sky.sea} roughness={0.35} />
      </mesh>
      <Sparkles count={70} scale={[30, 0.5, 14]} position={[0, -2.4, 0]} size={4} speed={0.3} color="#ffffff" />
      <Cloud position={[-9, 2.6, -4]} scale={1.2} />
      <Cloud position={[9.5, 3.4, -5]} scale={1.1} speed={0.3} />
      <Cloud position={[-2.8, 4.2, -7]} scale={1.3} speed={0.25} />
      <Cloud position={[3, -1.8, 4]} scale={0.7} />
      <Cloud position={[-6.5, -1.6, 3.5]} scale={0.8} speed={0.5} />
      <CameraRig compact={compact} focus={focus} />
    </>
  );
}
