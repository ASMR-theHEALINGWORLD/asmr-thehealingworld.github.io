import { useFrame, type GroupProps } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../audio/AudioEngine';
import type { SfxKind } from '../types';
import { Soft, useEmojiPops, usePointer } from './common';

export type HairStyle = 'long' | 'bob' | 'short' | 'bun' | 'pigtail';
export type Pose = 'stand' | 'sit' | 'swim' | 'walk' | 'lie';
export type Holding = 'none' | 'marshmallow' | 'mug' | 'book' | 'teacup' | 'wave' | 'reach' | 'balloon';

export interface Look {
  skin?: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  bottom: string;
  bottomType?: 'skirt' | 'pants';
  shoes?: string;
  socks?: string;
  hat?: string;
}

/** 프리셋 — 메인 캐릭터와 친구들 */
export const LOOKS = {
  haru: { hair: '#4a3328', hairStyle: 'long', top: '#a9c4f5', bottom: '#fbf7f0', bottomType: 'skirt' },
  momo: { hair: '#f2c27b', hairStyle: 'bob', top: '#ffc2c7', bottom: '#8fb7a0', bottomType: 'pants' },
  toto: { hair: '#2f2a35', hairStyle: 'short', top: '#ffe08a', bottom: '#7f9cc4', bottomType: 'pants' },
  lulu: { hair: '#a8664a', hairStyle: 'bun', top: '#c9b6f2', bottom: '#f6e7d5', bottomType: 'skirt' },
  nana: { hair: '#5b3b30', hairStyle: 'pigtail', top: '#b9e3c6', bottom: '#f4b8a8', bottomType: 'skirt' },
} satisfies Record<string, Look>;

interface Props extends GroupProps {
  look: Look;
  pose?: Pose;
  holding?: Holding;
  snorkel?: boolean;
  /** 애니메이션 위상 (여러 캐릭터가 동시에 움직이지 않도록) */
  phase?: number;
  /** 탭 반응 이모지 */
  emojis?: string[];
  sfx?: SfxKind;
  onTap?: () => void;
  /** 바디 흔들림 크기 */
  sway?: number;
  /** 눈을 감고 잠든 상태 (머리 위로 Zzz) */
  sleepy?: boolean;
  balloonColor?: string;
}

const SKIN = '#ffdcc6';
const EYE = '#3a2a24';
const HIP_Y = 0.2;
const HEAD_Y = 0.82;
const HEAD_R = 0.34;

export function Character({
  look,
  pose = 'stand',
  holding = 'none',
  snorkel = false,
  phase = 0,
  emojis = ['💛', '✨', '🎵', '♡'],
  sfx = 'pop',
  onTap,
  sway = 1,
  sleepy = false,
  balloonColor = '#ffb3c8',
  ...props
}: Props) {
  const skin = look.skin ?? SKIN;
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const hop = useRef(-10);
  const nextBlink = useRef(1 + Math.random() * 3);
  const { push, node } = useEmojiPops();
  const { bind } = usePointer();

  const handleTap = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    hop.current = performance.now() / 1000;
    push(emojis[Math.floor(Math.random() * emojis.length)]);
    audioEngine.sfx(sfx, 0.4);
    onTap?.();
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    const now = performance.now() / 1000;
    // 점프 (탭 반응)
    const h = now - hop.current;
    if (root.current) {
      const k = h < 0.5 ? Math.sin((Math.PI * h) / 0.5) : 0;
      root.current.position.y = k * 0.32;
      const sq = h < 0.5 ? 1 + Math.sin((Math.PI * h) / 0.25) * 0.06 : 1;
      root.current.scale.set(2 - sq, sq, 2 - sq);
    }
    if (body.current) {
      const breathe = 1 + Math.sin(t * 2.2) * 0.012;
      body.current.scale.set(1, breathe, 1);
      body.current.rotation.z = Math.sin(t * 0.9) * 0.035 * sway;
      if (pose === 'walk') body.current.position.y = Math.abs(Math.sin(t * 8)) * 0.03;
      if (pose === 'swim') {
        body.current.position.y = Math.sin(t * 1.6) * 0.05;
        body.current.rotation.z = Math.sin(t * 1.2) * 0.12;
      }
    }
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 0.8) * 0.07 * sway;
      head.current.rotation.x = holding === 'book' ? 0.22 + Math.sin(t * 0.5) * 0.03 : Math.sin(t * 0.6) * 0.04;
      head.current.rotation.y = Math.sin(t * 0.45) * 0.12 * sway;
    }
    // 눈 깜빡임
    if (eyes.current) {
      if (t > nextBlink.current) nextBlink.current = t + 2.5 + Math.random() * 3.5;
      const d = nextBlink.current - t;
      eyes.current.scale.y = sleepy ? 1 : d < 0.12 ? 0.12 : 1;
    }
    // 팔
    const arm = (g: THREE.Group | null, s: 1 | -1) => {
      if (!g) return;
      let x = 0, z = s * 0.38 + Math.sin(t * 1.3) * 0.04 * s;
      if (holding === 'marshmallow' && s === -1) { x = -1.15 + Math.sin(t * 0.7) * 0.06; z = -0.1; }
      if ((holding === 'mug' || holding === 'teacup') && s === 1) { x = -1.25 + Math.sin(t * 0.8) * 0.12; z = 0.35; }
      if (holding === 'book') { x = -1.05; z = s * 0.45; }
      if (holding === 'wave' && s === -1) { x = 0; z = -2.5 + Math.sin(t * 6) * 0.3; }
      if (holding === 'balloon' && s === -1) { x = -0.2; z = -2.55 + Math.sin(t * 1.1) * 0.08; }
      if (pose === 'lie') { x = 0; z = s * (0.3 + Math.sin(t * 0.9) * 0.03); }
      if (holding === 'reach' && s === -1) { x = -2.5 + Math.sin(t * 1.2) * 0.2; z = -0.2; }
      if (pose === 'walk') x = Math.sin(t * 8 + (s > 0 ? 0 : Math.PI)) * 0.5;
      if (pose === 'swim') { x = -2.7 + Math.sin(t * 2 + (s > 0 ? 0 : 0.6)) * 0.35; z = s * 0.45; }
      g.rotation.x = x;
      g.rotation.z = z;
    };
    arm(armL.current, 1);
    arm(armR.current, -1);
    // 다리
    const leg = (g: THREE.Group | null, knee: THREE.Group | null, s: 1 | -1) => {
      if (!g || !knee) return;
      if (pose === 'sit') {
        g.rotation.x = -Math.PI / 2;
        knee.rotation.x = Math.PI / 2 - 0.15 + Math.sin(t * 1.8 + (s > 0 ? 0 : 1.5)) * 0.15;
      } else if (pose === 'walk') {
        g.rotation.x = Math.sin(t * 8 + (s > 0 ? Math.PI : 0)) * 0.55;
        knee.rotation.x = Math.max(0, Math.sin(t * 8 + (s > 0 ? Math.PI : 0) - 1)) * 0.6;
      } else if (pose === 'swim') {
        g.rotation.x = Math.sin(t * 5 + (s > 0 ? 0 : Math.PI)) * 0.4;
        knee.rotation.x = 0.2;
      } else if (pose === 'lie') {
        g.rotation.x = s > 0 ? 0 : -0.25;
        knee.rotation.x = s > 0 ? 0 : 0.5;
      } else {
        g.rotation.x = 0;
        knee.rotation.x = 0;
      }
    };
    leg(legL.current, kneeL.current, 1);
    leg(legR.current, kneeR.current, -1);
  });

  const hairMat = useMemo(() => <Soft color={look.hair} rough={0.95} side={THREE.DoubleSide} />, [look.hair]);
  const sitOffset = pose === 'sit' ? -HIP_Y : 0;
  const swimRot: [number, number, number] = pose === 'swim' ? [Math.PI / 3.1, 0, 0] : pose === 'lie' ? [-Math.PI / 2, 0, 0] : [0, 0, 0];
  const lieLift = pose === 'lie' ? 0.24 : 0;

  return (
    <group {...props}>
      <group ref={root}>
        <group position={[0, sitOffset + lieLift + (pose === 'swim' ? 0.5 : 0), 0]} rotation={swimRot}>
          <group position={[0, pose === 'swim' ? -0.5 : 0, 0]}>
            <group ref={body} onClick={handleTap} {...bind}>
              {/* 몸통 */}
              <mesh position={[0, 0.36, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.2, 0.3, 24]} />
                <Soft color={look.top} rough={1} />
              </mesh>
              <mesh position={[0, 0.215, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.195, 0.03, 10, 28]} />
                <Soft color={look.top} rough={1} />
              </mesh>
              {look.bottomType === 'pants' ? (
                <mesh position={[0, 0.19, 0]} castShadow>
                  <cylinderGeometry args={[0.2, 0.21, 0.09, 24]} />
                  <Soft color={look.bottom} />
                </mesh>
              ) : (
                <mesh position={[0, 0.18, 0]} castShadow>
                  <cylinderGeometry args={[0.19, 0.28, 0.13, 24]} />
                  <Soft color={look.bottom} />
                </mesh>
              )}

              {/* 다리 */}
              {([1, -1] as const).map((s) => (
                <group key={s} ref={s > 0 ? legL : legR} position={[s * 0.08, HIP_Y, 0]}>
                  <mesh position={[0, -0.045, 0]}>
                    <capsuleGeometry args={[0.058, 0.05, 6, 12]} />
                    <Soft color={look.bottomType === 'pants' ? look.bottom : skin} />
                  </mesh>
                  <group ref={s > 0 ? kneeL : kneeR} position={[0, -0.09, 0]}>
                    <mesh position={[0, -0.02, 0]}>
                      <capsuleGeometry args={[0.057, 0.04, 6, 12]} />
                      <Soft color={look.socks ?? '#ffffff'} rough={1} />
                    </mesh>
                    <mesh position={[0, -0.065, 0.03]} scale={[0.075, 0.045, 0.1]} castShadow>
                      <sphereGeometry args={[1, 18, 14]} />
                      <Soft color={look.shoes ?? '#fffaf4'} rough={0.6} />
                    </mesh>
                  </group>
                </group>
              ))}

              {/* 팔 */}
              {([1, -1] as const).map((s) => (
                <group key={s} ref={s > 0 ? armL : armR} position={[s * 0.16, 0.46, 0]} rotation={[0, 0, s * 0.38]}>
                  <mesh position={[0, -0.09, 0]} castShadow>
                    <capsuleGeometry args={[0.055, 0.11, 6, 12]} />
                    <Soft color={look.top} rough={1} />
                  </mesh>
                  <mesh position={[0, -0.2, 0]}>
                    <sphereGeometry args={[0.062, 16, 12]} />
                    <Soft color={skin} />
                  </mesh>
                  {s === -1 && holding === 'balloon' && (
                    <group position={[0, -0.22, 0]}>
                      <mesh position={[0, -0.42, 0]}>
                        <cylinderGeometry args={[0.005, 0.005, 0.84, 4]} />
                        <Soft color="#ffffff" />
                      </mesh>
                      <mesh position={[0, -1.04, 0]} scale={[1, 1.15, 1]} castShadow>
                        <sphereGeometry args={[0.22, 24, 18]} />
                        <Soft color={balloonColor} rough={0.35} />
                      </mesh>
                      <mesh position={[0, -0.82, 0]}>
                        <coneGeometry args={[0.03, 0.05, 8]} />
                        <Soft color={balloonColor} />
                      </mesh>
                    </group>
                  )}
                  {s === -1 && holding === 'marshmallow' && (
                    <group position={[0, -0.22, 0]}>
                      <mesh position={[0, -0.45, 0]}>
                        <cylinderGeometry args={[0.012, 0.012, 0.9, 6]} />
                        <Soft color="#a8784e" />
                      </mesh>
                      <mesh position={[0, -0.86, 0]}>
                        <cylinderGeometry args={[0.055, 0.055, 0.09, 16]} />
                        <Soft color="#ffe9cf" emissive="#ff9a4d" emissiveIntensity={0.25} />
                      </mesh>
                    </group>
                  )}
                  {s === 1 && (holding === 'mug' || holding === 'teacup') && (
                    <group position={[0, -0.25, 0.03]} rotation={[1.25, 0, -0.35]}>
                      {holding === 'mug' ? (
                        <>
                          <mesh>
                            <cylinderGeometry args={[0.06, 0.055, 0.11, 18]} />
                            <Soft color="#ff9f9f" rough={0.5} />
                          </mesh>
                          <mesh position={[0, 0.056, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 0.005, 18]} />
                            <Soft color="#7a4a35" />
                          </mesh>
                        </>
                      ) : (
                        <>
                          <mesh>
                            <cylinderGeometry args={[0.065, 0.04, 0.06, 18]} />
                            <Soft color="#fffaf3" rough={0.35} />
                          </mesh>
                          <mesh position={[0, 0.026, 0]}>
                            <cylinderGeometry args={[0.058, 0.058, 0.004, 18]} />
                            <Soft color="#c98d55" />
                          </mesh>
                        </>
                      )}
                    </group>
                  )}
                </group>
              ))}

              {holding === 'book' && (
                <group position={[0, 0.42, 0.27]} rotation={[-0.55, 0, 0]}>
                  {([1, -1] as const).map((s) => (
                    <group key={s} rotation={[0, s * -0.32, 0]}>
                      <mesh position={[s * 0.09, 0, 0]}>
                        <boxGeometry args={[0.18, 0.22, 0.012]} />
                        <Soft color="#fff8ec" />
                      </mesh>
                      <mesh position={[s * 0.09, 0, -0.01]}>
                        <boxGeometry args={[0.19, 0.23, 0.012]} />
                        <Soft color="#e98a7b" />
                      </mesh>
                    </group>
                  ))}
                </group>
              )}

              {/* 머리 */}
              <group ref={head} position={[0, 0.5, 0]}>
                <group position={[0, -0.5, 0]}>
                  <mesh position={[0, HEAD_Y, 0]} castShadow>
                    <sphereGeometry args={[HEAD_R, 40, 32]} />
                    <Soft color={skin} rough={0.9} />
                  </mesh>
                  {/* 귀 */}
                  {[1, -1].map((s) => (
                    <mesh key={s} position={[s * 0.33, HEAD_Y - 0.02, 0]} scale={[0.7, 1, 0.9]}>
                      <sphereGeometry args={[0.07, 14, 12]} />
                      <Soft color={skin} />
                    </mesh>
                  ))}
                  {/* 눈 */}
                  <group ref={eyes} position={[0, HEAD_Y - 0.02, 0]}>
                    {sleepy && [1, -1].map((s) => (
                      <mesh key={s} position={[s * 0.12, -0.01, 0.318]} rotation={[-0.1, s * 0.36, Math.PI]}>
                        <torusGeometry args={[0.04, 0.009, 6, 14, Math.PI]} />
                        <meshBasicMaterial color={EYE} />
                      </mesh>
                    ))}
                    {!sleepy && [1, -1].map((s) => (
                      <group key={s} position={[s * 0.12, 0, 0.312]} rotation={[0, s * 0.36, 0]}>
                        <mesh scale={[0.048, 0.064, 0.022]}>
                          <sphereGeometry args={[1, 16, 12]} />
                          <meshStandardMaterial color={EYE} roughness={0.4} />
                        </mesh>
                        <mesh position={[0.012, 0.022, 0.018]}>
                          <sphereGeometry args={[0.014, 8, 8]} />
                          <meshBasicMaterial color="#ffffff" />
                        </mesh>
                      </group>
                    ))}
                  </group>
                  {/* 볼터치 */}
                  {[1, -1].map((s) => (
                    <mesh key={s} position={[s * 0.2, HEAD_Y - 0.1, 0.255]} rotation={[0, s * 0.68, 0]} scale={[0.06, 0.038, 0.012]}>
                      <sphereGeometry args={[1, 16, 10]} />
                      <meshBasicMaterial color="#ffb2a2" transparent opacity={0.75} />
                    </mesh>
                  ))}
                  {/* 코 & 입 */}
                  <mesh position={[0, HEAD_Y - 0.055, 0.335]}>
                    <sphereGeometry args={[0.024, 12, 10]} />
                    <Soft color="#f5a07f" />
                  </mesh>
                  <mesh position={[0, HEAD_Y - 0.11, 0.318]} rotation={[-0.2, 0, Math.PI]}>
                    <torusGeometry args={[0.038, 0.008, 6, 16, Math.PI]} />
                    <meshBasicMaterial color="#6b3b2e" />
                  </mesh>

                  {/* 머리카락 */}
                  <group position={[0, HEAD_Y, 0]}>
                    <mesh rotation={[-0.12, 0, 0]}>
                      <sphereGeometry args={[HEAD_R + 0.025, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.43]} />
                      {hairMat}
                    </mesh>
                    <mesh>
                      <sphereGeometry args={[HEAD_R + 0.022, 40, 24, Math.PI, Math.PI, 0, look.hairStyle === 'short' ? Math.PI * 0.62 : Math.PI * 0.72]} />
                      {hairMat}
                    </mesh>
                    {/* 앞머리 가닥 */}
                    {[-0.17, -0.06, 0.06, 0.17].map((x, i) => (
                      <mesh key={i} position={[x, 0.12 - Math.abs(x) * 0.2, Math.sqrt(0.34 ** 2 - x * x - (0.12 - Math.abs(x) * 0.2) ** 2)]} rotation={[0.5, 0, x * -1.2]} scale={[0.075, 0.07, 0.04]}>
                        <sphereGeometry args={[1, 14, 10]} />
                        {hairMat}
                      </mesh>
                    ))}
                    {look.hairStyle === 'long' && (
                      <>
                        <mesh position={[0, -0.27, -0.12]} scale={[0.36, 0.36, 0.2]}>
                          <sphereGeometry args={[1, 28, 20]} />
                          {hairMat}
                        </mesh>
                        {[1, -1].map((s) => (
                          <mesh key={s} position={[s * 0.3, -0.2, 0.04]} scale={[0.085, 0.24, 0.1]} rotation={[0, 0, s * 0.08]}>
                            <sphereGeometry args={[1, 16, 14]} />
                            {hairMat}
                          </mesh>
                        ))}
                      </>
                    )}
                    {look.hairStyle === 'bob' && (
                      <>
                        <mesh position={[0, -0.16, -0.08]} scale={[0.385, 0.2, 0.25]}>
                          <sphereGeometry args={[1, 28, 18]} />
                          {hairMat}
                        </mesh>
                        {[1, -1].map((s) => (
                          <mesh key={s} position={[s * 0.31, -0.13, 0.05]} scale={[0.08, 0.14, 0.1]}>
                            <sphereGeometry args={[1, 14, 12]} />
                            {hairMat}
                          </mesh>
                        ))}
                      </>
                    )}
                    {look.hairStyle === 'bun' && (
                      <mesh position={[0, 0.36, -0.06]}>
                        <sphereGeometry args={[0.12, 18, 14]} />
                        {hairMat}
                      </mesh>
                    )}
                    {look.hairStyle === 'pigtail' &&
                      [1, -1].map((s) => (
                        <mesh key={s} position={[s * 0.37, -0.12, -0.08]} scale={[0.1, 0.17, 0.1]} rotation={[0, 0, s * 0.25]}>
                          <sphereGeometry args={[1, 16, 14]} />
                          {hairMat}
                        </mesh>
                      ))}
                  </group>

                  {look.hat && (
                    <group position={[0, HEAD_Y + 0.27, -0.02]} rotation={[-0.15, 0, 0.12]}>
                      <mesh scale={[1, 0.32, 1]}>
                        <sphereGeometry args={[0.3, 24, 14]} />
                        <Soft color={look.hat} rough={1} />
                      </mesh>
                      <mesh position={[0, 0.1, 0]}>
                        <sphereGeometry args={[0.03, 10, 8]} />
                        <Soft color={look.hat} />
                      </mesh>
                    </group>
                  )}

                  {snorkel && (
                    <group position={[0, HEAD_Y, 0]}>
                      <mesh position={[0, 0.0, 0.31]} scale={[0.26, 0.12, 0.07]}>
                        <sphereGeometry args={[1, 24, 16]} />
                        <meshStandardMaterial color="#c8f3ff" transparent opacity={0.45} roughness={0.1} />
                      </mesh>
                      <mesh position={[0, 0, 0.3]} scale={[1, 0.48, 1]}>
                        <torusGeometry args={[0.24, 0.026, 8, 30]} />
                        <Soft color="#ff8fa3" rough={0.5} />
                      </mesh>
                      <mesh rotation={[Math.PI / 2 - 0.1, 0, 0]}>
                        <torusGeometry args={[HEAD_R + 0.03, 0.022, 8, 40]} />
                        <Soft color="#ff8fa3" rough={0.5} />
                      </mesh>
                      <mesh position={[0.34, 0.12, 0.08]} rotation={[0.15, 0, -0.1]}>
                        <cylinderGeometry args={[0.022, 0.022, 0.42, 10]} />
                        <Soft color="#ffd36e" rough={0.4} />
                      </mesh>
                      <mesh position={[0.36, 0.34, 0.11]}>
                        <sphereGeometry args={[0.035, 10, 8]} />
                        <Soft color="#ff9f6e" />
                      </mesh>
                    </group>
                  )}
                </group>
              </group>
            </group>
          </group>
        </group>
        {node(pose === 'sit' ? 1.05 : pose === 'lie' ? 0.9 : 1.35)}
        {sleepy && (
          <Html position={pose === 'lie' ? [0.15, 0.75, -0.75] : [0.25, 1.25, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <div className="zzz">
              <i>z</i>
              <i>z</i>
              <i>Z</i>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
