import { RoundedBox, Sparkles } from '@react-three/drei';
import { useFrame, type GroupProps } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../audio/AudioEngine';
import { Character, LOOKS } from '../three/Character';
import { Cloud, Glow, Soft, useEmojiPops, usePointer } from '../three/common';
import { Bird } from '../three/creatures';
import type { DioramaProps } from './registry';

const WHITE = '#fffdfb';
const LAVENDER = '#e9e4fb';
const PASTELS = ['#ffc2d1', '#ffe08a', '#bfe3c9', '#b9d3ff', '#d9c8ff'];

/* ---------------- 폭신한 구름 섬 ---------------- */
function CloudBase({ radius = 4.2 }: { radius?: number }) {
  const puffs = useMemo(() => {
    const out: { p: [number, number, number]; r: number; c: string }[] = [];
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push({ p: [Math.cos(a) * radius * 0.9, -0.42, Math.sin(a) * radius * 0.9], r: 0.7 + ((i * 37) % 10) / 30, c: WHITE });
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      out.push({ p: [Math.cos(a) * radius * 0.6, -1.05, Math.sin(a) * radius * 0.6], r: 1.05 + (i % 3) * 0.15, c: i % 2 ? LAVENDER : '#f6e9f4' });
    }
    out.push({ p: [0, -1.5, 0], r: 1.6, c: LAVENDER });
    return out;
  }, [radius]);
  return (
    <group>
      <mesh position={[0, -0.55, 0]} scale={[radius, 0.55, radius]} receiveShadow>
        <sphereGeometry args={[1, 48, 24]} />
        <Soft color={WHITE} rough={1} emissive="#ffffff" emissiveIntensity={0.16} />
      </mesh>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.p} receiveShadow>
          <sphereGeometry args={[p.r, 24, 18]} />
          <Soft color={p.c} rough={1} emissive={p.c} emissiveIntensity={0.16} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- 구름 침대 + 낮잠 자는 친구 ---------------- */
function CloudBed({ blanket, pillow, look, phase, ...props }: GroupProps & { blanket: string; pillow: string; look: keyof typeof LOOKS; phase: number }) {
  return (
    <group {...props}>
      <RoundedBox args={[1.5, 0.4, 2.1]} radius={0.18} position={[0, 0.2, 0]} castShadow receiveShadow>
        <Soft color={WHITE} rough={1} />
      </RoundedBox>
      {[-1, 1].flatMap((s) =>
        [-0.7, 0, 0.7].map((z) => (
          <mesh key={`${s}${z}`} position={[s * 0.72, 0.22, z]} castShadow>
            <sphereGeometry args={[0.24, 16, 12]} />
            <Soft color={WHITE} rough={1} />
          </mesh>
        )),
      )}
      <RoundedBox args={[0.82, 0.2, 0.44]} radius={0.09} position={[0, 0.5, -0.72]} castShadow>
        <Soft color={pillow} />
      </RoundedBox>
      <Character look={LOOKS[look]} pose="lie" sleepy position={[0, 0.4, 0.1]} phase={phase} sway={0.2} emojis={['💤', '☁️', '♡']} />
      <RoundedBox args={[1.36, 0.16, 1.15]} radius={0.07} position={[0, 0.8, 0.28]} castShadow>
        <Soft color={blanket} rough={1} />
      </RoundedBox>
      {[[-0.35, 0.05], [0.3, 0.45], [-0.1, 0.65], [0.35, -0.05]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.885, z + 0.28]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 14]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- 정거장 표지판 + 벤치 ---------------- */
function BusStop(props: GroupProps) {
  return (
    <group {...props}>
      <mesh position={[-0.9, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 1.7, 10]} />
        <Soft color="#f4f1ff" />
      </mesh>
      <group position={[-0.9, 1.75, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.06, 28]} />
          <Soft color="#9db5f3" />
        </mesh>
        {[[-0.08, 0, 0.12], [0.08, 0.02, 0.11], [0, 0.08, 0.1]].map(([x, y, r], i) => (
          <mesh key={i} position={[x, y - 0.02, 0.04]}>
            <sphereGeometry args={[r, 12, 10]} />
            <Soft color="#ffffff" />
          </mesh>
        ))}
      </group>
      {/* 구름 벤치 */}
      <RoundedBox args={[1.2, 0.36, 0.5]} radius={0.15} position={[0.2, 0.18, 0]} castShadow receiveShadow>
        <Soft color={WHITE} rough={1} />
      </RoundedBox>
      <RoundedBox args={[1.2, 0.5, 0.18]} radius={0.08} position={[0.2, 0.55, -0.2]} castShadow>
        <Soft color="#f6f0ff" rough={1} />
      </RoundedBox>
      <Character look={LOOKS.lulu} pose="sit" position={[0.05, 0.38, 0.02]} phase={2.2} emojis={['🎈', '☁️', '🎵']} />
      <RoundedBox args={[0.34, 0.28, 0.16]} radius={0.05} position={[0.62, 0.5, 0.05]} castShadow>
        <Soft color="#ffb8a8" />
      </RoundedBox>
    </group>
  );
}

/* ---------------- 윈드차임 ---------------- */
function WindChime(props: GroupProps) {
  const swing = useRef<THREE.Group>(null);
  const boost = useRef(-10);
  const tubes = useRef<(THREE.Group | null)[]>([]);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const b = Math.max(0, 1 - (performance.now() / 1000 - boost.current) / 2.5);
    if (swing.current) swing.current.rotation.z = Math.sin(t * 1.3) * (0.08 + b * 0.25);
    tubes.current.forEach((g, i) => g && (g.rotation.z = Math.sin(t * (2.2 + i * 0.3) + i) * (0.1 + b * 0.4)));
  });
  return (
    <group {...props}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 2.0, 10]} />
        <Soft color="#f4f1ff" />
      </mesh>
      <mesh position={[0.3, 1.98, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.62, 8]} />
        <Soft color="#f4f1ff" />
      </mesh>
      <group
        ref={swing}
        position={[0.58, 1.95, 0]}
        onClick={(e) => {
          e.stopPropagation();
          boost.current = performance.now() / 1000;
          audioEngine.sfx('chime', 0.4);
          push('🎐');
        }}
        {...bind}
      >
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.3, 4]} />
          <Soft color="#ffffff" />
        </mesh>
        <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.17, 0.018, 8, 24]} />
          <Soft color="#d9c8ff" />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          const len = 0.3 + (i % 3) * 0.1;
          return (
            <group key={i} ref={(el) => (tubes.current[i] = el)} position={[Math.cos(a) * 0.15, -0.31, Math.sin(a) * 0.15]}>
              <mesh position={[0, -0.08 - len / 2, 0]} castShadow>
                <cylinderGeometry args={[0.024, 0.024, len, 10]} />
                <Soft color={PASTELS[i]} rough={0.3} metalness={0.25} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0, -0.6, 0]}>
          <sphereGeometry args={[0.05, 12, 10]} />
          <Soft color="#fff3c4" />
        </mesh>
        <mesh position={[0, -0.82, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.12, 0.12, 0.01]} />
          <Soft color="#ffc2d1" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {node(2.4)}
    </group>
  );
}

/* ---------------- 바람에 펄럭이는 가랜드와 빨래 ---------------- */
function Bunting({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const flags = useRef<(THREE.Group | null)[]>([]);
  const pts = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    return Array.from({ length: 9 }, (_, i) => {
      const u = (i + 0.5) / 9;
      const p = a.clone().lerp(b, u);
      p.y -= Math.sin(Math.PI * u) * 0.35;
      return p;
    });
  }, [from, to]);
  const angle = Math.atan2(-(to[2] - from[2]), to[0] - from[0]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flags.current.forEach((g, i) => g && (g.rotation.x = Math.sin(t * 3.2 + i * 0.7) * 0.35 + 0.15));
  });
  return (
    <group>
      {[from, to].map((p, i) => (
        <mesh key={i} position={[p[0], p[1] / 2, p[2]]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, p[1], 8]} />
          <Soft color="#f4f1ff" />
        </mesh>
      ))}
      {pts.map((p, i) => (
        <group key={i} position={p} rotation={[0, angle, 0]}>
          <group ref={(el) => (flags.current[i] = el)}>
            {i === 4 ? (
              <mesh position={[0, -0.32, 0]} castShadow>
                <boxGeometry args={[0.55, 0.62, 0.02]} />
                <Soft color="#bfe3ff" side={THREE.DoubleSide} />
              </mesh>
            ) : (
              <mesh position={[0, -0.13, 0]} rotation={[0, 0, Math.PI]}>
                <circleGeometry args={[0.16, 3, Math.PI / 2]} />
                <Soft color={PASTELS[i % PASTELS.length]} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        </group>
      ))}
    </group>
  );
}

/* ---------------- 무지개 ---------------- */
function Rainbow(props: GroupProps) {
  const colors = ['#ffb3ba', '#ffd8a8', '#fff2a8', '#bfeac6', '#b9d7ff', '#d6c4ff'];
  return (
    <group {...props}>
      {colors.map((c, i) => (
        <mesh key={c}>
          <torusGeometry args={[1.9 - i * 0.12, 0.065, 10, 48, Math.PI]} />
          <Soft color={c} emissive={c} emissiveIntensity={0.25} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.6, -0.1, 0]}>
          <Cloud scale={0.45} drift={0.05} />
        </group>
      ))}
    </group>
  );
}

/* ---------------- 둥둥 떠다니는 친구들 ---------------- */
function Floater({ children, radius, height, speed, phase }: { children: ReactNode; radius: number; height: number; speed: number; phase: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = t * speed + phase;
    if (ref.current) {
      ref.current.position.set(Math.cos(a) * radius, height + Math.sin(t * 0.8 + phase) * 0.25, Math.sin(a) * radius);
      ref.current.rotation.y = -a + (speed > 0 ? 0 : Math.PI);
      ref.current.rotation.z = Math.sin(t * 0.7 + phase) * 0.05;
    }
  });
  return <group ref={ref}>{children}</group>;
}

function MiniCloud() {
  return (
    <group>
      {[[0, 0, 0, 0.42], [0.36, -0.05, 0.05, 0.3], [-0.36, -0.06, 0, 0.32], [0, -0.1, 0.32, 0.28], [0, -0.08, -0.32, 0.3]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.7, 1]} castShadow>
          <sphereGeometry args={[r, 18, 14]} />
          <Soft color={WHITE} rough={1} emissive="#ffffff" emissiveIntensity={0.08} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- 하늘을 도는 구름 버스 ---------------- */
function CloudBus() {
  const ref = useRef<THREE.Group>(null);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.position.set(((t * 0.9) % 34) - 17, 2.6 + Math.sin(t * 0.8) * 0.25, -7.5);
      ref.current.rotation.z = Math.sin(t * 0.6) * 0.04;
    }
  });
  return (
    <group ref={ref}>
      <group rotation={[0, -Math.PI / 2, 0]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.sfx('whistle', 0.3);
          push('🚌');
        }}
        {...bind}
      >
        <group rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[1.7, 0.75, 0.85]} radius={0.28} position={[0, 0.45, 0]} castShadow>
            <Soft color="#ffe08a" />
          </RoundedBox>
          {[-0.5, 0, 0.5].map((x) =>
            [1, -1].map((s) => (
              <mesh key={`${x}${s}`} position={[x, 0.58, s * 0.43]}>
                <boxGeometry args={[0.32, 0.24, 0.01]} />
                <Glow color="#eaf6ff" />
              </mesh>
            )),
          )}
          {[-0.55, 0.55].map((x) =>
            [1, -1].map((s) => (
              <mesh key={`w${x}${s}`} position={[x, 0.08, s * 0.32]}>
                <sphereGeometry args={[0.2, 14, 10]} />
                <Soft color={WHITE} rough={1} />
              </mesh>
            )),
          )}
        </group>
      </group>
      </group>
      {node(1.2)}
    </group>
  );
}

export function CloudDiorama({ lite }: DioramaProps) {
  return (
    <group>
      <CloudBase />
      <Rainbow position={[0.4, 0, -3.1]} />
      <CloudBed position={[-1.15, 0, 0.35]} rotation={[0, 0.35, 0]} blanket="#ffc8d6" pillow="#fff2b8" look="haru" phase={0} />
      <CloudBed position={[1.25, 0, 0.0]} rotation={[0, -0.3, 0]} blanket="#c8dcff" pillow="#ffd8e4" look="momo" phase={1.7} />
      <BusStop position={[-1.4, 0, -1.9]} rotation={[0, 0.25, 0]} />
      <WindChime position={[2.7, 0, -1.3]} />
      <Bunting from={[-3.4, 1.7, 0.6]} to={[-2.4, 1.9, 2.6]} />

      {/* 풍선 들고 둥실 떠오른 친구 */}
      <Floater radius={0.4} height={0.9} speed={0.15} phase={2}>
        <group position={[0, 0, 2.2]}>
          <Character look={LOOKS.nana} holding="balloon" balloonColor="#ffb3c8" phase={0.6} emojis={['🎈', '✨', '☁️']} />
        </group>
      </Floater>
      {/* 작은 구름을 타고 섬 주위를 도는 친구 */}
      <Floater radius={5.4} height={0.9} speed={-0.09} phase={0.5}>
        <MiniCloud />
        <Character look={LOOKS.toto} pose="sit" holding="wave" position={[0, 0.22, 0]} scale={0.85} phase={3} />
      </Floater>

      <Bird orbit={{ radius: 3.6, height: 2.6, speed: 0.45 }} color="#ffd27a" />
      {!lite && <Bird orbit={{ radius: 4.6, height: 3.2, speed: -0.35 }} color="#b9d3ff" phase={2} />}
      {!lite && <Bird orbit={{ radius: 3.0, height: 3.6, speed: 0.4 }} color="#ffc2d1" phase={4} size={0.8} />}
      {!lite && <CloudBus />}
    </group>
  );
}

/* ---------------- 멀리 떠 있는 종 구름 ---------------- */
function BellCloud(props: GroupProps) {
  const bell = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (bell.current) bell.current.rotation.z = Math.sin(clock.elapsedTime * 1.1) * 0.25;
  });
  return (
    <group {...props}>
      <Cloud scale={1.6} drift={0.15} />
      <group position={[0, 0.7, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.55, 0.7, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 1.4, 10]} />
            <Soft color="#f6efe0" />
          </mesh>
        ))}
        <mesh position={[0, 1.45, 0]}>
          <torusGeometry args={[0.55, 0.08, 10, 24, Math.PI]} />
          <Soft color="#f6efe0" />
        </mesh>
        <group ref={bell} position={[0, 1.4, 0]}>
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.12, 0.28, 0.4, 20]} />
            <Soft color="#f2cf7a" rough={0.3} metalness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function CloudEnvironment() {
  return (
    <>
      <color attach="background" args={['#d3e2fa']} />
      <fog attach="fog" args={['#dbe6fb', 16, 44]} />
      <ambientLight intensity={0.75} color="#fff4f8" />
      <hemisphereLight args={['#ffffff', '#c9c2ef', 0.9]} />
      <directionalLight
        position={[5, 9, 4]}
        intensity={1.6}
        color="#fff1e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      {/* 해 */}
      <mesh position={[10, 10, -20]}>
        <sphereGeometry args={[1.4, 24, 18]} />
        <Glow color="#fff6dc" />
      </mesh>
      <mesh position={[10, 10, -20.5]}>
        <sphereGeometry args={[2.6, 24, 18]} />
        <Glow color="#fff6dc" opacity={0.18} />
      </mesh>
      <BellCloud position={[-10, 3.2, -14]} />
      {[
        [-7, -2.5, 2, 2.2], [7.5, -2.2, 1, 2.4], [0, -4, -6, 3], [-12, 1, -8, 2], [12, 2, -9, 2.2],
        [4, 5, -14, 1.8], [-5, -3, 6, 1.6], [9, -1, 5, 1.4],
      ].map(([x, y, z, s], i) => (
        <Cloud key={i} position={[x, y, z]} scale={s} speed={0.2 + (i % 3) * 0.1} />
      ))}
      <Sparkles count={50} scale={[16, 6, 12]} position={[0, 2, 0]} size={3} speed={0.2} color="#ffffff" opacity={0.8} />
    </>
  );
}
