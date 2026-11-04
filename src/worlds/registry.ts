import type { FC } from 'react';
import type { HiddenKind } from '../three/HiddenFind';
import type { AvatarSpot } from '../three/MyAvatar';
import { BookstoreDiorama, BookstoreEnvironment } from './BookstoreWorld';
import { CampfireDiorama, CampfireEnvironment } from './CampfireWorld';
import { CloudDiorama, CloudEnvironment } from './CloudWorld';
import { MossDiorama, MossEnvironment } from './MossWorld';
import { StationDiorama, StationEnvironment } from './StationWorld';
import { OceanDiorama, OceanEnvironment } from './OceanWorld';

export interface DioramaProps {
  /** 월드맵 등 작은 미리보기에서 디테일을 줄일 때 */
  lite?: boolean;
}

export interface WorldScene {
  /** 공간 자체 (섬/방 + 캐릭터 + 오브젝트) */
  Diorama: FC<DioramaProps>;
  /** 배경, 조명, 안개 등 상세 화면 전용 분위기 */
  Environment: FC;
  /** 월드맵에서의 스케일 */
  mapScale: number;
  /** 월드맵에서 유리 돔으로 감쌀지 (바닷속 등) */
  dome?: string;
  /** 내 캐릭터가 서 있을 자리 */
  avatar: AvatarSpot;
  /** 숨은 친구 */
  hidden: { kind: HiddenKind; position: [number, number, number]; rotation?: number };
  /** 물속 월드 (계절 효과를 바다 눈으로) */
  underwater?: boolean;
}

/**
 * 월드 id → 3D 씬 매핑.
 * 새 월드를 추가하면 여기 한 줄만 등록하면 됩니다.
 */
export const WORLD_SCENES: Record<string, WorldScene> = {
  campfire: {
    Diorama: CampfireDiorama,
    Environment: CampfireEnvironment,
    mapScale: 0.4,
    avatar: { position: [1.6, 0, 2.2], rotation: 0.2, holding: 'wave' },
    hidden: { kind: 'hedgehog', position: [-3.0, 0, 0.35], rotation: 0.9 },
  },
  ocean: {
    Diorama: OceanDiorama,
    Environment: OceanEnvironment,
    mapScale: 0.4,
    dome: '#9fdcf5',
    underwater: true,
    avatar: { position: [-1.3, 0, 1.7], rotation: 0.4, holding: 'wave', snorkel: true },
    hidden: { kind: 'chest', position: [2.9, 0, 1.8], rotation: -0.7 },
  },
  bookstore: {
    Diorama: BookstoreDiorama,
    Environment: BookstoreEnvironment,
    mapScale: 0.38,
    avatar: { position: [2.0, 0, 1.3], rotation: -0.5, holding: 'book' },
    hidden: { kind: 'mouse', position: [-2.7, 0, 2.5], rotation: 0.7 },
  },
  cloud: {
    Diorama: CloudDiorama,
    Environment: CloudEnvironment,
    mapScale: 0.4,
    avatar: { position: [-2.3, -0.1, 1.5], rotation: 0.6, holding: 'wave' },
    hidden: { kind: 'star', position: [3.2, -0.05, 1.3], rotation: -0.6 },
  },
  moss: {
    Diorama: MossDiorama,
    Environment: MossEnvironment,
    mapScale: 0.4,
    avatar: { position: [-2.1, 0, 0.9], rotation: 0.5, holding: 'wave' },
    hidden: { kind: 'snail', position: [2.45, 0, 1.6], rotation: -0.4 },
  },
  station: {
    Diorama: StationDiorama,
    Environment: StationEnvironment,
    mapScale: 0.36,
    avatar: { position: [-0.75, 0.5, -0.4], rotation: 0.2, holding: 'mug' },
    hidden: { kind: 'umbrella', position: [3.55, 0.5, 1.3], rotation: -0.5 },
  },
};
