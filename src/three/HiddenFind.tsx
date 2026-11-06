import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../audio/AudioEngine';
import { WORLDS } from '../data/worlds';
import { toast } from '../store/toast';
import { useUser, userActions, userStore } from '../store/userStore';
import type { SfxKind } from '../types';
import { Glow, Soft, useEmojiPops, usePointer } from './common';

export type HiddenKind = 'hedgehog' | 'chest' | 'mouse' | 'star' | 'snail' | 'umbrella';

/** 숨은 친구마다 어울리는 소리와 말풍선 */
const VOICE: Record<HiddenKind, { sfx: SfxKind; say: string }> = {
  hedgehog: { sfx: 'sniff', say: '킁킁, 뀨!' },
  chest: { sfx: 'treasure', say: '짜잔!' },
  mouse: { sfx: 'squeak', say: '찍!' },
  star: { sfx: 'coin', say: '띠링!' },
  snail: { sfx: 'slime', say: '뾰옹~' },
  umbrella: { sfx: 'umbrella', say: '팡!' },
};

/** 월드마다 하나씩 숨어 있는 작은 친구. 찾으면 스탬프에 별이 생겨요 */
export function HiddenFind({ worldId, kind, position, rotation = 0 }: { worldId: string; kind: HiddenKind; position: [number, number, number]; rotation?: number }) {
  const found = useUser((u) => !!u.found[worldId]);
  const ref = useRef<THREE.Group>(null);
  const hop = useRef(-10);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const h = performance.now() / 1000 - hop.current;
    g.position.y = (h < 0.6 ? Math.sin((h / 0.6) * Math.PI) * 0.25 : 0) + Math.max(0, Math.sin(t * 1.3)) * 0.015;
    g.rotation.z = Math.sin(t * 2.1) * 0.04;
  });
  const onTap = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    hop.current = performance.now() / 1000;
    const isNew = userActions.markFound(worldId);
    const voice = VOICE[kind];
    audioEngine.sfx(voice.sfx, 0.5);
    push(voice.say);
    if (isNew) {
      const n = WORLDS.filter((w) => userStore.get().found[w.id]).length;
      setTimeout(() => audioEngine.sfx('sparkle', 0.25), 450);
      toast(`숨은 친구를 찾았어요! (${n}/${WORLDS.length})`, '⭐', 3500);
    }
  };
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group ref={ref} onClick={onTap} {...bind}>
        <Model kind={kind} />
        {found && (
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <Glow color="#ffe08a" />
          </mesh>
        )}
        {/* 누르기 쉽게 넉넉한 투명 영역 */}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.35, 8, 6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {node(0.8)}
    </group>
  );
}

function Eyes({ y, z, gap = 0.045, r = 0.014 }: { y: number; z: number; gap?: number; r?: number }) {
  return (
    <>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * gap, y, z]}>
          <sphereGeometry args={[r, 8, 6]} />
          <meshBasicMaterial color="#2f2a33" />
        </mesh>
      ))}
    </>
  );
}

function Model({ kind }: { kind: HiddenKind }) {
  switch (kind) {
    case 'hedgehog':
      return (
        <group>
          <mesh position={[0, 0.11, -0.02]} scale={[1, 0.8, 1.15]} castShadow>
            <sphereGeometry args={[0.14, 14, 10]} />
            <Soft color="#8a6a52" />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.1, 0.17 + (i % 2) * 0.02, -0.04 + Math.sin(a) * 0.1]} rotation={[Math.sin(a) * 0.9 - 0.3, 0, -Math.cos(a) * 0.9]}>
                <coneGeometry args={[0.03, 0.09, 6]} />
                <Soft color="#6e523f" />
              </mesh>
            );
          })}
          <mesh position={[0, 0.09, 0.12]}>
            <sphereGeometry args={[0.07, 12, 10]} />
            <Soft color="#f3dcc0" />
          </mesh>
          <mesh position={[0, 0.08, 0.19]}>
            <sphereGeometry args={[0.016, 8, 6]} />
            <meshBasicMaterial color="#3a2a24" />
          </mesh>
          <Eyes y={0.12} z={0.17} gap={0.03} r={0.011} />
        </group>
      );
    case 'chest':
      return (
        <group>
          <mesh position={[0, 0.09, 0]} castShadow>
            <boxGeometry args={[0.32, 0.18, 0.22]} />
            <Soft color="#b07a52" />
          </mesh>
          <mesh position={[0, 0.2, -0.08]} rotation={[-0.6, 0, 0]}>
            <boxGeometry args={[0.33, 0.04, 0.23]} />
            <Soft color="#9a6844" />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <boxGeometry args={[0.28, 0.02, 0.18]} />
            <Glow color="#ffe08a" />
          </mesh>
          {[-0.1, 0.1].map((x) => (
            <mesh key={x} position={[x, 0.09, 0.112]}>
              <boxGeometry args={[0.03, 0.18, 0.005]} />
              <Soft color="#f2c26b" rough={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'mouse':
      return (
        <group>
          <mesh position={[0, 0.07, 0]} scale={[0.8, 0.7, 1.2]} castShadow>
            <sphereGeometry args={[0.09, 12, 10]} />
            <Soft color="#c9c3d1" />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.055, 0.15, 0.04]} rotation={[0, 0, s * -0.3]}>
              <sphereGeometry args={[0.04, 10, 8]} />
              <Soft color="#f2c6cf" />
            </mesh>
          ))}
          <mesh position={[0, 0.07, 0.11]}>
            <sphereGeometry args={[0.013, 8, 6]} />
            <Soft color="#f29aa8" />
          </mesh>
          <Eyes y={0.1} z={0.09} gap={0.03} r={0.01} />
          <mesh position={[0, 0.05, -0.14]} rotation={[Math.PI / 2 + 0.6, 0, 0]}>
            <torusGeometry args={[0.06, 0.008, 4, 10, Math.PI]} />
            <Soft color="#f2c6cf" />
          </mesh>
        </group>
      );
    case 'star':
      return (
        <group position={[0, 0.16, 0]}>
          {Array.from({ length: 5 }, (_, i) => (
            <group key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
              <mesh position={[0, 0.07, 0]} scale={[1, 1, 0.5]}>
                <coneGeometry args={[0.045, 0.12, 8]} />
                <Soft color="#ffe08a" emissive="#ffd25a" emissiveIntensity={0.4} />
              </mesh>
            </group>
          ))}
          <mesh scale={[1, 1, 0.6]}>
            <sphereGeometry args={[0.06, 12, 10]} />
            <Soft color="#ffe08a" emissive="#ffd25a" emissiveIntensity={0.4} />
          </mesh>
          <Eyes y={0.01} z={0.04} gap={0.022} r={0.009} />
        </group>
      );
    case 'snail':
      return (
        <group>
          <mesh position={[0, 0.03, 0.02]} scale={[0.6, 0.35, 1.6]} castShadow>
            <sphereGeometry args={[0.08, 12, 10]} />
            <Soft color="#e9d8b8" />
          </mesh>
          <mesh position={[0, 0.11, -0.03]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.06, 0.035, 10, 20]} />
            <Soft color="#e9a7a0" />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.02, 0.1, 0.13]} rotation={[0.4, 0, s * -0.2]}>
              <cylinderGeometry args={[0.006, 0.006, 0.08, 5]} />
              <Soft color="#e9d8b8" />
            </mesh>
          ))}
        </group>
      );
    case 'umbrella':
      return (
        <group rotation={[0, 0, 0.35]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
            <Soft color="#7f8fd1" />
          </mesh>
          <mesh position={[0, 0.48, 0]} scale={[1, 1.4, 1]} castShadow>
            <coneGeometry args={[0.09, 0.32, 8]} />
            <Soft color="#ffd36e" />
          </mesh>
          <mesh position={[0.025, 0.02, 0]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.025, 0.008, 4, 10, Math.PI]} />
            <Soft color="#7f8fd1" />
          </mesh>
        </group>
      );
  }
}
