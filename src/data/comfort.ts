import type { MoodId } from '../store/userStore';

/** 오늘의 위로 한마디 — 날짜마다 하나씩 */
export const COMFORT = [
  '오늘도 여기까지 온 당신, 충분히 잘했어요.',
  '조금 느려도 괜찮아요. 쉬는 것도 나아가는 거예요.',
  '마음이 무거운 날엔 소리 하나에 기대어도 돼요.',
  '숨 한 번 크게 쉬어볼까요? 그거면 충분해요.',
  '완벽하지 않아도 오늘의 당신은 소중해요.',
  '애쓰느라 고생 많았어요. 이제 잠깐 내려놓아요.',
  '좋은 일은 천천히, 하지만 분명히 와요.',
  '창밖 빗소리처럼 마음도 조용히 씻겨 내려가길.',
  '오늘 하루 수고한 나에게 따뜻한 차 한 잔.',
  '잘 자는 것도 아주 중요한 일이에요.',
  '아무것도 안 해도 되는 시간, 지금이에요.',
  '당신이 웃을 때 세상이 조금 더 포근해져요.',
  '걱정은 잠시 구름 위에 맡겨두고 쉬어요.',
  '작은 모닥불처럼, 당신 안의 온기는 꺼지지 않아요.',
  '천천히 가도 길은 사라지지 않아요.',
  '오늘의 피곤함은 내일의 나를 위한 거름이 돼요.',
  '지금 이 순간, 아무도 당신을 재촉하지 않아요.',
  '눈을 감고 열까지 세어봐요. 하나, 둘…',
  '힘들었던 만큼, 오늘 밤은 더 깊이 쉬어요.',
  '당신은 생각보다 훨씬 단단한 사람이에요.',
  '흐린 날도 지나가요. 하늘은 늘 그 자리에 있어요.',
  '잠깐 멈춰도 괜찮아요. 기차는 다시 와요.',
  '오늘 들은 좋은 소리 하나를 기억해요.',
  '나를 돌보는 일은 이기적인 게 아니에요.',
  '마음에도 쉬는 시간이 필요해요.',
  '느긋한 오후 네 시처럼, 여유를 가져봐요.',
  '바다 깊은 곳처럼 고요한 마음이 되길.',
  '이끼처럼 천천히, 하지만 꾸준히 자라고 있어요.',
  '오늘의 당신에게 작은 박수를 보내요.',
  '내일은 오늘보다 조금 더 가벼울 거예요.',
];

export function comfortOfDay(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0).getTime();
  const doy = Math.floor((d.getTime() - start) / 86_400_000);
  return COMFORT[(doy + d.getFullYear()) % COMFORT.length];
}

export interface Mood {
  id: MoodId;
  emoji: string;
  label: string;
  world: string | null;
  reason: string;
}

/** 기분 체크인 → 추천 월드 */
export const MOODS: Mood[] = [
  { id: 'tired', emoji: '😮‍💨', label: '지쳤어요', world: 'cloud', reason: '폭신한 구름 침대에 잠깐 누워 쉬어가요.' },
  { id: 'anxious', emoji: '😟', label: '마음이 복잡해요', world: 'ocean', reason: '깊은 바닷속 고요함이 마음을 가라앉혀 줄 거예요.' },
  { id: 'sleepless', emoji: '😴', label: '잠이 안 와요', world: 'campfire', reason: '타닥타닥 모닥불 소리에 스르르 눈이 감길 거예요.' },
  { id: 'focus', emoji: '📚', label: '집중하고 싶어요', world: 'bookstore', reason: '빗소리와 책장 넘기는 소리가 집중을 도와줘요.' },
  { id: 'empty', emoji: '🌿', label: '머리를 비우고 싶어요', world: 'moss', reason: '숲속 정원의 새소리와 바람이 생각을 비워줘요.' },
  { id: 'lonely', emoji: '🌙', label: '조금 외로워요', world: 'station', reason: '달빛 기차역에서 혼자만의 시간을 다정하게 보내요.' },
  { id: 'good', emoji: '😊', label: '기분 좋아요', world: null, reason: '좋은 기분 그대로, 마음에 드는 월드로 놀러 가요!' },
];
