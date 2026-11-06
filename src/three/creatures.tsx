import { useFrame, type GroupProps } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../audio/AudioEngine';
import { Glow, Soft, useEmojiPops, usePointer } from './common';

/** 동글동글 작은 새. orbit 을 주면 원을 그리며 날고, 없으면 제자리에서 콕콕 쪼아요 */
export function Bird({
  color = '#ffd27a',
  belly = '#fff6e0',
  cap,
  orbit,
  size = 1,
  phase = 0,
  ...props
}: GroupProps & {
  color?: string;
  belly?: string;
  cap?: string;
  orbit?: { radius: number; height: number; speed: number };
  size?: number;
  phase?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const wings = useRef<(THREE.Group | null)[]>([]);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    if (orbit && ref.current) {
      const a = t * orbit.speed;
      ref.current.position.set(Math.cos(a) * orbit.radius, orbit.height + Math.sin(t * 1.3) * 0.25, Math.sin(a) * orbit.radius);
      ref.current.rotation.y = -a + (orbit.speed > 0 ? 0 : Math.PI);
    } else if (ref.current) {
      const hop = (t % 3.2) < 0.3 ? Math.sin(((t % 3.2) / 0.3) * Math.PI) * 0.08 : 0;
      ref.current.position.y = hop;
    }
    const flap = orbit ? Math.sin(t * 14) * 0.7 : -0.1;
    wings.current.forEach((w, i) => w && (w.rotation.z = (i ? -1 : 1) * flap));
    if (head.current) head.current.rotation.x = orbit ? 0 : Math.max(0, Math.sin(t * 2.4)) ** 6 * 0.7;
  });
  return (
    <group {...props}>
      <group ref={ref}>
        <group
          scale={size}
          onClick={(e) => {
            e.stopPropagation();
            audioEngine.sfx('tweet', 0.4);
            push(['🎵', '🐦', '♪'][Math.floor(Math.random() * 3)]);
          }}
          {...bind}
        >
          <mesh position={[0, 0.12, 0]} scale={[0.1, 0.1, 0.13]} castShadow>
            <sphereGeometry args={[1, 16, 12]} />
            <Soft color={color} />
          </mesh>
          <mesh position={[0, 0.1, 0.03]} scale={[0.075, 0.07, 0.09]}>
            <sphereGeometry args={[1, 14, 10]} />
            <Soft color={belly} />
          </mesh>
          <group ref={head} position={[0, 0.21, 0.07]}>
            <mesh>
              <sphereGeometry args={[0.075, 16, 12]} />
              <Soft color={color} />
            </mesh>
            {cap && (
              <mesh position={[0, 0.04, -0.01]} scale={[1, 0.6, 1]}>
                <sphereGeometry args={[0.065, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <Soft color={cap} />
              </mesh>
            )}
            <mesh position={[0, -0.005, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.022, 0.05, 8]} />
              <Soft color="#ffa95e" />
            </mesh>
            {[1, -1].map((s) => (
              <mesh key={s} position={[s * 0.045, 0.02, 0.055]}>
                <sphereGeometry args={[0.012, 6, 6]} />
                <meshBasicMaterial color="#2f2a33" />
              </mesh>
            ))}
          </group>
          {[1, -1].map((s, i) => (
            <group key={s} ref={(el) => (wings.current[i] = el)} position={[s * 0.08, 0.15, 0]}>
              <mesh position={[s * 0.06, 0, -0.01]} scale={[0.08, 0.025, 0.07]}>
                <sphereGeometry args={[1, 10, 8]} />
                <Soft color={color} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.14, -0.14]} rotation={[-0.6, 0, 0]} scale={[1, 0.3, 1]}>
            <coneGeometry args={[0.05, 0.1, 8]} />
            <Soft color={color} />
          </mesh>
        </group>
        {node(0.45)}
      </group>
    </group>
  );
}

/** 반짝이는 숲의 작은 요정 */
export function Fairy({ color = '#fff4b0', radius = 2, height = 1.4, speed = 0.4, phase = 0 }: { color?: string; radius?: number; height?: number; speed?: number; phase?: number }) {
  const ref = useRef<THREE.Group>(null);
  const wings = useRef<(THREE.Group | null)[]>([]);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    const a = t * speed;
    if (ref.current) {
      ref.current.position.set(Math.cos(a) * radius + Math.sin(t * 1.7) * 0.3, height + Math.sin(t * 2.1) * 0.3, Math.sin(a) * radius);
      ref.current.rotation.y = -a + (speed > 0 ? 0 : Math.PI);
    }
    wings.current.forEach((w, i) => w && (w.rotation.y = (i ? -1 : 1) * (0.4 + Math.sin(t * 30) * 0.5)));
  });
  return (
    <group ref={ref}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.sfx('sparkle', 0.4);
          push('✨');
        }}
        {...bind}
      >
        <mesh>
          <sphereGeometry args={[0.16, 12, 10]} />
          <Glow color={color} opacity={0.18} />
        </mesh>
        <mesh position={[0, -0.03, 0]} scale={[1, 1.3, 1]}>
          <sphereGeometry args={[0.045, 12, 10]} />
          <Glow color={color} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.045, 12, 10]} />
          <Soft color="#ffe2cf" emissive="#ffe2cf" emissiveIntensity={0.4} />
        </mesh>
        {[1, -1].map((s, i) => (
          <group key={s} ref={(el) => (wings.current[i] = el)} position={[0, 0.0, -0.03]}>
            <mesh position={[s * 0.07, 0.02, 0]} scale={[0.08, 0.05, 0.005]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#e6f6ff" transparent opacity={0.7} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
      {node(0.35)}
    </group>
  );
}

/** 깡총깡총 토끼 */
export function Rabbit({ color = '#fffaf4', radius = 2.4, speed = 0.12, phase = 0 }: { color?: string; radius?: number; speed?: number; phase?: number }) {
  const ref = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const progress = useRef(phase);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  const inner = useMemo(() => new THREE.Color(color).offsetHSL(0, 0.3, -0.05).getStyle(), [color]);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + phase;
    const cycle = t % 4;
    const hopping = cycle < 2;
    if (hopping) progress.current += dt * speed;
    const a = progress.current;
    if (ref.current) {
      ref.current.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      ref.current.rotation.y = -a;
    }
    if (body.current) {
      const h = hopping ? Math.abs(Math.sin(cycle * Math.PI * 2.5)) * 0.15 : 0;
      body.current.position.y = h;
      body.current.rotation.x = hopping ? -h * 1.5 : Math.sin(t * 3) * 0.03;
    }
  });
  return (
    <group ref={ref}>
      <group
        ref={body}
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.sfx('pop', 0.35);
          push(['🥕', '♡', '🐰'][Math.floor(Math.random() * 3)]);
        }}
        {...bind}
      >
        <mesh position={[0, 0.15, 0]} scale={[0.17, 0.15, 0.2]} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
          <Soft color={color} />
        </mesh>
        <mesh position={[0, 0.3, 0.16]} castShadow>
          <sphereGeometry args={[0.12, 16, 12]} />
          <Soft color={color} />
        </mesh>
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.05, 0.4, 0.13]} rotation={[-0.25, 0, s * -0.15]}>
            <mesh position={[0, 0.1, 0]} scale={[1, 1, 0.55]}>
              <capsuleGeometry args={[0.035, 0.16, 4, 8]} />
              <Soft color={color} />
            </mesh>
            <mesh position={[0, 0.1, 0.015]} scale={[0.5, 0.8, 0.3]}>
              <capsuleGeometry args={[0.035, 0.16, 4, 8]} />
              <Soft color={inner} />
            </mesh>
          </group>
        ))}
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 0.055, 0.32, 0.265]}>
            <sphereGeometry args={[0.014, 6, 6]} />
            <meshBasicMaterial color="#3a2a24" />
          </mesh>
        ))}
        <mesh position={[0, 0.17, -0.2]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <Soft color="#ffffff" />
        </mesh>
      </group>
      {node(0.7)}
    </group>
  );
}
