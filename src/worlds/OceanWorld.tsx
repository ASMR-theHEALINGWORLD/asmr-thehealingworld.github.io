import { Sparkles } from '@react-three/drei';
import { useFrame, type GroupProps, type MeshProps } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../audio/AudioEngine';
import { Character, LOOKS, type Holding, type Look, type Pose } from '../three/Character';
import { Glow, Island, Soft, useEmojiPops, usePointer } from '../three/common';
import { Rock } from '../three/props';
import type { DioramaProps } from './registry';

/* ---------------- 해초 ---------------- */
function Kelp({ segments = 7, color = '#7fd0a0', phase = 0, ...props }: GroupProps & { segments?: number; color?: string; phase?: number }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    refs.current.forEach((g, i) => {
      if (g) {
        g.rotation.z = Math.sin(t * 1.1 - i * 0.5) * 0.12;
        g.rotation.x = Math.cos(t * 0.8 - i * 0.4) * 0.06;
      }
    });
  });
  const build = (i: number): JSX.Element | null =>
    i >= segments ? null : (
      <group ref={(el) => (refs.current[i] = el)} position={[0, i === 0 ? 0 : 0.26, 0]}>
        <mesh position={[0, 0.13, 0]} castShadow>
          <capsuleGeometry args={[0.07 - i * 0.004, 0.14, 4, 10]} />
          <Soft color={color} />
        </mesh>
        {i % 2 === 1 && (
          <mesh position={[0.09, 0.14, 0]} rotation={[0, 0, -0.8]} scale={[1, 0.6, 0.4]}>
            <sphereGeometry args={[0.08, 10, 8]} />
            <Soft color={color} />
          </mesh>
        )}
        {build(i + 1)}
      </group>
    );
  return <group {...props}>{build(0)}</group>;
}

/* ---------------- 산호 ---------------- */
function BranchCoral({ color = '#ff9fb5', size = 1, ...props }: GroupProps & { color?: string; size?: number }) {
  const branches = useMemo(
    () => [
      [0, 0, 0.5],
      [0.4, 0.5, 0.4],
      [-0.45, 0.4, 0.38],
      [0.15, 0.9, 0.3],
      [-0.2, 0.95, 0.28],
      [0.7, 0.65, 0.25],
    ],
    [],
  );
  return (
    <group {...props} scale={size}>
      {branches.map(([rz, y, len], i) => (
        <group key={i} position={[rz * 0.3, y * 0.4, 0]} rotation={[((i % 3) - 1) * 0.25, 0, -rz]}>
          <mesh position={[0, len / 2, 0]} castShadow>
            <capsuleGeometry args={[0.07, len, 4, 10]} />
            <Soft color={color} />
          </mesh>
          <mesh position={[0, len + 0.05, 0]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <Soft color={new THREE.Color(color).offsetHSL(0, 0, 0.06).getStyle()} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BrainCoral({ color = '#ffd27a', size = 1, ...props }: GroupProps & { color?: string; size?: number }) {
  return (
    <group {...props} scale={size}>
      <mesh position={[0, 0.18, 0]} scale={[1, 0.75, 1]} castShadow>
        <sphereGeometry args={[0.35, 24, 18]} />
        <Soft color={color} />
      </mesh>
      {[0.12, 0.22, 0.3].map((y, i) => (
        <mesh key={i} position={[0, 0.1 + y * 0.75, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[Math.sqrt(0.35 ** 2 - (y - 0.08) ** 2) * 0.98, 0.022, 6, 28]} />
          <Soft color={new THREE.Color(color).offsetHSL(0, 0, -0.06).getStyle()} />
        </mesh>
      ))}
    </group>
  );
}

function TubeSponge({ color = '#c7a6ff', ...props }: GroupProps & { color?: string }) {
  return (
    <group {...props}>
      {[
        [0, 0.55],
        [0.2, 0.38],
        [-0.17, 0.42],
      ].map(([x, h], i) => (
        <group key={i} position={[x, 0, (i - 1) * 0.08]}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.08, h, 14, 1, true]} />
            <Soft color={color} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.09, 0.02, 6, 16]} />
            <Soft color={color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Starfish({ color = '#ffab91', ...props }: GroupProps & { color?: string }) {
  return (
    <group {...props}>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]} position={[0, 0.03, 0]}>
          <mesh position={[0.12, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.5]}>
            <coneGeometry args={[0.06, 0.24, 8]} />
            <Soft color={color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Shell({ color = '#fff0f3', ...props }: MeshProps & { color?: string }) {
  return (
    <mesh {...props} rotation={[-0.4, 0, 0]} scale={[1, 0.35, 0.9]} castShadow>
      <sphereGeometry args={[0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Soft color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ---------------- 물고기 ---------------- */
interface FishProps {
  radius: number;
  height: number;
  speed: number;
  color: string;
  fin: string;
  size?: number;
  phase?: number;
}
function Fish({ radius, height, speed, color, fin, size = 1, phase = 0 }: FishProps) {
  const ref = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const angle = useRef(phase);
  const dash = useRef(-10);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const b = Math.max(0, 1 - (performance.now() / 1000 - dash.current) / 1.2);
    const v = speed * (1 + b * 4);
    angle.current += dt * v;
    const a = angle.current;
    const y = height + Math.sin(t * 0.9 + phase) * 0.25;
    if (ref.current) {
      ref.current.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      // 진행 방향 바라보기
      ref.current.rotation.y = -a + (speed > 0 ? 0 : Math.PI);
    }
    if (tail.current) tail.current.rotation.y = Math.sin(t * (8 + b * 12) + phase) * 0.5;
  });
  return (
    <group ref={ref}>
      <group
        scale={size}
        onClick={(e) => {
          e.stopPropagation();
          dash.current = performance.now() / 1000;
          audioEngine.sfx('splash', 0.45);
          push(['🫧', '💙', '✨'][Math.floor(Math.random() * 3)]);
        }}
        {...bind}
      >
        {/* 몸: +z 방향이 아닌 접선 방향(-x 로컬)을 향하도록 */}
        <group>
          <mesh scale={[0.14, 0.18, 0.28]} castShadow>
            <sphereGeometry args={[1, 20, 16]} />
            <Soft color={color} rough={0.6} />
          </mesh>
          <group ref={tail} position={[0, 0, -0.26]}>
            <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[0.3, 1, 1]}>
              <coneGeometry args={[0.13, 0.18, 12]} />
              <Soft color={fin} />
            </mesh>
          </group>
          <mesh position={[0, 0.17, -0.02]} rotation={[0.3, 0, 0]} scale={[0.25, 1, 1]}>
            <coneGeometry args={[0.08, 0.12, 8]} />
            <Soft color={fin} />
          </mesh>
          {[1, -1].map((s) => (
            <group key={s} position={[s * 0.11, 0.04, 0.16]}>
              <mesh>
                <sphereGeometry args={[0.035, 10, 8]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[s * 0.018, 0, 0.01]}>
                <sphereGeometry args={[0.02, 8, 6]} />
                <meshStandardMaterial color="#2f2a33" />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      {node(0.4)}
    </group>
  );
}

/* ---------------- 해파리 ---------------- */
function Jelly({ color = '#ffc6e0', phase = 0, ...props }: GroupProps & { color?: string; phase?: number }) {
  const ref = useRef<THREE.Group>(null);
  const bell = useRef<THREE.Mesh>(null);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    if (ref.current) ref.current.position.y = Math.sin(t * 0.6) * 0.4;
    if (bell.current) {
      const k = 1 + Math.sin(t * 2.2) * 0.08;
      bell.current.scale.set(k, 2 - k, k);
    }
  });
  return (
    <group {...props}>
      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.sfx('chime', 0.35);
          push('🎐');
        }}
        {...bind}
      >
        <mesh ref={bell}>
          <sphereGeometry args={[0.28, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} transparent opacity={0.75} emissive={color} emissiveIntensity={0.35} side={THREE.DoubleSide} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.14, -0.22, Math.sin(a) * 0.14]}>
              <capsuleGeometry args={[0.018, 0.35, 4, 6]} />
              <meshStandardMaterial color={color} transparent opacity={0.6} />
            </mesh>
          );
        })}
        {node(0.5)}
      </group>
    </group>
  );
}

/* ---------------- 공기방울 ---------------- */
function Bubbles({ count = 40, area = 4 }: { count?: number; area?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () => Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * area * 1.6, z: (Math.random() - 0.5) * area * 1.6, y: Math.random() * 6, s: 0.3 + Math.random() * 0.6, r: 0.4 + Math.random() * 0.8, p: Math.random() * 10 })),
    [count, area],
  );
  useFrame(({ clock }, dt) => {
    const m = ref.current;
    if (!m) return;
    seeds.forEach((b, i) => {
      b.y += dt * b.s;
      if (b.y > 6.5) b.y = 0;
      dummy.position.set(b.x + Math.sin(clock.elapsedTime * 2 + b.p) * 0.08, b.y, b.z);
      dummy.scale.setScalar(b.r * (0.6 + b.y * 0.08));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.06, 12, 10]} />
      <meshStandardMaterial color="#e8fbff" transparent opacity={0.55} roughness={0.05} emissive="#bff4ff" emissiveIntensity={0.3} />
    </instancedMesh>
  );
}

/* ---------------- 헤엄치는 캐릭터 ---------------- */
function Swimmer({ look, radius, height, speed, phase, pose = 'swim', holding = 'none' }: { look: Look; radius: number; height: number; speed: number; phase: number; pose?: Pose; holding?: Holding }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * speed + phase;
    if (ref.current) {
      ref.current.position.set(Math.cos(a) * radius, height + Math.sin(a * 2) * 0.3, Math.sin(a) * radius);
      // 원의 접선 방향(+z 로컬)을 바라봄
      ref.current.rotation.y = -a + (speed > 0 ? 0 : Math.PI);
    }
  });
  return (
    <group ref={ref}>
      <Character look={look} pose={pose} holding={holding} snorkel phase={phase} emojis={['🫧', '🐠', '💙']} sfx="bubble" />
    </group>
  );
}

/* ---------------- 빛줄기 ---------------- */
function LightRays() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    ref.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.03 + Math.max(0, Math.sin(clock.elapsedTime * 0.4 + i * 1.3)) * 0.05;
    });
  });
  return (
    <group ref={ref}>
      {[
        [-2, -1, 0.3],
        [1.2, -2, -0.2],
        [2.6, 1, 0.25],
        [-0.6, 1.6, -0.3],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 5.5, z]} rotation={[0, 0, r]}>
          <cylinderGeometry args={[0.25, 0.9, 9, 16, 1, true]} />
          <meshBasicMaterial color="#e9fdff" transparent opacity={0.08} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

const FISH: FishProps[] = [
  { radius: 2.4, height: 1.2, speed: 0.35, color: '#ffd36e', fin: '#ff9f6e', phase: 0 },
  { radius: 2.6, height: 1.5, speed: 0.35, color: '#ffd36e', fin: '#ff9f6e', phase: 0.35, size: 0.8 },
  { radius: 2.2, height: 1.0, speed: 0.35, color: '#ffd36e', fin: '#ff9f6e', phase: 0.6, size: 0.75 },
  { radius: 3.4, height: 2.6, speed: -0.25, color: '#9fd8ff', fin: '#6fb2f2', phase: 2 },
  { radius: 3.2, height: 2.9, speed: -0.25, color: '#9fd8ff', fin: '#6fb2f2', phase: 2.4, size: 0.8 },
  { radius: 1.6, height: 2.2, speed: 0.5, color: '#ffb3c8', fin: '#ff8fb0', phase: 4, size: 0.9 },
  { radius: 3.8, height: 1.8, speed: 0.2, color: '#c9b6ff', fin: '#a58cf2', phase: 5, size: 1.2 },
];

export function OceanDiorama({ lite }: DioramaProps) {
  return (
    <group>
      <Island radius={4.3} top="#f4e2b8" strata={['#dcc192', '#c3a374']} seed={5} />
      {/* 모래 언덕 */}
      {[
        [-1.8, -1.4, 1.1],
        [2.0, -1.8, 0.9],
        [0.4, 2.4, 0.8],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, -0.05, z]} scale={[s * 1.2, s * 0.35, s]} receiveShadow>
          <sphereGeometry args={[1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Soft color="#f1dcae" />
        </mesh>
      ))}
      <Rock position={[-2.3, 0.15, -0.4]} size={1.7} color="#9fb4cf" />
      <Rock position={[-1.9, 0.1, 0.2]} size={1.0} color="#b5c4da" />
      <Rock position={[2.6, 0.12, 0.6]} size={1.4} color="#a7b8d6" />

      <BranchCoral position={[-1.8, 0.1, -1.3]} color="#ff9fb5" size={1.3} />
      <BranchCoral position={[2.2, 0.05, -1.6]} color="#ffb38a" size={1.1} rotation={[0, 1, 0]} />
      <BranchCoral position={[-0.6, 0, 2.4]} color="#c7a6ff" size={0.8} rotation={[0, 2, 0]} />
      <BrainCoral position={[0.9, 0, -0.9]} color="#ffd27a" />
      <BrainCoral position={[-2.8, 0, 1.4]} color="#9be3c4" size={0.8} />
      <TubeSponge position={[2.8, 0, -0.6]} color="#c7a6ff" />
      <TubeSponge position={[-0.4, 0, -2.6]} color="#ffa8a8" />
      {[
        [-3.2, -1.2, '#7fd0a0', 7],
        [-2.8, -2.0, '#94dcb0', 9],
        [3.3, 1.6, '#7fd0a0', 6],
        [1.2, -2.8, '#6cc49a', 8],
        [0.2, -3.2, '#94dcb0', 6],
        [3.5, -1.2, '#7fd0a0', 7],
      ].map(([x, z, c, n], i) => (
        <Kelp key={i} position={[x as number, 0, z as number]} color={c as string} segments={n as number} phase={i} />
      ))}
      <Starfish position={[1.4, 0, 2.1]} rotation={[0, 0.4, 0]} />
      <Starfish position={[-2.4, 0, 2.6]} color="#ffd27a" rotation={[0, 1.2, 0]} />
      <Shell position={[0.3, 0.02, 3.0]} />
      <Shell position={[2.5, 0.02, 2.4]} color="#ffe0d0" />

      {FISH.map((f, i) => (
        <Fish key={i} {...f} />
      ))}
      <Jelly position={[-2.6, 3.2, -1.8]} />
      {!lite && <Jelly position={[2.9, 3.6, -2.4]} color="#c9d6ff" phase={2} />}

      <Swimmer look={LOOKS.nana} radius={2.1} height={2.0} speed={0.22} phase={0} />
      <Swimmer look={{ ...LOOKS.toto, hair: '#8a6a55', top: '#ffd9a0' }} radius={2.9} height={1.4} speed={-0.17} phase={2.5} />
      <Character look={LOOKS.momo} snorkel holding="wave" position={[0.9, 0, 1.3]} rotation={[0, -0.3, 0]} phase={1} emojis={['🐠', '🫧', '👋']} sfx="bubble" />

      <Bubbles count={lite ? 14 : 40} />
    </group>
  );
}

function Whale() {
  const ref = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.05;
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * 16, 3.5 + Math.sin(t * 3) * 0.6, -14 + Math.sin(t) * 3);
      ref.current.rotation.y = -t + Math.PI;
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.05;
    }
    if (tail.current) tail.current.rotation.x = Math.sin(clock.elapsedTime * 0.8) * 0.25;
  });
  return (
    <group ref={ref}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <mesh scale={[1.5, 1.2, 3.2]}>
          <sphereGeometry args={[1, 32, 24]} />
          <Soft color="#7fa8cf" />
        </mesh>
        <mesh position={[0, -0.45, 0.4]} scale={[1.2, 0.8, 2.6]}>
          <sphereGeometry args={[1, 24, 18]} />
          <Soft color="#d6ecf7" />
        </mesh>
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 1.4, -0.5, 0.6]} rotation={[0.3, 0, s * 0.7]} scale={[0.9, 0.12, 0.45]}>
            <sphereGeometry args={[1, 16, 12]} />
            <Soft color="#7fa8cf" />
          </mesh>
        ))}
        <group ref={tail} position={[0, 0.1, -2.9]}>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.7, 0.1, -0.5]} rotation={[0, s * -0.5, 0]} scale={[0.9, 0.12, 0.5]}>
              <sphereGeometry args={[1, 16, 12]} />
              <Soft color="#7fa8cf" />
            </mesh>
          ))}
        </group>
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 1.05, 0.2, 2.2]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#2f3a4a" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function OceanEnvironment() {
  return (
    <>
      <color attach="background" args={['#3f9cc6']} />
      <fog attach="fog" args={['#4aa6cc', 12, 34]} />
      <ambientLight intensity={0.7} color="#c8f3ff" />
      <hemisphereLight args={['#c4f4ff', '#2a6d96', 0.9]} />
      <directionalLight
        position={[3, 12, 4]}
        intensity={1.5}
        color="#e8fdff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <LightRays />
      <Whale />
      <Sparkles count={80} scale={[18, 8, 14]} position={[0, 3, 0]} size={2.5} speed={0.25} color="#e8fdff" opacity={0.7} />
      {/* 수면 */}
      <mesh position={[0, 11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 32]} />
        <Glow color="#bff3ff" opacity={0.35} />
      </mesh>
    </>
  );
}
