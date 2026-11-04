import { Html } from '@react-three/drei';
import { useUser } from '../store/userStore';
import { Character, type Holding } from './Character';

export interface AvatarSpot {
  position: [number, number, number];
  rotation?: number;
  holding?: Holding;
  snorkel?: boolean;
}

/** 마이 힐링에서 꾸민 '내 캐릭터'가 월드에 함께 등장해요 */
export function MyAvatar({ spot }: { spot: AvatarSpot }) {
  const a = useUser((u) => u.avatar);
  if (!a.enabled) return null;
  return (
    <group position={spot.position} rotation={[0, spot.rotation ?? 0, 0]}>
      <Character
        look={{ hair: a.hair, hairStyle: a.hairStyle, top: a.top, bottom: a.bottom, bottomType: a.bottomType }}
        holding={spot.holding ?? 'wave'}
        snorkel={spot.snorkel}
        phase={0.7}
        emojis={['💛', '😊', '✨']}
      />
      <Html position={[0, 1.42, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
        <span className="me-tag">나</span>
      </Html>
    </group>
  );
}
