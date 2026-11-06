/** 절차적(Web Audio) 사운드 생성기 종류 — 실제 음원이 없을 때의 대체 사운드 */
export type SynthKind =
  | 'fireCrackle' | 'fireSparks' | 'crickets' | 'windLeaves' | 'logDrop'
  | 'deepHum' | 'bubbles' | 'gentleWaves' | 'whaleSong' | 'fishSwish'
  | 'pageTurn' | 'bookShelf' | 'pencil' | 'teacup' | 'rain' | 'footsteps'
  | 'skyWind' | 'windChime' | 'birds' | 'clothFlap' | 'distantBell'
  | 'leafRustle' | 'woodpecker' | 'songbirds' | 'grassSteps' | 'bambooChime'
  | 'trainRumble' | 'railClack' | 'clockTick' | 'platformSteps' | 'announcement' | 'trainDoor';

/** 인터랙션용 짧은 효과음 */
export type SfxKind = 'pop' | 'chime' | 'bubble' | 'log' | 'book' | 'splash' | 'tweet' | 'whistle' | 'honk' | 'meow' | 'nyang' | 'jelly' | 'sparkle' | 'whale' | 'vending'
  | 'tick' | 'sniff' | 'squeak' | 'coin' | 'treasure' | 'slime' | 'umbrella';

export interface SoundDef {
  id: string;
  name: string;
  icon: string;
  /** 실제 음원 경로 (public/ 기준). 파일이 없으면 synth 로 자동 대체 */
  src: string;
  synth: SynthKind;
  defaultVolume: number; // 0~1
  defaultOn: boolean;
}

export interface WorldTheme {
  /** 배경/포그 */
  background: string;
  /** UI 패널 */
  panel: string;
  panelBorder: string;
  text: string;
  subText: string;
  accent: string;
  accentSoft: string;
  /** 월드 카드 그라디언트 */
  gradient: [string, string];
  dark: boolean;
}

export interface WorldDef {
  id: string;
  no: string;
  title: string;
  englishTitle: string;
  /** 짧은 소개. 줄을 바꾸고 싶은 곳에 \n 을 넣으면 그 자리에서 줄바꿈돼요 */
  tagline: string;
  description: string;
  moods: string[];
  /** 인터랙션 안내 문구 */
  hint: string;
  theme: WorldTheme;
  sounds: SoundDef[];
  camera: { position: [number, number, number]; target: [number, number, number] };
}

export type Route =
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'me'; tab?: 'record' | 'avatar' | 'settings' }
  | { name: 'world'; id: string; mix?: string };

export interface SoundMix {
  on: boolean;
  volume: number;
}
