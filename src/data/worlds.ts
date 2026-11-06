import type { WorldDef } from '../types';

/**
 * 월드 데이터.
 * 새 월드를 추가하려면:
 *  1) 여기에 WorldDef 를 추가하고
 *  2) src/worlds/ 에 Diorama/Environment 컴포넌트를 만든 뒤
 *  3) src/worlds/registry.ts 에 등록하면 됩니다.
 * 사운드 파일은 public/sounds/<worldId>/<soundId>.mp3 에 넣으면 자동으로 사용됩니다.
 */
export const WORLDS: WorldDef[] = [
  {
    id: 'campfire',
    no: '01',
    title: '별빛 아래 모닥불',
    englishTitle: 'Campfire under the Stars',
    tagline: '타닥타닥, 불멍하며 마시멜로 굽는 밤',
    description:
      '깊은 숲속, 커다란 모닥불이 타오르는 아늑한 캠핑장. 친구들과 둘러앉아 불꽃을 바라보며 따뜻한 밤을 보내요.',
    moods: ['따뜻함', '포근함', '아늑함', '안정감'],
    hint: '모닥불과 친구들을 톡 눌러보세요',
    theme: {
      background: '#1b2340',
      panel: 'rgba(32, 38, 68, 0.62)',
      panelBorder: 'rgba(255, 220, 180, 0.16)',
      text: '#fff3e4',
      subText: 'rgba(255, 236, 214, 0.66)',
      accent: '#ffb36b',
      accentSoft: 'rgba(255, 179, 107, 0.22)',
      gradient: ['#2b3463', '#f6a873'],
      dark: true,
    },
    camera: { position: [0, 6.4, 12.2], target: [0, 0.4, 0] },
    sounds: [
      { id: 'crackle', name: '장작 타는 소리', icon: '🔥', src: 'sounds/campfire/crackle.mp3', synth: 'fireCrackle', defaultVolume: 0.75, defaultOn: true },
      { id: 'sparks', name: '불꽃 튀는 소리', icon: '✨', src: 'sounds/campfire/sparks.mp3', synth: 'fireSparks', defaultVolume: 0.4, defaultOn: true },
      { id: 'crickets', name: '밤 풀벌레 소리', icon: '🦗', src: 'sounds/campfire/crickets.mp3', synth: 'crickets', defaultVolume: 0.35, defaultOn: true },
      { id: 'wind', name: '나뭇잎 스치는 바람 소리', icon: '🍃', src: 'sounds/campfire/wind.mp3', synth: 'windLeaves', defaultVolume: 0.4, defaultOn: false },
      { id: 'log', name: '장작 넣는 소리', icon: '🪵', src: 'sounds/campfire/log.mp3', synth: 'logDrop', defaultVolume: 0.5, defaultOn: false },
    ],
  },
  {
    id: 'ocean',
    no: '02',
    title: '파란빛이 머무는 바닷속',
    englishTitle: 'Where the Blue Light Stays',
    tagline: '보글보글, 물고기와 함께 떠다니는 시간',
    description:
      '푸른 바닷속 깊은 곳의 신비로운 해저 세계. 스노클링을 하며 물고기와 놀고 산호초 사이를 천천히 헤엄쳐요.',
    moods: ['신비로움', '고요함', '청량함', '몽환적'],
    hint: '물고기와 해파리를 톡 눌러보세요',
    theme: {
      background: '#3f9cc6',
      panel: 'rgba(230, 248, 255, 0.55)',
      panelBorder: 'rgba(255, 255, 255, 0.55)',
      text: '#1f4a63',
      subText: 'rgba(31, 74, 99, 0.62)',
      accent: '#3aa7d6',
      accentSoft: 'rgba(58, 167, 214, 0.18)',
      gradient: ['#8fd6f0', '#3f8fc4'],
      dark: false,
    },
    camera: { position: [0, 4.6, 12.4], target: [0, 1.3, 0] },
    sounds: [
      { id: 'deep', name: '깊은 바닷속 울림 소리', icon: '🌊', src: 'sounds/ocean/deep.mp3', synth: 'deepHum', defaultVolume: 0.65, defaultOn: true },
      { id: 'bubbles', name: '보글보글 공기방울 소리', icon: '🫧', src: 'sounds/ocean/bubbles.mp3', synth: 'bubbles', defaultVolume: 0.5, defaultOn: true },
      { id: 'waves', name: '잔잔한 물결 소리', icon: '💧', src: 'sounds/ocean/waves.mp3', synth: 'gentleWaves', defaultVolume: 0.45, defaultOn: true },
      { id: 'whale', name: '멀리서 고래가 노래하는 소리', icon: '🐋', src: 'sounds/ocean/whale.mp3', synth: 'whaleSong', defaultVolume: 0.45, defaultOn: false },
      { id: 'fish', name: '물고기가 물을 가르는 소리', icon: '🐟', src: 'sounds/ocean/fish.mp3', synth: 'fishSwish', defaultVolume: 0.35, defaultOn: false },
    ],
  },
  {
    id: 'bookstore',
    no: '03',
    title: '오후 네 시의 작은 서점',
    englishTitle: 'A Little Bookshop at 4 PM',
    tagline: '사각사각, 빗소리와 함께 책장을 넘기는 오후',
    description:
      '골목 한편의 작고 아늑한 동네 서점. 창가에 앉아 차를 마시고, 좋아하는 책을 천천히 넘기며 여유를 즐겨요.',
    moods: ['차분함', '따뜻함', '평온함', '집중력'],
    hint: '책장의 책과 낮잠 자는 고양이를 눌러보세요',
    theme: {
      background: '#f3dfca',
      panel: 'rgba(255, 249, 240, 0.66)',
      panelBorder: 'rgba(160, 110, 70, 0.14)',
      text: '#5a4032',
      subText: 'rgba(90, 64, 50, 0.6)',
      accent: '#d98f5c',
      accentSoft: 'rgba(217, 143, 92, 0.18)',
      gradient: ['#ffe2c4', '#c99a7a'],
      dark: false,
    },
    camera: { position: [5.4, 5.6, 10.8], target: [-0.2, 1.2, -0.4] },
    sounds: [
      { id: 'rain', name: '창밖 빗소리', icon: '🌧️', src: 'sounds/bookstore/rain.mp3', synth: 'rain', defaultVolume: 0.55, defaultOn: true },
      { id: 'page', name: '책장 넘기는 소리', icon: '📖', src: 'sounds/bookstore/page.mp3', synth: 'pageTurn', defaultVolume: 0.55, defaultOn: true },
      { id: 'pencil', name: '연필로 사각사각 쓰는 소리', icon: '✏️', src: 'sounds/bookstore/pencil.mp3', synth: 'pencil', defaultVolume: 0.4, defaultOn: false },
      { id: 'teacup', name: '찻잔 내려놓는 소리', icon: '🍵', src: 'sounds/bookstore/teacup.mp3', synth: 'teacup', defaultVolume: 0.4, defaultOn: true },
      { id: 'shelf', name: '책 꺼내고 꽂는 소리', icon: '📚', src: 'sounds/bookstore/shelf.mp3', synth: 'bookShelf', defaultVolume: 0.4, defaultOn: false },
      { id: 'steps', name: '나무 바닥 발소리', icon: '👣', src: 'sounds/bookstore/steps.mp3', synth: 'footsteps', defaultVolume: 0.35, defaultOn: false },
    ],
  },
  {
    id: 'cloud',
    no: '04',
    title: '구름 위 낮잠 정거장',
    englishTitle: 'Nap Stop above the Clouds',
    tagline: '살랑살랑, 구름 침대에서 스르르 낮잠',
    description:
      '하늘 위에 떠 있는 작은 구름 섬. 폭신한 구름 침대에 누워 낮잠을 자거나, 구름 사이를 둥둥 떠다니며 쉬어가요.',
    moods: ['가벼움', '포근함', '몽환적', '해방감'],
    hint: '윈드차임과 날아다니는 새를 톡 눌러보세요',
    theme: {
      background: '#d3e2fa',
      panel: 'rgba(255, 255, 255, 0.6)',
      panelBorder: 'rgba(255, 255, 255, 0.75)',
      text: '#4c5280',
      subText: 'rgba(76, 82, 128, 0.62)',
      accent: '#8b9cf0',
      accentSoft: 'rgba(139, 156, 240, 0.18)',
      gradient: ['#e9eeff', '#b8c6f7'],
      dark: false,
    },
    camera: { position: [0, 5.6, 12.4], target: [0, 0.7, 0] },
    sounds: [
      { id: 'wind', name: '높은 하늘 바람 소리', icon: '🌬️', src: 'sounds/cloud/wind.mp3', synth: 'skyWind', defaultVolume: 0.55, defaultOn: true },
      { id: 'chime', name: '은은한 윈드차임 소리', icon: '🎐', src: 'sounds/cloud/chime.mp3', synth: 'windChime', defaultVolume: 0.4, defaultOn: true },
      { id: 'birds', name: '구름 사이 작은 새소리', icon: '🐦', src: 'sounds/cloud/birds.mp3', synth: 'birds', defaultVolume: 0.35, defaultOn: true },
      { id: 'cloth', name: '바람에 천 펄럭이는 소리', icon: '🏳️', src: 'sounds/cloud/cloth.mp3', synth: 'clothFlap', defaultVolume: 0.35, defaultOn: false },
      { id: 'bell', name: '멀리서 들리는 종소리', icon: '🔔', src: 'sounds/cloud/bell.mp3', synth: 'distantBell', defaultVolume: 0.35, defaultOn: false },
    ],
  },
  {
    id: 'moss',
    no: '05',
    title: '비밀의 이끼 정원',
    englishTitle: 'The Secret Moss Garden',
    tagline: '바스락, 요정들이 사는 숲속 정원',
    description:
      '커다란 나무와 버섯 집이 가득한 신비로운 숲속 정원. 요정과 동물 친구들이 풀밭을 거닐고, 그루터기에 앉아 숲의 소리를 들어요.',
    moods: ['자연 친화적', '평온함', '신비로움', '안정감'],
    hint: '요정과 토끼, 딱따구리를 톡 눌러보세요',
    theme: {
      background: '#c5dcc0',
      panel: 'rgba(248, 255, 244, 0.62)',
      panelBorder: 'rgba(255, 255, 255, 0.6)',
      text: '#3f5a3c',
      subText: 'rgba(63, 90, 60, 0.62)',
      accent: '#6aa363',
      accentSoft: 'rgba(106, 163, 99, 0.18)',
      gradient: ['#dcebd2', '#7fae74'],
      dark: false,
    },
    camera: { position: [1.2, 6.4, 13.6], target: [0, 1.1, 0] },
    sounds: [
      { id: 'leaves', name: '바스락 나뭇잎 소리', icon: '🍂', src: 'sounds/moss/leaves.mp3', synth: 'leafRustle', defaultVolume: 0.5, defaultOn: true },
      { id: 'crickets', name: '풀벌레와 귀뚜라미 소리', icon: '🦗', src: 'sounds/moss/crickets.mp3', synth: 'crickets', defaultVolume: 0.3, defaultOn: true },
      { id: 'woodpecker', name: '딱따구리가 나무 두드리는 소리', icon: '🪵', src: 'sounds/moss/woodpecker.mp3', synth: 'woodpecker', defaultVolume: 0.35, defaultOn: false },
      { id: 'birds', name: '작은 새들이 지저귀는 소리', icon: '🐤', src: 'sounds/moss/birds.mp3', synth: 'songbirds', defaultVolume: 0.4, defaultOn: true },
      { id: 'steps', name: '사박사박 풀밭 발소리', icon: '👣', src: 'sounds/moss/steps.mp3', synth: 'grassSteps', defaultVolume: 0.35, defaultOn: false },
      { id: 'bamboo', name: '대나무 풍경 소리', icon: '🎋', src: 'sounds/moss/bamboo.mp3', synth: 'bambooChime', defaultVolume: 0.4, defaultOn: false },
    ],
  },
  {
    id: 'station',
    no: '06',
    title: '달빛 기차역',
    englishTitle: 'Moonlight Station',
    tagline: '덜컹덜컹, 모두가 잠든 새벽의 작은 역',
    description:
      '모두가 잠든 새벽, 달빛 아래 조용히 운행하는 작은 기차역. 플랫폼 벤치에서 기차를 기다리거나 창가 좌석에서 밤 풍경을 바라봐요.',
    moods: ['고요함', '아늑함', '향수', '혼자만의 시간'],
    hint: '기차와 역 시계를 톡 눌러보세요',
    theme: {
      background: '#232a55',
      panel: 'rgba(36, 42, 84, 0.62)',
      panelBorder: 'rgba(200, 210, 255, 0.16)',
      text: '#eef0ff',
      subText: 'rgba(225, 230, 255, 0.62)',
      accent: '#ffd27a',
      accentSoft: 'rgba(255, 210, 122, 0.2)',
      gradient: ['#2b3266', '#ffd27a'],
      dark: true,
    },
    camera: { position: [2.8, 7.2, 15.2], target: [0.3, 0.6, -0.6] },
    sounds: [
      { id: 'train', name: '멀리서 달리는 기차 소리', icon: '🚂', src: 'sounds/station/train.mp3', synth: 'trainRumble', defaultVolume: 0.5, defaultOn: true },
      { id: 'rail', name: '덜컹덜컹 철로 소리', icon: '🛤️', src: 'sounds/station/rail.mp3', synth: 'railClack', defaultVolume: 0.4, defaultOn: true },
      { id: 'clock', name: '역 시계 똑딱똑딱 소리', icon: '🕰️', src: 'sounds/station/clock.mp3', synth: 'clockTick', defaultVolume: 0.35, defaultOn: true },
      { id: 'steps', name: '조용한 플랫폼 발소리', icon: '👞', src: 'sounds/station/steps.mp3', synth: 'platformSteps', defaultVolume: 0.3, defaultOn: false },
      { id: 'announce', name: '희미한 안내 방송 소리', icon: '📢', src: 'sounds/station/announce.mp3', synth: 'announcement', defaultVolume: 0.3, defaultOn: false },
      { id: 'door', name: '기차 문 열리고 닫히는 소리', icon: '🚪', src: 'sounds/station/door.mp3', synth: 'trainDoor', defaultVolume: 0.35, defaultOn: false },
    ],
  },
];

export const getWorld = (id: string) => WORLDS.find((w) => w.id === id);
export const getWorldIndex = (id: string) => WORLDS.findIndex((w) => w.id === id);
