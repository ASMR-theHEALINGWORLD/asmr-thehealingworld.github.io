import { RoundedBox, Sparkles, Stars } from '@react-three/drei';
import { useFrame, type GroupProps } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../audio/AudioEngine';
import { Character, LOOKS, type Look } from '../three/Character';
import { Glow, Soft, useEmojiPops, usePointer } from '../three/common';
import type { DioramaProps } from './registry';

const TRACK_Z = -1.9;
const PLATFORM_Y = 0.5;

/* ---------------- 선로 ---------------- */
function Track({ length }: { length: number }) {
  const sleepers = Math.floor(length / 0.5);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < sleepers; i++) {
      d.position.set(-length / 2 + 0.25 + i * 0.5, 0.19, 0);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [sleepers, length]);
  return (
    <group position={[0, 0, TRACK_Z]}>
      <RoundedBox args={[length, 0.16, 1.5]} radius={0.06} position={[0, 0.08, 0]} receiveShadow>
        <Soft color="#7c7f98" />
      </RoundedBox>
      <instancedMesh ref={ref} args={[undefined, undefined, sleepers]} receiveShadow>
        <boxGeometry args={[0.22, 0.06, 1.25]} />
        <Soft color="#6b5548" />
      </instancedMesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0.25, s * 0.42]} castShadow>
          <boxGeometry args={[length, 0.07, 0.07]} />
          <meshStandardMaterial color="#c9cbe0" roughness={0.35} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- 기차 한 칸 ---------------- */
const CAR_L = 3.2;
const OPENINGS = [
  { x: -1.2, w: 0.44, door: false },
  { x: -0.62, w: 0.44, door: false },
  { x: 0, w: 0.6, door: true },
  { x: 0.62, w: 0.44, door: false },
  { x: 1.2, w: 0.44, door: false },
];

function TrainCar({ passengers, front, doorRef }: { passengers: { look: Look; x: number; sleepy?: boolean }[]; front?: boolean; doorRef: (el: THREE.Group | null) => void }) {
  const body = '#f6efe2';
  const stripe = '#7f8fd1';
  // 창문 사이 기둥 계산
  const pillars = useMemo(() => {
    const out: [number, number][] = [];
    let cur = -CAR_L / 2;
    for (const o of OPENINGS) {
      const a = o.x - o.w / 2;
      if (a > cur) out.push([cur, a]);
      cur = o.x + o.w / 2;
    }
    if (cur < CAR_L / 2) out.push([cur, CAR_L / 2]);
    return out;
  }, []);
  const z = 0.62;
  return (
    <group>
      {/* 바닥, 뒷벽(따뜻한 실내등), 양 끝 벽 */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[CAR_L, 0.1, 1.24]} />
        <Soft color="#b9a08a" />
      </mesh>
      <mesh position={[0, 0.75, -z]}>
        <boxGeometry args={[CAR_L, 1.3, 0.08]} />
        <meshStandardMaterial color="#ffe9c2" emissive="#ffd28f" emissiveIntensity={0.55} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * CAR_L) / 2, 0.75, 0]} castShadow>
          <boxGeometry args={[0.08, 1.3, 1.32]} />
          <Soft color={body} />
        </mesh>
      ))}
      <RoundedBox args={[CAR_L - 0.2, 0.1, 0.36]} radius={0.04} position={[0, 0.42, -0.36]}>
        <Soft color="#d97b7b" />
      </RoundedBox>
      <RoundedBox args={[CAR_L - 0.2, 0.36, 0.1]} radius={0.04} position={[0, 0.62, -0.53]}>
        <Soft color="#d97b7b" />
      </RoundedBox>
      {/* 앞벽: 아래 띠 / 위 띠 / 창 기둥 */}
      {[[-CAR_L / 2, -0.3], [0.3, CAR_L / 2]].map(([a, b], i) => (
        <mesh key={i} position={[(a + b) / 2, 0.44, z]} castShadow>
          <boxGeometry args={[b - a, 0.62, 0.08]} />
          <Soft color={body} />
        </mesh>
      ))}
      {[[-CAR_L / 2, -0.3], [0.3, CAR_L / 2]].map(([a, b], i) => (
        <mesh key={`s${i}`} position={[(a + b) / 2, 0.58, z + 0.045]}>
          <boxGeometry args={[b - a, 0.08, 0.01]} />
          <Soft color={stripe} />
        </mesh>
      ))}
      <mesh position={[0, 1.33, z]} castShadow>
        <boxGeometry args={[CAR_L, 0.16, 0.08]} />
        <Soft color={body} />
      </mesh>
      {pillars.map(([a, b], i) => (
        <mesh key={`p${i}`} position={[(a + b) / 2, 1.0, z]}>
          <boxGeometry args={[b - a, 0.5, 0.08]} />
          <Soft color={body} />
        </mesh>
      ))}
      {/* 문 */}
      <group ref={doorRef} position={[0, 0, z + 0.05]}>
        {[-1, 1].map((s) => (
          <group key={s} name={s < 0 ? 'L' : 'R'} position={[s * 0.15, 0.7, 0]}>
            <mesh>
              <boxGeometry args={[0.3, 1.12, 0.05]} />
              <Soft color="#e9dfcd" />
            </mesh>
            <mesh position={[0, 0.25, 0.03]}>
              <boxGeometry args={[0.18, 0.32, 0.01]} />
              <meshStandardMaterial color="#ffe9c2" emissive="#ffd28f" emissiveIntensity={0.4} />
            </mesh>
          </group>
        ))}
      </group>
      {/* 지붕 */}
      <RoundedBox args={[CAR_L + 0.1, 0.2, 1.4]} radius={0.08} position={[0, 1.5, 0]} castShadow>
        <Soft color={stripe} />
      </RoundedBox>
      <mesh position={[0, 1.62, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.6, 14]} />
        <Soft color="#9aa6dd" />
      </mesh>
      {/* 바퀴 */}
      {[-1.1, -0.7, 0.7, 1.1].map((x) =>
        [1, -1].map((s) => (
          <mesh key={`${x}${s}`} position={[x, -0.05, s * 0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.08, 16]} />
            <Soft color="#3d3f5a" />
          </mesh>
        )),
      )}
      {front && (
        <group position={[CAR_L / 2 + 0.06, 0.55, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.08, 16]} />
            <Glow color="#fff3c4" />
          </mesh>
        </group>
      )}
      {/* 창가의 승객 */}
      {passengers.map((p, i) => (
        <Character key={i} look={p.look} pose="sit" sleepy={p.sleepy} position={[p.x, 0.47, -0.22]} scale={0.78} phase={i * 1.7} sway={0.4} />
      ))}
    </group>
  );
}

/** 도착 → 정차(문 열림) → 출발 → 잠시 비어 있음 — 36초 주기 */
const CYCLE = 36;
const smooth = (k: number) => k * k * (3 - 2 * k);
function trainState(t: number) {
  const c = t % CYCLE;
  if (c < 7) return { x: -18 * Math.pow(1 - c / 7, 2), door: 0 };
  if (c < 15) {
    const open = c < 8 ? 0 : c < 8.8 ? smooth((c - 8) / 0.8) : c < 13.2 ? 1 : c < 14 ? 1 - smooth((c - 13.2) / 0.8) : 0;
    return { x: 0, door: open };
  }
  if (c < 22) return { x: 18 * Math.pow((c - 15) / 7, 2), door: 0 };
  return { x: -60, door: 0 };
}

function Train({ lite }: { lite?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const doors = useRef<(THREE.Group | null)[]>([]);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(({ clock }) => {
    const s = lite ? { x: 0, door: 0 } : trainState(clock.elapsedTime + 2);
    if (ref.current) {
      ref.current.position.x = s.x;
      ref.current.position.y = 0.48 + (s.x !== 0 && s.x > -50 ? Math.sin(clock.elapsedTime * 18) * 0.008 : 0);
    }
    doors.current.forEach((g) => {
      if (!g) return;
      g.children.forEach((leaf) => (leaf.position.x = (leaf.name === 'L' ? -1 : 1) * (0.15 + s.door * 0.29)));
    });
  });
  return (
    <group position={[0, 0, TRACK_Z]}>
      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.sfx('whistle', 0.3);
          push(['🚃', '🌙', '✨'][Math.floor(Math.random() * 3)]);
        }}
        {...bind}
      >
        <group position={[-1.7, 0, 0]}>
          <TrainCar doorRef={(el) => (doors.current[0] = el)} passengers={[{ look: LOOKS.nana, x: -1.2 }, { look: { ...LOOKS.toto, hair: '#7a5a48', top: '#b9d3ff' }, x: 0.62, sleepy: true }]} />
        </group>
        <group position={[1.7, 0, 0]}>
          <TrainCar front doorRef={(el) => (doors.current[1] = el)} passengers={[{ look: LOOKS.lulu, x: -0.62 }]} />
        </group>
        <pointLight position={[0, 1.0, 0]} color="#ffd59a" intensity={3} distance={5} decay={1.6} />
        {node(2.2)}
      </group>
    </group>
  );
}

/* ---------------- 역 시계 (초침이 똑딱) ---------------- */
function StationClock(props: GroupProps) {
  const sec = useRef<THREE.Group>(null);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(() => {
    const now = new Date();
    if (sec.current) sec.current.rotation.z = -(now.getSeconds() / 60) * Math.PI * 2;
  });
  const hand = (angle: number, len: number, w: number, c: string, z = 0.075) => (
    <group rotation={[0, 0, -angle]}>
      <mesh position={[0, len / 2, z]}>
        <boxGeometry args={[w, len, 0.01]} />
        <meshBasicMaterial color={c} />
      </mesh>
    </group>
  );
  return (
    <group {...props}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 2.3, 10]} />
        <Soft color="#4b4f73" />
      </mesh>
      <group
        position={[0, 2.5, 0]}
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.sfx('chime', 0.35);
          push('🕰️');
        }}
        {...bind}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.12, 32]} />
          <Soft color="#4b4f73" />
        </mesh>
        <mesh position={[0, 0, 0.065]}>
          <circleGeometry args={[0.29, 32]} />
          <meshBasicMaterial color="#fff8e6" toneMapped={false} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.24, Math.cos((i / 12) * Math.PI * 2) * 0.24, 0.07]}>
            <circleGeometry args={[i % 3 ? 0.008 : 0.016, 8]} />
            <meshBasicMaterial color="#4b4f73" />
          </mesh>
        ))}
        {/* 새벽 세 시 */}
        {hand((3 / 12) * Math.PI * 2, 0.13, 0.025, '#3b3f5f')}
        {hand(0.1, 0.2, 0.016, '#3b3f5f')}
        <group ref={sec}>
          <mesh position={[0, 0.1, 0.08]}>
            <boxGeometry args={[0.006, 0.22, 0.01]} />
            <meshBasicMaterial color="#e8705f" />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.085]}>
          <circleGeometry args={[0.02, 12]} />
          <meshBasicMaterial color="#e8705f" />
        </mesh>
      </group>
      {node(3.0)}
    </group>
  );
}

function Lamp({ light = true, ...props }: GroupProps & { light?: boolean }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 1.9, 8]} />
        <Soft color="#4b4f73" />
      </mesh>
      <mesh position={[0, 1.97, 0]}>
        <coneGeometry args={[0.2, 0.14, 16]} />
        <Soft color="#4b4f73" />
      </mesh>
      <mesh position={[0, 1.84, 0]}>
        <sphereGeometry args={[0.11, 14, 10]} />
        <Glow color="#ffe4a3" />
      </mesh>
      {light && <pointLight position={[0, 1.75, 0]} color="#ffcf87" intensity={4} distance={5} decay={1.6} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.003} />}
    </group>
  );
}

function Bench(props: GroupProps) {
  return (
    <group {...props}>
      <RoundedBox args={[1.4, 0.08, 0.42]} radius={0.03} position={[0, 0.4, 0]} castShadow receiveShadow>
        <Soft color="#c48d62" />
      </RoundedBox>
      <RoundedBox args={[1.4, 0.3, 0.06]} radius={0.03} position={[0, 0.66, -0.2]} castShadow>
        <Soft color="#c48d62" />
      </RoundedBox>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.4, 0.36]} />
          <Soft color="#4b4f73" />
        </mesh>
      ))}
    </group>
  );
}

function StationHouse(props: GroupProps) {
  return (
    <group {...props}>
      <RoundedBox args={[1.7, 1.4, 1.3]} radius={0.06} position={[0, 0.7, 0]} castShadow receiveShadow>
        <Soft color="#f3e3cf" />
      </RoundedBox>
      <mesh position={[0, 1.72, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.32, 1, 1.05]} castShadow>
        <coneGeometry args={[1.0, 0.7, 4]} />
        <Soft color="#7f8fd1" />
      </mesh>
      <mesh position={[-0.35, 0.45, 0.66]}>
        <boxGeometry args={[0.4, 0.7, 0.03]} />
        <meshStandardMaterial color="#ffe9c2" emissive="#ffd28f" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.38, 0.85, 0.66]}>
        <boxGeometry args={[0.46, 0.34, 0.03]} />
        <meshStandardMaterial color="#ffe9c2" emissive="#ffd28f" emissiveIntensity={0.7} />
      </mesh>
      {/* 달 간판 */}
      <group position={[0, 1.55, 0.72]}>
        <RoundedBox args={[0.9, 0.3, 0.06]} radius={0.04}>
          <Soft color="#3b4270" />
        </RoundedBox>
        <mesh position={[-0.28, 0, 0.035]}>
          <circleGeometry args={[0.09, 20]} />
          <Glow color="#ffe08a" />
        </mesh>
        <mesh position={[-0.25, 0.02, 0.036]}>
          <circleGeometry args={[0.08, 20]} />
          <meshBasicMaterial color="#3b4270" />
        </mesh>
        {[-0.05, 0.08, 0.21, 0.32].map((x) => (
          <mesh key={x} position={[x, 0, 0.036]}>
            <circleGeometry args={[0.025, 8]} />
            <Glow color="#fff3c4" />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 0.8, 1.1]} color="#ffd59a" intensity={1.8} distance={3} decay={1.8} />
    </group>
  );
}

function VendingMachine(props: GroupProps) {
  const body = useRef<THREE.Group>(null);
  const shake = useRef(-10);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(() => {
    const d = performance.now() / 1000 - shake.current;
    if (body.current) body.current.rotation.z = d > 0.38 && d < 0.7 ? Math.sin((d - 0.38) * 60) * 0.02 * (1 - (d - 0.38) / 0.32) : 0;
  });
  return (
    <group {...props}>
      <group
        ref={body}
        onClick={(e) => {
          e.stopPropagation();
          shake.current = performance.now() / 1000;
          audioEngine.sfx('vending', 0.55);
          push(['🥤', '덜컹!', '☕'][Math.floor(Math.random() * 3)]);
        }}
        {...bind}
      >
        <RoundedBox args={[0.7, 1.4, 0.55]} radius={0.06} position={[0, 0.7, 0]} castShadow>
          <Soft color="#f2a9b8" />
        </RoundedBox>
        <mesh position={[-0.05, 0.9, 0.28]}>
          <planeGeometry args={[0.48, 0.7]} />
          <Glow color="#fff2c4" />
        </mesh>
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <mesh key={`${r}${c}`} position={[-0.2 + c * 0.15, 1.12 - r * 0.22, 0.285]}>
              <cylinderGeometry args={[0.035, 0.035, 0.12, 10]} />
              <Soft color={['#9ec9e6', '#ffd27a', '#a8d5ba'][(r + c) % 3]} />
            </mesh>
          )),
        )}
        <mesh position={[0.25, 0.85, 0.285]}>
          <boxGeometry args={[0.08, 0.3, 0.01]} />
          <Soft color="#fff" />
        </mesh>
      </group>
      {node(1.7)}
    </group>
  );
}

/** 플랫폼을 천천히 서성이는 승객 */
function PlatformWalker() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.16;
    const k = (Math.sin(t) + 1) / 2;
    if (ref.current) {
      ref.current.position.set(-0.6 + k * 3.4, PLATFORM_Y, 1.05);
      ref.current.rotation.y = Math.cos(t) >= 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  });
  return (
    <group ref={ref}>
      <Character look={{ ...LOOKS.momo, hat: '#9aa6dd' }} pose="walk" phase={2} emojis={['🎫', '🌙', '💛']} />
    </group>
  );
}

export function StationDiorama({ lite }: DioramaProps) {
  return (
    <group>
      {/* 땅 */}
      <RoundedBox args={[9.8, 0.6, 6.6]} radius={0.2} position={[0, -0.3, -0.3]} receiveShadow castShadow>
        <Soft color="#5d6589" />
      </RoundedBox>
      <RoundedBox args={[10, 0.4, 6.8]} radius={0.15} position={[0, -0.75, -0.3]}>
        <Soft color="#4f557f" />
      </RoundedBox>
      <Track length={lite ? 9.6 : 34} />
      {/* 플랫폼 */}
      <RoundedBox args={[8.8, PLATFORM_Y, 2.6]} radius={0.06} position={[0, PLATFORM_Y / 2, 0.25]} castShadow receiveShadow>
        <Soft color="#d8d2e6" />
      </RoundedBox>
      <mesh position={[0, PLATFORM_Y + 0.003, -0.83]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.7, 0.12]} />
        <meshBasicMaterial color="#ffd36e" />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-4.05 + i * 0.62, PLATFORM_Y + 0.004, -0.69]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.035, 8]} />
          <meshBasicMaterial color="#ffd36e" />
        </mesh>
      ))}

      <Train lite={lite} />
      <StationHouse position={[-3.35, PLATFORM_Y, 0.55]} />
      <StationClock position={[-1.4, PLATFORM_Y, -0.25]} />
      <Lamp position={[0.9, PLATFORM_Y, -0.45]} />
      <Lamp position={[3.6, PLATFORM_Y, -0.45]} light={!lite} />
      <Bench position={[0.2, PLATFORM_Y, 0.55]} />
      <Character look={LOOKS.haru} pose="sit" holding="mug" position={[-0.05, PLATFORM_Y + 0.44, 0.58]} phase={0} emojis={['☕', '🌙', '💛']} />
      <Bench position={[2.4, PLATFORM_Y, 0.55]} />
      <Character look={{ ...LOOKS.toto, top: '#c9b6f2' }} pose="sit" holding="book" position={[2.7, PLATFORM_Y + 0.44, 0.58]} phase={1.6} sway={0.5} />
      <VendingMachine position={[4.0, PLATFORM_Y, 0.9]} rotation={[0, -0.5, 0]} />
      {/* 화분 */}
      {[[-2.15, 1.2], [1.35, 1.25]].map(([x, z], i) => (
        <group key={i} position={[x, PLATFORM_Y, z]}>
          <RoundedBox args={[0.5, 0.3, 0.3]} radius={0.05} position={[0, 0.15, 0]} castShadow>
            <Soft color="#c48d62" />
          </RoundedBox>
          {[-0.12, 0, 0.12].map((dx) => (
            <mesh key={dx} position={[dx, 0.38, 0]} castShadow>
              <sphereGeometry args={[0.13, 12, 10]} />
              <Soft color="#6f9d78" />
            </mesh>
          ))}
        </group>
      ))}
      {!lite && <PlatformWalker />}
      {/* 전신주 */}
      {!lite &&
        [-8, -4, 4, 8].map((x) => (
          <group key={x} position={[x, 0, -3.1]}>
            <mesh position={[0, 1.4, 0]}>
              <cylinderGeometry args={[0.05, 0.07, 2.8, 8]} />
              <Soft color="#4b4f73" />
            </mesh>
            <mesh position={[0, 2.6, 0]}>
              <boxGeometry args={[0.7, 0.06, 0.06]} />
              <Soft color="#4b4f73" />
            </mesh>
          </group>
        ))}
    </group>
  );
}

/* ---------------- 멀리 잠든 마을 ---------------- */
function SleepingTown() {
  const windows = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i < 46; i++) {
      const x = -24 + Math.random() * 48;
      out.push([x, -1.2 + Math.random() * 2.6, -19 - Math.random() * 3]);
    }
    return out;
  }, []);
  return (
    <group>
      {[[-16, -24, 9], [-3, -26, 11], [11, -24, 10], [22, -22, 8]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, -4, z]} scale={[1.6, 0.6, 1]}>
          <sphereGeometry args={[r, 32, 16]} />
          <Soft color={i % 2 ? '#2c3466' : '#30396d'} />
        </mesh>
      ))}
      {windows.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.18, 0.14, 0.02]} />
          <Glow color={i % 4 ? '#ffd98a' : '#ffefc4'} opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

export function StationEnvironment() {
  return (
    <>
      <color attach="background" args={['#232a55']} />
      <fog attach="fog" args={['#232a55', 18, 44]} />
      <ambientLight intensity={0.45} color="#8f9cff" />
      <hemisphereLight args={['#8a95e0', '#1d2140', 0.65]} />
      <directionalLight
        position={[6, 10, -5]}
        intensity={0.75}
        color="#c9d2ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <Stars radius={60} depth={25} count={2000} factor={3} saturation={0} fade speed={0.4} />
      <mesh position={[9, 10, -20]}>
        <sphereGeometry args={[1.8, 32, 24]} />
        <Glow color="#fff4cf" />
      </mesh>
      <mesh position={[9, 10, -20.5]}>
        <sphereGeometry args={[3.0, 32, 24]} />
        <Glow color="#fff4cf" opacity={0.07} />
      </mesh>
      <SleepingTown />
      <Sparkles count={30} scale={[14, 5, 8]} position={[0, 2.5, 0]} size={2} speed={0.15} color="#fff3c4" opacity={0.6} />
    </>
  );
}
