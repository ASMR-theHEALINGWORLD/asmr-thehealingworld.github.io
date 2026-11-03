import { useFrame, type GroupProps, type MeshProps } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Glow, Soft } from './common';

/** 둥근 침엽수 */
export function Pine({ color = '#5f9c7a', trunk = '#9a6b4b', size = 1, sway = 0.02, ...props }: GroupProps & { color?: string; trunk?: string; size?: number; sway?: number }) {
  const ref = useRef<THREE.Group>(null);
  const off = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.8 + off) * sway;
  });
  const shade = new THREE.Color(color).offsetHSL(0, 0, 0.05).getStyle();
  return (
    <group {...props} scale={size}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.5, 10]} />
        <Soft color={trunk} />
      </mesh>
      <group ref={ref}>
        {[
          [0.55, 0.75, 0.8],
          [0.95, 0.6, 0.68],
          [1.3, 0.44, 0.55],
        ].map(([y, r, h], i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <coneGeometry args={[r, h, 14]} />
            <Soft color={i === 1 ? shade : color} />
          </mesh>
        ))}
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <Soft color={shade} />
        </mesh>
      </group>
    </group>
  );
}

/** 몽글몽글 둥근 나무 */
export function RoundTree({ color = '#8cc47e', trunk = '#a7775a', size = 1, ...props }: GroupProps & { color?: string; trunk?: string; size?: number }) {
  const ref = useRef<THREE.Group>(null);
  const off = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + off) * 0.03;
  });
  return (
    <group {...props} scale={size}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 10]} />
        <Soft color={trunk} />
      </mesh>
      <group ref={ref} position={[0, 0.7, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <sphereGeometry args={[0.5, 24, 18]} />
          <Soft color={color} />
        </mesh>
        <mesh position={[0.32, 0.18, 0.1]} castShadow>
          <sphereGeometry args={[0.32, 18, 14]} />
          <Soft color={color} />
        </mesh>
        <mesh position={[-0.3, 0.2, -0.05]} castShadow>
          <sphereGeometry args={[0.34, 18, 14]} />
          <Soft color={color} />
        </mesh>
      </group>
    </group>
  );
}

export function Bush({ color = '#86bf78', size = 1, ...props }: GroupProps & { color?: string; size?: number }) {
  return (
    <group {...props} scale={size}>
      {[
        [0, 0.18, 0, 0.26],
        [0.22, 0.12, 0.05, 0.18],
        [-0.2, 0.12, 0, 0.2],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 16, 12]} />
          <Soft color={color} />
        </mesh>
      ))}
    </group>
  );
}

export function Rock({ color = '#b9b4c6', size = 1, ...props }: MeshProps & { color?: string; size?: number }) {
  return (
    <mesh {...props} scale={[size, size * 0.65, size * 0.85]} castShadow receiveShadow>
      <sphereGeometry args={[0.3, 14, 10]} />
      <Soft color={color} />
    </mesh>
  );
}

export function Mushroom({ cap = '#f2867a', size = 1, ...props }: GroupProps & { cap?: string; size?: number }) {
  return (
    <group {...props} scale={size}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.14, 10]} />
        <Soft color="#fff3e2" />
      </mesh>
      <mesh position={[0, 0.14, 0]} scale={[1, 0.7, 1]} castShadow>
        <sphereGeometry args={[0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Soft color={cap} side={THREE.DoubleSide} />
      </mesh>
      {[0, 2, 4].map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.055, 0.19, Math.sin(a) * 0.055]}>
          <sphereGeometry args={[0.016, 6, 6]} />
          <Soft color="#fffaf0" />
        </mesh>
      ))}
    </group>
  );
}

export function GrassTuft({ color = '#7fbf6a', ...props }: GroupProps & { color?: string }) {
  return (
    <group {...props}>
      {[-0.06, 0, 0.06].map((x, i) => (
        <mesh key={i} position={[x, 0.07, 0]} rotation={[0, 0, -x * 4]}>
          <capsuleGeometry args={[0.025, 0.08, 4, 8]} />
          <Soft color={color} />
        </mesh>
      ))}
    </group>
  );
}

export function Flower({ petal = '#ffd1dc', center = '#ffe28a', ...props }: GroupProps & { petal?: string; center?: string }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.16, 5]} />
        <Soft color="#7fb86b" />
      </mesh>
      <group position={[0, 0.17, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.04, 0, Math.sin((i / 5) * Math.PI * 2) * 0.04]}>
            <sphereGeometry args={[0.032, 8, 6]} />
            <Soft color={petal} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.025, 8, 6]} />
          <Soft color={center} />
        </mesh>
      </group>
    </group>
  );
}

/** 랜덤하게 떠다니며 깜빡이는 작은 빛 (반딧불, 플랑크톤 등) */
export function FloatingLights({
  count = 20,
  color = '#f4ff9c',
  radius = 4,
  height = [0.4, 2.6],
  size = 0.035,
}: {
  count?: number;
  color?: string;
  radius?: number;
  height?: [number, number];
  size?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        a: Math.random() * Math.PI * 2,
        r: 0.8 + Math.random() * (radius - 0.8),
        y: height[0] + Math.random() * (height[1] - height[0]),
        s: 0.2 + Math.random() * 0.5,
        p: Math.random() * 10,
      })),
    [count, radius, height],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    seeds.forEach((d, i) => {
      const a = d.a + t * d.s * 0.15;
      dummy.position.set(Math.cos(a) * d.r + Math.sin(t * d.s + d.p) * 0.3, d.y + Math.sin(t * d.s * 1.7 + d.p) * 0.3, Math.sin(a) * d.r);
      const blink = 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.4 + d.p * 3));
      dummy.scale.setScalar(blink);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[size, 8, 6]} />
      <Glow color={color} />
    </instancedMesh>
  );
}
