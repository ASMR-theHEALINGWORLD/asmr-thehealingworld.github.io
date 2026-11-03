import { Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../audio/AudioEngine';
import { Character, LOOKS } from '../three/Character';
import { Glow, Island, Soft, around, faceCenter, useEmojiPops, usePointer } from '../three/common';
import { Bush, FloatingLights, GrassTuft, Mushroom, Pine, RoundTree, Rock } from '../three/props';
import type { DioramaProps } from './registry';

/** 물방울 모양의 불꽃 지오메트리 */
function useFlameGeometry() {
  return useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      const r = Math.pow(Math.sin(Math.PI * Math.min(1, u)), 0.75) * (1 - u * 0.55) * 0.5;
      pts.push(new THREE.Vector2(r, u));
    }
    return new THREE.LatheGeometry(pts, 20);
  }, []);
}

const SPARK_COUNT = 36;

function Campfire() {
  const flames = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const sparks = useRef<THREE.InstancedMesh>(null);
  const boost = useRef(-10);
  const geo = useFlameGeometry();
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const sparkSeeds = useMemo(() => Array.from({ length: SPARK_COUNT }, () => ({ life: Math.random(), x: 0, z: 0, s: 0.4 + Math.random() * 0.6, sw: Math.random() * 6 })), []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const b = Math.max(0, 1 - (performance.now() / 1000 - boost.current) / 2.2);
    if (flames.current) {
      flames.current.children.forEach((f, i) => {
        const k = 1 + Math.sin(t * 9 + i * 1.7) * 0.08 + Math.sin(t * 23 + i) * 0.04 + b * 0.45;
        const base = (f.userData.base as [number, number, number]) ?? [1, 1, 1];
        f.scale.set(base[0] * (1 + b * 0.2), base[1] * k, base[2] * (1 + b * 0.2));
        f.rotation.y = t * (0.6 + i * 0.2);
        f.rotation.z = Math.sin(t * 2.3 + i) * 0.06;
      });
    }
    if (light.current) light.current.intensity = 10 + Math.sin(t * 11) * 1.6 + Math.sin(t * 27) * 0.9 + b * 12;
    const m = sparks.current;
    if (m) {
      sparkSeeds.forEach((s, i) => {
        s.life += dt * s.s * (0.5 + b * 1.5);
        if (s.life > 1) {
          s.life = 0;
          s.x = (Math.random() - 0.5) * 0.4;
          s.z = (Math.random() - 0.5) * 0.4;
        }
        dummy.position.set(s.x + Math.sin(t * 2 + s.sw) * 0.15 * s.life, 0.4 + s.life * (2.2 + b), s.z + Math.cos(t * 1.7 + s.sw) * 0.15 * s.life);
        dummy.scale.setScalar((1 - s.life) * (0.7 + b * 0.6));
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
  });

  const onTap = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    boost.current = performance.now() / 1000;
    audioEngine.sfx('log', 0.55);
    push(['🔥', '🪵', '✨'][Math.floor(Math.random() * 3)]);
  };

  return (
    <group>
      {/* 돌 테두리 */}
      {Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2;
        return <Rock key={i} position={[Math.cos(a) * 0.62, 0.06, Math.sin(a) * 0.62]} size={0.48 + (i % 3) * 0.06} color={i % 2 ? '#a9a3b8' : '#c2bccd'} />;
      })}
      {/* 숯불 */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 24]} />
        <Glow color="#ff7a3d" opacity={0.85} />
      </mesh>
      {/* 장작 */}
      <group onClick={onTap} {...bind}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 + 0.3;
          return (
            <group key={i} position={[Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3]} rotation={[0, -a, 0]}>
              <mesh rotation={[0, 0, 0.75]} castShadow>
                <cylinderGeometry args={[0.065, 0.08, 0.62, 10]} />
                <Soft color={i % 2 ? '#8a5a3b' : '#9b6845'} />
              </mesh>
            </group>
          );
        })}
        <group ref={flames} position={[0, 0.08, 0]}>
          {(
            [
              ['#ff8a3d', [0.85, 1.25, 0.85], 0.85],
              ['#ffb347', [0.62, 0.95, 0.62], 0.92],
              ['#ffe9a3', [0.34, 0.6, 0.34], 1],
              ['#ff9a4d', [0.35, 0.6, 0.35], 0.9],
            ] as [string, [number, number, number], number][]
          ).map(([c, s, o], i) => (
            <mesh key={i} geometry={geo} scale={s} userData={{ base: s }} position={i === 3 ? [0.28, 0, 0.1] : [0, 0, 0]}>
              <Glow color={c} opacity={o} />
            </mesh>
          ))}
        </group>
        {/* 클릭 영역 확장 */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 1.3, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      <instancedMesh ref={sparks} args={[undefined, undefined, SPARK_COUNT]}>
        <sphereGeometry args={[0.03, 6, 5]} />
        <Glow color="#ffd27a" />
      </instancedMesh>
      <pointLight ref={light} position={[0, 0.9, 0]} color="#ff9b52" intensity={14} distance={11} decay={1.6} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.002} />
      {node(1.9)}
    </group>
  );
}

function Log({ length = 1.3 }: { length?: number }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.2, length, 16]} />
        <Soft color="#a26d48" />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[(s * length) / 2 + s * 0.001, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.005, 16]} />
          <Soft color="#e6c08f" />
        </mesh>
      ))}
    </group>
  );
}

function Tent(props: JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      <mesh position={[0, 0.65, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.15, 1, 1.15]} castShadow receiveShadow>
        <coneGeometry args={[1, 1.3, 4]} />
        <Soft color="#f5b48d" />
      </mesh>
      <mesh position={[0, 0.42, 0.72]} rotation={[-0.42, 0, 0]}>
        <circleGeometry args={[0.36, 3, Math.PI / 2]} />
        <Soft color="#7a4a3a" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <Soft color="#fff1d6" />
      </mesh>
    </group>
  );
}

function StringLights() {
  const pts = useMemo(() => {
    const a = new THREE.Vector3(-2.15, 1.35, -1.95);
    const b = new THREE.Vector3(0.9, 1.65, -3.2);
    return Array.from({ length: 9 }, (_, i) => {
      const u = (i + 0.5) / 9;
      const p = a.clone().lerp(b, u);
      p.y -= Math.sin(Math.PI * u) * 0.45;
      return p;
    });
  }, []);
  const colors = ['#ffd27a', '#ffb3b3', '#bfe3ff', '#d6c4ff'];
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <Glow color={colors[i % colors.length]} />
        </mesh>
      ))}
    </group>
  );
}

function Lantern(props: JSX.IntrinsicElements['group']) {
  const l = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (l.current) l.current.intensity = 2.4 + Math.sin(clock.elapsedTime * 3) * 0.3;
  });
  return (
    <group {...props}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.27, 0.36, 14]} />
        <Soft color="#b07a54" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 12]} />
        <Glow color="#ffe0a0" opacity={0.95} />
      </mesh>
      <mesh position={[0, 0.63, 0]}>
        <coneGeometry args={[0.14, 0.1, 12]} />
        <Soft color="#5d4a5c" />
      </mesh>
      <pointLight ref={l} position={[0, 0.55, 0]} color="#ffd08a" intensity={2.4} distance={3} decay={1.8} />
    </group>
  );
}

const SEATS: { a: number; look: keyof typeof LOOKS; holding: 'marshmallow' | 'mug' | 'none'; phase: number }[] = [
  { a: -2.2, look: 'haru', holding: 'marshmallow', phase: 0 },
  { a: -0.95, look: 'momo', holding: 'mug', phase: 1.3 },
  { a: 0.35, look: 'toto', holding: 'marshmallow', phase: 2.6 },
  { a: 2.75, look: 'lulu', holding: 'mug', phase: 3.4 },
];

export function CampfireDiorama({ lite }: DioramaProps) {
  return (
    <group>
      <Island radius={4.3} top="#89bb78" strata={['#bb8b5f', '#966841']} seed={2} />
      <Campfire />
      {SEATS.map((s) => {
        const [x, , z] = around(1.75, s.a);
        return (
          <group key={s.a} position={[x, 0, z]} rotation={[0, faceCenter(x, z), 0]}>
            <Log />
            <Character look={LOOKS[s.look]} pose="sit" holding={s.holding} position={[0, 0.42, -0.02]} phase={s.phase} emojis={['🔥', '💛', '🍡', '✨']} />
          </group>
        );
      })}

      <Tent position={[-2.4, 0, -1.6]} rotation={[0, 0.7, 0]} />
      <StringLights />
      <Lantern position={[2.75, 0, -1.25]} />

      {[
        [-1.3, -3.4, 1.15], [0.2, -3.75, 1.3], [1.9, -3.2, 1.05], [3.1, -2.2, 0.95], [-3.3, -0.6, 0.9],
        [3.7, -0.3, 0.8], [-3.5, 1.6, 0.75], [-0.6, -3.0, 0.8],
      ].map(([x, z, s], i) => (
        <Pine key={i} position={[x, 0, z]} size={s} color={i % 2 ? '#5b9677' : '#4f8a73'} />
      ))}
      <RoundTree position={[3.3, 0, 1.7]} size={0.85} color="#7bb07a" />
      {!lite && (
        <>
          <Bush position={[-2.6, 0, 2.6]} color="#7db374" />
          <Bush position={[1.2, 0, 3.4]} size={0.8} color="#86bb7b" />
          <Mushroom position={[-1.2, 0, 2.9]} />
          <Mushroom position={[-1.0, 0, 3.05]} size={0.7} cap="#f7b267" />
          <Mushroom position={[2.6, 0, 2.6]} size={0.8} />
          {[[-2, 1.5], [0.4, 2.9], [2.2, 0.9], [-0.6, -2.4], [1.5, -1.9], [-3.3, 0.6], [3.4, 0.7]].map(([x, z], i) => (
            <GrassTuft key={i} position={[x, 0, z]} color="#6ea862" />
          ))}
        </>
      )}
      <FloatingLights count={lite ? 8 : 24} radius={4.2} />
    </group>
  );
}

export function CampfireEnvironment() {
  return (
    <>
      <color attach="background" args={['#1b2340']} />
      <fog attach="fog" args={['#1b2340', 16, 38]} />
      <ambientLight intensity={0.45} color="#9aa8ff" />
      <hemisphereLight args={['#8494e0', '#2a2340', 0.7]} />
      <directionalLight
        position={[-6, 10, -5]}
        intensity={0.7}
        color="#b4c0ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <Stars radius={60} depth={25} count={2200} factor={3.2} saturation={0} fade speed={0.6} />
      {/* 달 */}
      <mesh position={[-9, 10, -18]}>
        <sphereGeometry args={[1.3, 32, 24]} />
        <Glow color="#fff4cf" />
      </mesh>
      <mesh position={[-9, 10, -18.5]}>
        <sphereGeometry args={[2.1, 32, 24]} />
        <Glow color="#fff4cf" opacity={0.08} />
      </mesh>
      {/* 먼 숲 실루엣 */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = Math.PI + (i / 15) * Math.PI;
        const r = 19 + (i % 3) * 3;
        return <Pine key={i} position={[Math.cos(a) * r, -3.2, Math.sin(a) * r]} size={2.6 + (i % 4) * 0.4} color="#263357" trunk="#222b47" sway={0.005} />;
      })}
    </>
  );
}
