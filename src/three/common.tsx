import { useFrame, useThree, type GroupProps } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';

/** 부드러운 펠트/클레이 질감의 기본 재질 */
export function Soft({ color, rough = 0.85, ...rest }: { color: string; rough?: number } & JSX.IntrinsicElements['meshStandardMaterial']) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} {...rest} />;
}

/** 빛나는 재질 (불꽃, 반딧불 등) */
export function Glow({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return <meshBasicMaterial color={color} toneMapped={false} transparent={opacity < 1} opacity={opacity} />;
}

/** 자식 메쉬 전체에 그림자 설정 */
export function Shadowed({ children, cast = true, receive = true, ...props }: GroupProps & { cast?: boolean; receive?: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        const mat = m.material as THREE.Material;
        if (mat && (mat as THREE.MeshBasicMaterial).isMeshBasicMaterial) return;
        if (mat?.transparent) return;
        m.castShadow = cast;
        m.receiveShadow = receive;
      }
    });
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

/** 모서리가 둥근 원판 (디오라마 섬 바닥). wobble 로 유기적인 형태 */
export function RoundDisc({
  radius,
  height,
  bevel = 0.12,
  color,
  wobble = 0.04,
  seed = 1,
  ...props
}: GroupProps & { radius: number; height: number; bevel?: number; color: string; wobble?: number; seed?: number }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
    const b = Math.min(bevel, height / 2, radius / 2);
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2);
      pts.push(new THREE.Vector2(radius - b + Math.cos(a) * b, b + Math.sin(a) * b));
    }
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2);
      pts.push(new THREE.Vector2(radius - b + Math.cos(a) * b, height - b + Math.sin(a) * b));
    }
    pts.push(new THREE.Vector2(0, height));
    const g = new THREE.LatheGeometry(pts, 64);
    if (wobble) {
      const p = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        const th = Math.atan2(z, x);
        const k = 1 + wobble * Math.sin(3 * th + seed) + wobble * 0.7 * Math.sin(5 * th + seed * 2.3);
        p.setX(i, x * k);
        p.setZ(i, z * k);
      }
      g.computeVertexNormals();
    }
    return g;
  }, [radius, height, bevel, wobble, seed]);
  return (
    <group {...props}>
      <mesh geometry={geo} castShadow receiveShadow>
        <Soft color={color} />
      </mesh>
    </group>
  );
}

/** 층층이 쌓인 디오라마 섬 */
export function Island({
  radius,
  top = '#9ccf7f',
  strata = ['#c99766', '#a9774f'],
  seed = 1,
  topHeight = 0.32,
  ...props
}: GroupProps & { radius: number; top?: string; strata?: string[]; seed?: number; topHeight?: number }) {
  return (
    <group {...props}>
      <RoundDisc radius={radius} height={topHeight} bevel={0.14} color={top} position={[0, -topHeight, 0]} seed={seed} />
      {strata.map((c, i) => (
        <RoundDisc
          key={i}
          radius={radius * (0.985 - i * 0.04)}
          height={0.5}
          bevel={0.18}
          color={c}
          position={[0, -topHeight - 0.42 - i * 0.42, 0]}
          seed={seed}
        />
      ))}
    </group>
  );
}

const CLOUD_PUFFS: [number, number, number, number][] = [
  [0, 0, 0, 0.62],
  [0.62, -0.12, 0.05, 0.46],
  [-0.62, -0.14, 0, 0.44],
  [0.28, 0.28, -0.05, 0.46],
  [-0.3, 0.22, 0.1, 0.4],
  [1.05, -0.22, 0, 0.3],
];

/** 둥실둥실 구름 */
export function Cloud({ speed = 0.4, drift = 0.25, color = '#ffffff', opacity = 1, ...props }: GroupProps & { speed?: number; drift?: number; color?: string; opacity?: number }) {
  const ref = useRef<THREE.Group>(null);
  const offset = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + offset;
    ref.current.position.y = Math.sin(t) * drift;
    ref.current.position.x = Math.sin(t * 0.5) * drift * 1.4;
  });
  return (
    <group {...props}>
      <group ref={ref}>
        {CLOUD_PUFFS.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1, 0.86, 0.9]}>
            <sphereGeometry args={[r, 24, 18]} />
            <meshStandardMaterial color={color} roughness={1} emissive={color} emissiveIntensity={0.18} transparent={opacity < 1} opacity={opacity} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** 탭했을 때 떠오르는 이모지 말풍선 */
export function useEmojiPops() {
  const [pops, setPops] = useState<{ id: number; emoji: string }[]>([]);
  const push = (emoji: string) => {
    const id = Math.random();
    setPops((p) => [...p.slice(-3), { id, emoji }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1400);
  };
  const node = (y: number) =>
    pops.map((p) => (
      <Html key={p.id} position={[0, y, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div className="emoji-pop">{p.emoji}</div>
      </Html>
    ));
  return { push, node };
}

/** 마우스 오버 시 커서 변경 */
export function usePointer() {
  const [hovered, set] = useState(false);
  useLayoutEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);
  return {
    hovered,
    bind: {
      onPointerOver: (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        set(true);
      },
      onPointerOut: () => set(false),
    },
  };
}

const ease = (k: number) => 1 - Math.pow(1 - k, 3);

/** 진입 시 카메라가 부드럽게 다가오는 연출 + OrbitControls 타깃 고정 */
export function CameraIntro({ position, target, duration = 2.2 }: { position: [number, number, number]; target: [number, number, number]; duration?: number }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void; enabled: boolean } | null;
  const t0 = useRef<number | null>(null);
  const key = [...position, ...target].join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const from = useMemo(() => new THREE.Vector3(position[0] * 1.5, position[1] * 1.9 + 2, position[2] * 1.5), [key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const to = useMemo(() => new THREE.Vector3(...position), [key]);
  useLayoutEffect(() => {
    camera.position.copy(from);
    camera.lookAt(target[0], target[1], target[2]);
    t0.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, key]);
  useFrame(({ clock }) => {
    if (t0.current === null) t0.current = clock.elapsedTime;
    const k = (clock.elapsedTime - t0.current) / duration;
    if (k > 1.02) return;
    camera.position.lerpVectors(from, to, ease(Math.min(1, k)));
    if (controls) {
      controls.target.set(...target);
      controls.update();
    } else camera.lookAt(...target);
  });
  return null;
}

/** 화면 한쪽에 UI 패널이 있을 때 3D 장면을 반대쪽으로 살짝 밀어줌 (궤도 회전 중심은 유지) */
export function ViewShift({ px }: { px: number }) {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (px) cam.setViewOffset(size.width, size.height, px, 0, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [camera, size, px]);
  return null;
}

/** 원형 경로 상 위치 계산 */
export const around = (r: number, a: number, y = 0): [number, number, number] => [Math.cos(a) * r, y, Math.sin(a) * r];
/** (x,z) 에서 원점을 바라보는 y 회전 */
export const faceCenter = (x: number, z: number) => Math.atan2(-x, -z);
