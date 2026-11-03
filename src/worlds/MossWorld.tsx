import { Sparkles } from '@react-three/drei';
import { useFrame, type GroupProps } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../audio/AudioEngine';
import { Character, LOOKS } from '../three/Character';
import { Glow, Island, Soft, useEmojiPops, usePointer } from '../three/common';
import { Bird, Fairy, Rabbit } from '../three/creatures';
import { FloatingLights, Flower, Mushroom, RoundTree } from '../three/props';
import type { DioramaProps } from './registry';

const MOSS = ['#7fb06c', '#8cbc78', '#6fa262', '#9cc785'];

/* ---------------- 대나무 풍경 ---------------- */
function BambooChime(props: GroupProps) {
  const swing = useRef<THREE.Group>(null);
  const boost = useRef(-10);
  const tubes = useRef<(THREE.Group | null)[]>([]);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const b = Math.max(0, 1 - (performance.now() / 1000 - boost.current) / 2.5);
    if (swing.current) swing.current.rotation.z = Math.sin(t * 1.1) * (0.06 + b * 0.2);
    tubes.current.forEach((g, i) => g && (g.rotation.x = Math.sin(t * (1.8 + i * 0.35) + i) * (0.08 + b * 0.35)));
  });
  return (
    <group {...props}>
      <group
        ref={swing}
        onClick={(e) => {
          e.stopPropagation();
          boost.current = performance.now() / 1000;
          audioEngine.sfx('pop', 0.4);
          push('🎋');
        }}
        {...bind}
      >
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.4, 4]} />
          <Soft color="#e8dcc0" />
        </mesh>
        <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.55, 8]} />
          <Soft color="#a98b5f" />
        </mesh>
        {[-0.2, -0.07, 0.07, 0.2].map((x, i) => {
          const len = 0.32 + (i % 2) * 0.14 + i * 0.03;
          return (
            <group key={i} ref={(el) => (tubes.current[i] = el)} position={[x, -0.42, 0]}>
              <mesh position={[0, -0.05 - len / 2, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, len, 10]} />
                <Soft color={i % 2 ? '#c9c27a' : '#b7b36a'} />
              </mesh>
              <mesh position={[0, -0.05 - len * 0.3, 0]}>
                <torusGeometry args={[0.037, 0.006, 4, 12]} />
                <Soft color="#8f8a4f" />
              </mesh>
            </group>
          );
        })}
      </group>
      {node(-1.1)}
    </group>
  );
}

/* ---------------- 커다란 나무 (문과 창문이 있는 나무집) ---------------- */
function BigTree({ lite, ...props }: GroupProps & { lite?: boolean }) {
  const canopy = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (canopy.current) canopy.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.015;
  });
  return (
    <group {...props}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.78, 3.0, 20]} />
        <Soft color="#8a6447" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        return (
          <group key={i} position={[Math.cos(a) * 0.6, 0.12, Math.sin(a) * 0.6]} rotation={[0, -a, 0]}>
            <mesh rotation={[0, 0, -1.1]} position={[0.2, 0, 0]} castShadow>
              <capsuleGeometry args={[0.16, 0.45, 6, 10]} />
              <Soft color="#7d5a40" />
            </mesh>
          </group>
        );
      })}
      {/* 이끼 */}
      {[[0.55, 0.6, 0.35, 0.22], [-0.5, 1.3, 0.4, 0.2], [0.2, 2.2, 0.48, 0.18], [-0.66, 0.35, -0.2, 0.2]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[r, 12, 10]} />
          <Soft color={MOSS[i % MOSS.length]} />
        </mesh>
      ))}
      {/* 문 & 창 */}
      <mesh position={[0.08, 0.36, 0.72]} rotation={[-0.08, 0.1, 0]} scale={[1, 1.4, 1]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 20, 1, false, -Math.PI / 2, Math.PI]} />
        <Soft color="#c98d5c" />
      </mesh>
      <mesh position={[0.08, 0.2, 0.72]} rotation={[-0.08, 0.1, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.06]} />
        <Soft color="#c98d5c" />
      </mesh>
      <mesh position={[0.22, 0.28, 0.77]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <Soft color="#ffd27a" />
      </mesh>
      <group position={[-0.25, 1.55, 0.58]} rotation={[0, -0.4, 0]}>
        <mesh>
          <circleGeometry args={[0.13, 20]} />
          <Glow color="#ffe6a3" />
        </mesh>
        <mesh>
          <torusGeometry args={[0.14, 0.025, 6, 20]} />
          <Soft color="#a77a55" />
        </mesh>
      </group>
      {/* 가지 + 대나무 풍경 */}
      <mesh position={[0.95, 2.75, 0.15]} rotation={[0, 0, -1.15]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 1.3, 10]} />
        <Soft color="#8a6447" />
      </mesh>
      <BambooChime position={[1.5, 3.0, 0.3]} />
      {/* 딱따구리 */}
      <Bird position={[0.62, 1.85, 0.15]} rotation={[0, -Math.PI / 2, 0]} color="#8a7f9e" belly="#f3ead8" cap="#e86a5a" size={1.1} />
      <group ref={canopy}>
        {(
          [
            [0, 3.6, 0, 1.45, '#6fa865'],
            [1.1, 3.35, 0.4, 0.95, '#80b874'],
            [-1.05, 3.3, 0.2, 1.05, '#78b06e'],
            [0.2, 4.45, -0.2, 1.0, '#88c07a'],
            [-0.4, 3.4, -1.0, 1.0, '#6a9f61'],
          ] as [number, number, number, number, string][]
        )
          .slice(0, lite ? 4 : 5)
          .map(([x, y, z, r, c], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <sphereGeometry args={[r, 28, 20]} />
              <Soft color={c} />
            </mesh>
          ))}
      </group>
    </group>
  );
}

/* ---------------- 버섯 집 ---------------- */
function MushroomHouse({ cap = '#e98a7f', size = 1, ...props }: GroupProps & { cap?: string; size?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const th = 0.35 + (i % 3) * 0.32;
        const ph = (i / 7) * Math.PI * 2 + i;
        return [Math.sin(th) * Math.cos(ph) * 0.95, Math.cos(th) * 0.95 * 0.75, Math.sin(th) * Math.sin(ph) * 0.95, 0.08 + (i % 3) * 0.025] as const;
      }),
    [],
  );
  return (
    <group {...props} scale={size}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.95, 24]} />
        <Soft color="#fbf0de" />
      </mesh>
      <mesh position={[0, 0.24, 0.47]}>
        <boxGeometry args={[0.28, 0.46, 0.05]} />
        <Soft color="#b07a52" />
      </mesh>
      <mesh position={[0, 0.47, 0.47]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.05, 16, 1, false, 0, Math.PI]} />
        <Soft color="#b07a52" />
      </mesh>
      <mesh position={[0.25, 0.62, 0.38]} rotation={[0, 0.55, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <Glow color="#ffe6a3" />
      </mesh>
      <mesh position={[0.11, 0.06, 0.6]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <Glow color="#ffe6a3" />
      </mesh>
      <group position={[0, 0.92, 0]}>
        <mesh scale={[1, 0.75, 1]} castShadow>
          <sphereGeometry args={[0.95, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Soft color={cap} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.94, 32]} />
          <Soft color="#f7e6cf" side={THREE.DoubleSide} />
        </mesh>
        {dots.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1, 0.6, 1]}>
            <sphereGeometry args={[r, 10, 8]} />
            <Soft color="#fffaf0" />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 0.5, 0.9]} color="#ffd59a" intensity={1.6} distance={2.6} decay={1.8} />
    </group>
  );
}

function Stump({ r = 0.36, h = 0.42, ...props }: GroupProps & { r?: number; h?: number }) {
  return (
    <group {...props}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 1.12, h, 18]} />
        <Soft color="#a87a55" />
      </mesh>
      <mesh position={[0, h + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.95, 24]} />
        <Soft color="#e8c99a" />
      </mesh>
      <mesh position={[0, h + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.45, r * 0.52, 24]} />
        <Soft color="#c9a072" />
      </mesh>
      <mesh position={[r * 0.7, h * 0.3, r * 0.6]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <Soft color={MOSS[1]} />
      </mesh>
    </group>
  );
}

function Fern(props: GroupProps) {
  return (
    <group {...props}>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0, 0.16, 0.2]} rotation={[0.8, 0, 0]} scale={[0.07, 0.025, 0.28]} castShadow>
              <sphereGeometry args={[1, 10, 8]} />
              <Soft color={i % 2 ? '#5f9d5c' : '#6fae68'} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Pond(props: GroupProps) {
  return (
    <group {...props}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.3, 1, 1]}>
        <circleGeometry args={[0.6, 32]} />
        <Soft color="#94d2d6" rough={0.15} emissive="#bff0ee" emissiveIntensity={0.15} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.82, 0.04, Math.sin(a) * 0.64]} scale={[1, 0.5, 1]} castShadow>
            <sphereGeometry args={[0.1 + (i % 3) * 0.02, 10, 8]} />
            <Soft color="#b9b8a8" />
          </mesh>
        );
      })}
      {[[-0.25, 0.1], [0.3, -0.15], [0.05, 0.25]].map(([x, z], i) => (
        <group key={i} position={[x, 0.02, z]}>
          <mesh rotation={[-Math.PI / 2, 0, i]}>
            <circleGeometry args={[0.12, 16, 0.4, Math.PI * 1.8]} />
            <Soft color="#7fb86b" side={THREE.DoubleSide} />
          </mesh>
          {i === 1 && (
            <mesh position={[0, 0.04, 0]}>
              <sphereGeometry args={[0.04, 10, 8]} />
              <Soft color="#ffc2d1" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** 오솔길을 천천히 산책하는 친구 */
function Wanderer() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * 0.12 + 1;
    if (ref.current) {
      ref.current.position.set(Math.cos(a) * 3.0, 0, Math.sin(a) * 2.6 + 0.4);
      ref.current.rotation.y = Math.atan2(-Math.sin(a) * 3.0, Math.cos(a) * 2.6);
    }
  });
  return (
    <group ref={ref}>
      <Character look={{ ...LOOKS.nana, hat: '#e9a7a0' }} pose="walk" phase={1} emojis={['🍀', '🎵', '🌿']} />
    </group>
  );
}

export function MossDiorama({ lite }: DioramaProps) {
  return (
    <group>
      <Island radius={4.3} top="#86b673" strata={['#8b6a4c', '#6f5139']} seed={7} />
      {/* 이끼 언덕 */}
      {[
        [-3.2, 0.6, 0.5], [3.3, -0.4, 0.45], [-2.6, 2.3, 0.4], [2.9, 1.9, 0.38], [0.6, -3.2, 0.42], [-0.6, 3.3, 0.35],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x, -0.05, z]} scale={[1.3, 0.55, 1.1]} castShadow receiveShadow>
          <sphereGeometry args={[r, 18, 12]} />
          <Soft color={MOSS[i % MOSS.length]} />
        </mesh>
      ))}
      <BigTree position={[-1.7, 0, -1.5]} lite={lite} />
      <MushroomHouse position={[1.9, 0, -1.5]} rotation={[0, -0.35, 0]} />
      <MushroomHouse position={[3.0, 0, 0.75]} rotation={[0, -1.0, 0]} cap="#c3a6e8" size={0.72} />
      <Pond position={[1.2, 0, 1.7]} />
      {/* 디딤돌 */}
      {[[0.1, 3.0], [0.55, 2.35], [1.4, 0.65], [1.75, -0.2], [1.95, -0.85]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.01, z]} scale={[1, 0.25, 0.8]} receiveShadow>
          <sphereGeometry args={[0.24, 16, 10]} />
          <Soft color="#c4c2b0" />
        </mesh>
      ))}

      {/* 그루터기에 앉은 친구들 */}
      <Stump position={[-0.85, 0, 1.25]} />
      <Character look={LOOKS.haru} pose="sit" position={[-0.85, 0.42, 1.25]} rotation={[0, 0.35, 0]} phase={0} sway={0.6} emojis={['🍃', '💚', '🎵']} />
      <Stump position={[0.25, 0, 0.35]} r={0.32} h={0.36} />
      <Character look={LOOKS.lulu} pose="sit" holding="mug" position={[0.25, 0.36, 0.35]} rotation={[0, -0.25, 0]} phase={1.4} />
      {!lite && <Wanderer />}

      <Fern position={[-2.9, 0, -0.2]} />
      <Fern position={[0.1, 0, -2.9]} scale={1.2} />
      {!lite && <Fern position={[-2.2, 0, 2.6]} scale={0.9} />}
      <Mushroom position={[-0.6, 0, -0.4]} cap="#ffb38a" />
      <Mushroom position={[-0.45, 0, -0.25]} size={0.7} cap="#ffd27a" />
      <Mushroom position={[2.6, 0, 2.3]} size={0.9} cap="#c3a6e8" />
      {[[-2.0, 1.8], [-3.0, 1.2], [2.3, -2.6], [-1.3, 2.8], [3.5, -0.9]].map(([x, z], i) => (
        <Flower key={i} position={[x, 0, z]} petal={['#ffd1dc', '#fff2b3', '#d9ccff', '#c9f0e0'][i % 4]} />
      ))}
      {!lite && <RoundTree position={[3.3, 0, -2.2]} size={0.8} color="#7fb874" />}

      <Rabbit radius={2.3} speed={0.35} />
      {!lite && <Rabbit radius={3.3} speed={-0.25} phase={2} color="#f3dcc6" />}
      <Bird position={[-0.2, 0, 2.3]} rotation={[0, 0.8, 0]} color="#c9a6ff" />
      {!lite && <Bird position={[2.3, 0, 1.0]} rotation={[0, -1.6, 0]} color="#ffd27a" phase={1.2} />}
      <Fairy radius={1.6} height={1.5} speed={0.5} />
      <Fairy radius={2.6} height={2.2} speed={-0.35} phase={2} color="#d6f5ff" />
      {!lite && <Fairy radius={1.2} height={2.6} speed={0.42} phase={4} color="#ffd6ef" />}
      <FloatingLights count={lite ? 8 : 26} color="#f6ffc4" radius={4} height={[0.3, 3.2]} size={0.03} />
    </group>
  );
}

function SunRays() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    ref.current?.children.forEach((c, i) => {
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.035 + Math.max(0, Math.sin(clock.elapsedTime * 0.3 + i * 1.5)) * 0.05;
    });
  });
  return (
    <group ref={ref}>
      {[[-0.5, 1, 0.35], [1.8, -0.6, 0.3], [-2.2, 1.6, 0.4]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 5, z]} rotation={[0.1, 0, r]}>
          <cylinderGeometry args={[0.3, 1.0, 10, 16, 1, true]} />
          <meshBasicMaterial color="#fffbe0" transparent opacity={0.06} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

export function MossEnvironment() {
  return (
    <>
      <color attach="background" args={['#c5dcc0']} />
      <fog attach="fog" args={['#c5dcc0', 14, 34]} />
      <ambientLight intensity={0.6} color="#f6fff0" />
      <hemisphereLight args={['#f4ffe8', '#53704a', 0.85]} />
      <directionalLight
        position={[4, 10, 3]}
        intensity={1.6}
        color="#fff3d0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <SunRays />
      {Array.from({ length: 14 }, (_, i) => {
        const a = Math.PI + (i / 13) * Math.PI;
        const r = 15 + (i % 3) * 3;
        return <RoundTree key={i} position={[Math.cos(a) * r, -2.4, Math.sin(a) * r]} size={3 + (i % 4) * 0.6} color={i % 2 ? '#a3c39b' : '#97b98f'} trunk="#a49380" />;
      })}
      <Sparkles count={70} scale={[16, 6, 12]} position={[0, 2.5, 0]} size={2.5} speed={0.2} color="#f8ffcf" opacity={0.8} />
    </>
  );
}
