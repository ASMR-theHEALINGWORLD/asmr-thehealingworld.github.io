import type { FC } from 'react';
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
}

/**
 * 월드 id → 3D 씬 매핑.
 * 새 월드를 추가하면 여기 한 줄만 등록하면 됩니다.
 */
export const WORLD_SCENES: Record<string, WorldScene> = {
  campfire: { Diorama: CampfireDiorama, Environment: CampfireEnvironment, mapScale: 0.4 },
  ocean: { Diorama: OceanDiorama, Environment: OceanEnvironment, mapScale: 0.4, dome: '#9fdcf5' },
  bookstore: { Diorama: BookstoreDiorama, Environment: BookstoreEnvironment, mapScale: 0.38 },
  cloud: { Diorama: CloudDiorama, Environment: CloudEnvironment, mapScale: 0.4 },
  moss: { Diorama: MossDiorama, Environment: MossEnvironment, mapScale: 0.4 },
  station: { Diorama: StationDiorama, Environment: StationEnvironment, mapScale: 0.36 },
};
