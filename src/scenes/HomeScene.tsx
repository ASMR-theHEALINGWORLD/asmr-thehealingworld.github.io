import { OrbitControls, RoundedBox, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { Character, LOOKS } from '../three/Character';
import { CameraIntro, Cloud, Island, Soft } from '../three/common';
import { Flower, GrassTuft, RoundTree } from '../three/props';

function Telescope(props: JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12]} rotation={[Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]}>
            <cylinderGeometry args={[0.018, 0.018, 0.52, 6]} />
            <Soft color="#c08a5a" />
          </mesh>
        );
      })}
      <group position={[0, 0.55, 0]} rotation={[0.5, 0.5, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.6, 16]} />
          <Soft color="#f4efe6" rough={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
          <Soft color="#e8c27a" rough={0.3} metalness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Picnic(props: JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      <RoundedBox args={[1.5, 0.05, 1.15]} radius={0.02} position={[0, 0.025, 0]} receiveShadow>
        <Soft color="#fbd1d6" />
      </RoundedBox>
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 1.15]} />
          <Soft color="#fff3f1" />
        </mesh>
      ))}
      {/* 작은 의자 + 컵 */}
      <group position={[0.95, 0, -0.5]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 18]} />
          <Soft color="#d39a6a" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos(i * 2.1) * 0.12, 0.14, Math.sin(i * 2.1) * 0.12]}>
            <cylinderGeometry args={[0.025, 0.025, 0.28, 6]} />
            <Soft color="#c08a5a" />
          </mesh>
        ))}
        <mesh position={[0, 0.39, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.12, 16]} />
          <Soft color="#ffffff" rough={0.4} />
        </mesh>
        <mesh position={[0, 0.451, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.004, 16]} />
          <Soft color="#7a4a35" />
        </mesh>
      </group>
    </group>
  );
}

export function HomeScene({ offsetX = 0, mobile = false }: { offsetX?: number; mobile?: boolean }) {
  const island = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (island.current) {
      island.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.12;
      island.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.12 - 0.35;
    }
  });
  return (
    <>
      <color attach="background" args={['#d7eef6']} />
      <fog attach="fog" args={['#d7eef6', 14, 30]} />
      <ambientLight intensity={0.8} color="#fff6ea" />
      <hemisphereLight args={['#ffffff', '#9fd0e0', 0.8]} />
      <directionalLight position={[5, 8, 5]} intensity={1.8} color="#fff1dc" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />

      <group position={[offsetX, 0, 0]}>
        <group ref={island}>
          <Island radius={2.3} top="#a4d68a" strata={['#e1b07e', '#c99467']} seed={4} topHeight={0.34} />
          <RoundTree position={[-1.2, 0, -1.0]} size={0.95} color="#9ad08a" />
          <Picnic position={[0.3, 0, 0.2]} rotation={[0, 0.2, 0]} />
          <Telescope position={[1.35, 0, 0.75]} />
          <Character look={LOOKS.haru} holding="wave" position={[-0.2, 0.05, 0.5]} rotation={[0, 0.35, 0]} phase={0} />
          <Character look={LOOKS.momo} pose="sit" holding="mug" position={[0.65, 0.07, -0.2]} rotation={[0, -0.6, 0]} phase={1.5} />
          {[[-1.5, 0.6], [-0.9, 1.6], [1.6, -0.5], [0.4, -1.5], [-1.7, -0.1]].map(([x, z], i) => (
            <Flower key={i} position={[x, 0, z]} petal={['#ffd1dc', '#fff2b3', '#d9ccff'][i % 3]} />
          ))}
          {[[1.0, 1.6], [-1.9, 0.9], [1.7, -1.1]].map(([x, z], i) => (
            <GrassTuft key={i} position={[x, 0, z]} />
          ))}
        </group>
      </group>

      {/* 바다 */}
      <mesh position={[0, -3.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 48]} />
        <Soft color="#9fd8ec" rough={0.3} />
      </mesh>
      <Sparkles count={60} scale={[24, 0.4, 16]} position={[0, -3, 0]} size={4} speed={0.3} color="#ffffff" />

      <Cloud position={[-4.8, 2.4, -2]} scale={1.1} />
      <Cloud position={[5.2, 3.2, -3]} scale={0.9} speed={0.3} />
      <Cloud position={[-3.2, -1.6, 2.5]} scale={0.8} speed={0.5} />
      <Cloud position={[4.4, -1.2, 2]} scale={0.7} />
      <Cloud position={[0.5, 4.5, -6]} scale={1.3} speed={0.2} />

      <CameraIntro position={mobile ? [0, 3.4, 10.5] : [0, 2.6, 8.4]} target={mobile ? [0, -1.9, 0] : [offsetX * 0.55, 0.6, 0]} duration={2.6} />
      <OrbitControls makeDefault enablePan={false} enableZoom={false} minPolarAngle={1.0} maxPolarAngle={1.45} minAzimuthAngle={-0.6} maxAzimuthAngle={0.6} enableDamping />
    </>
  );
}
