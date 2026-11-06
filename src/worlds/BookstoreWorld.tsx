import { Instance, Instances, RoundedBox, Sparkles } from '@react-three/drei';
import { useFrame, type GroupProps } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../audio/AudioEngine';
import { Character, LOOKS } from '../three/Character';
import { Soft, useEmojiPops, usePointer } from '../three/common';
import type { DioramaProps } from './registry';

const BOOK_COLORS = ['#f4a7a3', '#f7c59f', '#f9e3a3', '#a8d5ba', '#9ec9e6', '#c3b1e1', '#e8a0bf', '#fff6e6', '#d9b38c', '#86b3a8', '#b7c9f2'];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ---------------- 책 한 권 (클릭하면 쏙 빠졌다 들어감) ---------------- */
function Book({ position, scale, color, rotZ }: { position: [number, number, number]; scale: [number, number, number]; color: string; rotZ: number }) {
  const ref = useRef<THREE.Object3D>(null);
  const pulled = useRef(-10);
  useFrame(() => {
    const d = performance.now() / 1000 - pulled.current;
    if (!ref.current) return;
    if (d > 2.4) {
      if (ref.current.position.z !== position[2]) ref.current.position.z = position[2];
      return;
    }
    const k = d < 0.4 ? d / 0.4 : d < 1.8 ? 1 : 1 - (d - 1.8) / 0.6;
    ref.current.position.z = position[2] + Math.sin((Math.max(0, k) * Math.PI) / 2) * 0.22;
  });
  return (
    <Instance
      ref={ref as never}
      position={position}
      scale={scale}
      rotation={[0, 0, rotZ]}
      color={color}
      onClick={(e) => {
        e.stopPropagation();
        pulled.current = performance.now() / 1000;
        audioEngine.sfx('book', 0.5);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => (document.body.style.cursor = '')}
    />
  );
}

/* ---------------- 책장 ---------------- */
function Bookshelf({ width = 2.6, height = 3, rows = 4, depth = 0.55, seed = 3, wood = '#c48d62', ...props }: GroupProps & { width?: number; height?: number; rows?: number; depth?: number; seed?: number; wood?: string }) {
  const books = useMemo(() => {
    const r = seeded(seed * 1000 + 7);
    const out: { position: [number, number, number]; scale: [number, number, number]; color: string; rotZ: number }[] = [];
    const rowH = (height - 0.2) / rows;
    for (let row = 0; row < rows; row++) {
      const y0 = 0.12 + row * rowH;
      let x = -width / 2 + 0.12;
      while (x < width / 2 - 0.2) {
        if (r() < 0.07) {
          x += 0.2;
          continue;
        }
        const w = 0.07 + r() * 0.07;
        const h = rowH * (0.62 + r() * 0.26);
        const lean = r() < 0.06 ? 0.22 : 0;
        out.push({
          position: [x + w / 2 + (lean ? h * 0.1 : 0), y0 + h / 2, 0.03],
          scale: [w, h, depth * 0.78],
          color: BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)],
          rotZ: -lean,
        });
        x += w + 0.008 + (lean ? h * 0.25 : 0);
      }
    }
    return out;
  }, [width, height, rows, depth, seed]);
  const rowH = (height - 0.2) / rows;
  return (
    <group {...props}>
      {/* 프레임 */}
      <mesh position={[0, height / 2, -depth / 2 + 0.03]} receiveShadow>
        <boxGeometry args={[width, height, 0.06]} />
        <Soft color={new THREE.Color(wood).offsetHSL(0, 0, -0.06).getStyle()} />
      </mesh>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.12, height, depth]} radius={0.04} position={[(s * (width - 0.12)) / 2, height / 2, 0]} castShadow receiveShadow>
          <Soft color={wood} />
        </RoundedBox>
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <RoundedBox key={i} args={[width, 0.1, depth]} radius={0.03} position={[0, 0.06 + i * rowH, 0]} castShadow receiveShadow>
          <Soft color={wood} />
        </RoundedBox>
      ))}
      <Instances limit={books.length} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} />
        {books.map((b, i) => (
          <Book key={i} {...b} />
        ))}
      </Instances>
    </group>
  );
}

/* ---------------- 비 오는 창문 ---------------- */
function RainyWindow(props: GroupProps) {
  const drops = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: 26 }, () => ({ x: (Math.random() - 0.5) * 1.6, y: Math.random() * 1.5, v: 0.3 + Math.random() * 0.9 })), []);
  useFrame((_, dt) => {
    const m = drops.current;
    if (!m) return;
    seeds.forEach((d, i) => {
      d.y -= d.v * dt;
      if (d.y < -0.72) {
        d.y = 0.72;
        d.x = (Math.random() - 0.5) * 1.6;
      }
      dummy.position.set(d.x, d.y, 0.02);
      dummy.scale.set(1, 1 + d.v, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group {...props}>
      <RoundedBox args={[2.0, 1.8, 0.16]} radius={0.06} castShadow>
        <Soft color="#fffaf2" />
      </RoundedBox>
      {/* 바깥 풍경: 비 오는 골목 */}
      <mesh position={[0, 0, 0.085]}>
        <planeGeometry args={[1.7, 1.5]} />
        <meshBasicMaterial color="#a9bfd3" toneMapped={false} />
      </mesh>
      <mesh position={[-0.45, -0.45, 0.088]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshBasicMaterial color="#93a9c0" toneMapped={false} />
      </mesh>
      <mesh position={[0.4, -0.35, 0.088]}>
        <planeGeometry args={[0.5, 0.8]} />
        <meshBasicMaterial color="#8aa1b9" toneMapped={false} />
      </mesh>
      <mesh position={[0.4, -0.2, 0.09]}>
        <planeGeometry args={[0.12, 0.14]} />
        <meshBasicMaterial color="#ffe6a8" toneMapped={false} />
      </mesh>
      <instancedMesh ref={drops} args={[undefined, undefined, seeds.length]} position={[0, 0, 0.09]}>
        <capsuleGeometry args={[0.008, 0.05, 2, 4]} />
        <meshBasicMaterial color="#e9f4ff" transparent opacity={0.8} />
      </instancedMesh>
      {/* 창살 */}
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[0.06, 1.55, 0.05]} />
        <Soft color="#fffaf2" />
      </mesh>
      <mesh position={[0, 0.1, 0.12]}>
        <boxGeometry args={[1.75, 0.06, 0.05]} />
        <Soft color="#fffaf2" />
      </mesh>
      <mesh position={[0, -0.95, 0.12]}>
        <boxGeometry args={[2.2, 0.08, 0.3]} />
        <Soft color="#f3e5d3" />
      </mesh>
    </group>
  );
}

/* ---------------- 소품 ---------------- */
function Armchair(props: GroupProps) {
  const c = '#a9c8a0';
  return (
    <group {...props}>
      <RoundedBox args={[1.1, 0.42, 0.95]} radius={0.12} position={[0, 0.3, 0]} castShadow receiveShadow>
        <Soft color={c} />
      </RoundedBox>
      <RoundedBox args={[1.1, 0.95, 0.25]} radius={0.12} position={[0, 0.75, -0.38]} castShadow>
        <Soft color={c} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.22, 0.6, 0.9]} radius={0.1} position={[s * 0.52, 0.55, 0]} castShadow>
          <Soft color={new THREE.Color(c).offsetHSL(0, 0, -0.04).getStyle()} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.68, 0.12, 0.7]} radius={0.05} position={[0, 0.56, 0.05]}>
        <Soft color="#f6f0df" />
      </RoundedBox>
    </group>
  );
}

function FloorLamp(props: GroupProps) {
  return (
    <group {...props}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.06, 18]} />
        <Soft color="#8b6b5a" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.7, 8]} />
        <Soft color="#8b6b5a" />
      </mesh>
      <mesh position={[0, 1.78, 0]}>
        <cylinderGeometry args={[0.2, 0.32, 0.36, 20, 1, true]} />
        <meshStandardMaterial color="#ffe8c4" emissive="#ffd59a" emissiveIntensity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} color="#ffcf8f" intensity={5} distance={5} decay={1.6} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.003} />
    </group>
  );
}

function TeaTable(props: GroupProps) {
  const steam = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    steam.current?.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 0.4 + i / 3) % 1;
      c.position.y = k * 0.5;
      c.position.x = Math.sin(k * 6 + i) * 0.04;
      c.scale.setScalar(0.5 + k);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - k);
    });
  });
  return (
    <group {...props}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.6, 12]} />
        <Soft color="#b98863" />
      </mesh>
      <RoundedBox args={[1.0, 0.08, 1.0]} radius={0.04} position={[0, 0.62, 0]} castShadow receiveShadow>
        <Soft color="#d7a77f" />
      </RoundedBox>
      <mesh position={[0, 0.665, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.36, 24]} />
        <Soft color="#fff6ec" />
      </mesh>
      {/* 티팟 */}
      <group position={[-0.15, 0.67, -0.1]}>
        <mesh position={[0, 0.13, 0]} scale={[1, 0.85, 1]} castShadow>
          <sphereGeometry args={[0.15, 20, 16]} />
          <Soft color="#f6c7c1" rough={0.4} />
        </mesh>
        <mesh position={[0.17, 0.15, 0]} rotation={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.018, 0.03, 0.16, 8]} />
          <Soft color="#f6c7c1" rough={0.4} />
        </mesh>
        <mesh position={[-0.15, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.015, 6, 14]} />
          <Soft color="#f6c7c1" />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <sphereGeometry args={[0.03, 10, 8]} />
          <Soft color="#fff" />
        </mesh>
      </group>
      {/* 찻잔 */}
      <group position={[0.2, 0.67, 0.15]}>
        <mesh position={[0, 0.005, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.012, 18]} />
          <Soft color="#fffaf3" />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <cylinderGeometry args={[0.065, 0.045, 0.07, 18]} />
          <Soft color="#fffaf3" rough={0.35} />
        </mesh>
        <mesh position={[0, 0.078, 0]}>
          <cylinderGeometry args={[0.058, 0.058, 0.004, 18]} />
          <Soft color="#c98d55" />
        </mesh>
        <group ref={steam} position={[0, 0.1, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.04, 10, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
      {/* 책 더미 */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.22, 0.69 + i * 0.05, -0.25]} rotation={[0, i * 0.25, 0]} castShadow>
          <boxGeometry args={[0.32, 0.045, 0.24]} />
          <Soft color={BOOK_COLORS[(i * 3 + 1) % BOOK_COLORS.length]} />
        </mesh>
      ))}
    </group>
  );
}

function Cat(props: GroupProps) {
  const body = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  const wake = useRef(-10);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const awake = performance.now() / 1000 - wake.current < 1.6;
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.6) * 0.04;
    if (tail.current) tail.current.rotation.y = Math.sin(t * (awake ? 8 : 0.8)) * (awake ? 0.5 : 0.2);
  });
  const c = '#f3c89a';
  return (
    <group {...props}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          wake.current = performance.now() / 1000;
          const short = Math.random() < 0.5;
          audioEngine.sfx(short ? 'nyang' : 'meow', 0.45);
          push(short ? '냥!' : '냐옹~');
        }}
        {...bind}
      >
        <group ref={body}>
          <mesh position={[0, 0.15, 0]} scale={[0.32, 0.18, 0.24]} castShadow>
            <sphereGeometry args={[1, 20, 14]} />
            <Soft color={c} />
          </mesh>
          <mesh position={[0.26, 0.17, 0.06]} castShadow>
            <sphereGeometry args={[0.15, 18, 14]} />
            <Soft color={c} />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[0.3, 0.3, 0.06 + s * 0.08]} rotation={[s * 0.3, 0, -0.2]}>
              <coneGeometry args={[0.05, 0.09, 8]} />
              <Soft color={c} />
            </mesh>
          ))}
          {[1, -1].map((s) => (
            <mesh key={s} position={[0.38, 0.18, 0.06 + s * 0.055]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.018, 0.005, 4, 8, Math.PI]} />
              <meshBasicMaterial color="#6b4a3a" />
            </mesh>
          ))}
        </group>
        <group ref={tail} position={[-0.28, 0.08, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0.2]} position={[0, 0, 0.12]}>
            <torusGeometry args={[0.18, 0.04, 8, 16, Math.PI * 0.9]} />
            <Soft color="#e0ad7c" />
          </mesh>
        </group>
      </group>
      {node(0.6)}
    </group>
  );
}

function WallClock(props: GroupProps) {
  const { bind } = usePointer();
  const { push, node } = useEmojiPops();
  return (
    <group
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        audioEngine.sfx('tick', 0.5);
        push('째깍째깍');
      }}
      {...bind}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 28]} />
        <Soft color="#fff8ee" />
      </mesh>
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0.02]}>
        <torusGeometry args={[0.3, 0.035, 8, 28]} />
        <Soft color="#d39f76" />
      </mesh>
      {/* 오후 4시 */}
      <mesh position={[Math.sin((4 / 12) * Math.PI * 2) * 0.08, Math.cos((4 / 12) * Math.PI * 2) * 0.08, 0.04]} rotation={[0, 0, -(4 / 12) * Math.PI * 2]}>
        <boxGeometry args={[0.025, 0.16, 0.01]} />
        <meshBasicMaterial color="#5a4032" />
      </mesh>
      <mesh position={[0, 0.11, 0.045]}>
        <boxGeometry args={[0.018, 0.22, 0.01]} />
        <meshBasicMaterial color="#5a4032" />
      </mesh>
      {node(0.55)}
    </group>
  );
}

function Plant(props: GroupProps) {
  return (
    <group {...props}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.11, 0.28, 16]} />
        <Soft color="#e9a58a" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.3) * 0.08, 0.38 + (i % 2) * 0.06, Math.sin(i * 1.3) * 0.08]} rotation={[Math.sin(i * 1.3) * 0.5, 0, -Math.cos(i * 1.3) * 0.5]} scale={[0.08, 0.18, 0.04]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <Soft color={i % 2 ? '#86bf7a' : '#6faa6a'} />
        </mesh>
      ))}
    </group>
  );
}

/** 서점 안을 천천히 오가는 손님 */
function Walker() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.18;
    const k = (Math.sin(t) + 1) / 2;
    const dir = Math.cos(t);
    if (ref.current) {
      ref.current.position.set(-0.4 + k * 2.6, 0, 2.15);
      ref.current.rotation.y = dir >= 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  });
  return (
    <group ref={ref}>
      <Character look={{ ...LOOKS.momo, hat: '#f7d38a' }} pose="walk" phase={2} emojis={['📚', '🎵', '💛']} />
    </group>
  );
}

export function BookstoreDiorama({ lite }: DioramaProps) {
  return (
    <group>
      {/* 바닥 */}
      <RoundedBox args={[7.4, 0.45, 6.4]} radius={0.15} position={[0, -0.225, 0]} receiveShadow castShadow>
        <Soft color="#d4a175" />
      </RoundedBox>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[-3.4 + i * 0.68, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.02, 6.2]} />
          <meshBasicMaterial color="#bd8c63" />
        </mesh>
      ))}
      <RoundedBox args={[7.6, 0.25, 6.6]} radius={0.1} position={[0, -0.55, 0]}>
        <Soft color="#b98a65" />
      </RoundedBox>
      {/* 벽 */}
      <RoundedBox args={[7.4, 4.3, 0.3]} radius={0.1} position={[0, 2.1, -3.05]} receiveShadow>
        <Soft color="#f7dfc6" />
      </RoundedBox>
      <RoundedBox args={[0.3, 4.3, 6.4]} radius={0.1} position={[-3.55, 2.1, 0]} receiveShadow>
        <Soft color="#f1d2b3" />
      </RoundedBox>
      <mesh position={[0, 0.55, -2.88]}>
        <boxGeometry args={[7.2, 1.1, 0.04]} />
        <Soft color="#e7bb98" />
      </mesh>
      <mesh position={[-3.38, 0.55, 0]}>
        <boxGeometry args={[0.04, 1.1, 6.2]} />
        <Soft color="#e2b08c" />
      </mesh>

      <Bookshelf position={[-1.75, 0, -2.6]} width={3.0} height={3.3} rows={4} seed={2} />
      <Bookshelf position={[-3.1, 0, 0.5]} rotation={[0, Math.PI / 2, 0]} width={3.4} height={3.0} rows={4} seed={5} wood="#bd855b" />
      {!lite && <Bookshelf position={[3.1, 0, -2.55]} width={1.2} height={1.6} rows={2} seed={9} />}

      <RainyWindow position={[1.25, 2.15, -2.85]} />
      {/* 창가 벤치 */}
      <RoundedBox args={[2.2, 0.5, 0.8]} radius={0.1} position={[1.25, 0.25, -2.45]} castShadow receiveShadow>
        <Soft color="#e2bc98" />
      </RoundedBox>
      <RoundedBox args={[2.0, 0.14, 0.7]} radius={0.06} position={[1.25, 0.56, -2.42]} castShadow>
        <Soft color="#f4c0bb" />
      </RoundedBox>
      <Character look={LOOKS.lulu} pose="sit" holding="teacup" position={[0.95, 0.63, -2.3]} rotation={[0, 0.25, 0]} phase={1.2} emojis={['🍵', '☔', '💛']} />
      <Plant position={[2.1, 0.63, -2.5]} />

      {/* 독서 코너 */}
      <mesh position={[-0.9, 0.012, 0.7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.45, 40]} />
        <Soft color="#f4bfb2" />
      </mesh>
      <mesh position={[-0.9, 0.016, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.25, 1.33, 40]} />
        <Soft color="#fff1e6" />
      </mesh>
      <Armchair position={[-1.55, 0, 0.5]} rotation={[0, 0.65, 0]} />
      <Character look={LOOKS.haru} pose="sit" holding="book" position={[-1.5, 0.62, 0.56]} rotation={[0, 0.65, 0]} phase={0} emojis={['📖', '💛', '✨']} sway={0.5} />
      <FloorLamp position={[-2.55, 0, -0.55]} />
      <TeaTable position={[0.65, 0, 0.55]} />
      <Cat position={[-0.45, 0.02, 1.55]} rotation={[0, -0.4, 0]} />

      {/* 책장 앞 손님 */}
      <Character look={LOOKS.toto} holding="reach" position={[-1.2, 0, -1.85]} rotation={[0, Math.PI, 0]} phase={3} emojis={['📚', '🤔', '✨']} />
      {!lite && <Walker />}

      <WallClock position={[-3.36, 3.55, -1.7]} rotation={[0, Math.PI / 2, 0]} />
      <Plant position={[3.0, 0, 2.4]} scale={1.4} />
      {!lite && <Sparkles count={45} scale={[6, 3, 5]} position={[0, 1.8, 0]} size={3} speed={0.2} color="#fff0c4" opacity={0.8} />}
    </group>
  );
}

export function BookstoreEnvironment() {
  return (
    <>
      <color attach="background" args={['#f3dfca']} />
      <fog attach="fog" args={['#f3dfca', 20, 40]} />
      <ambientLight intensity={0.6} color="#fff1e0" />
      <hemisphereLight args={['#fff3e3', '#c79f86', 0.7]} />
      <directionalLight
        position={[6, 9, 7]}
        intensity={1.5}
        color="#ffe0b5"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0005}
      />
    </>
  );
}
