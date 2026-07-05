import type { Card } from '../types/reading';

// PRD §9.1 — MVP 카드 24장. 실제 AI 없이 사전 작성된 데이터.
// 톤 규칙(§10.4): 감정 인정 · 단정 회피 · 작은 행동 · 희망 유지 · 불안 억제.
export const CARDS: Card[] = [
  {
    id: 'moonlight',
    name: '달빛',
    keyword: '감정 정리',
    shortMeaning: '흔들린 마음을 가만히 비춰보는 밤이에요.',
    detailMeaning:
      '지금은 서둘러 답을 내기보다, 하루 동안 쌓인 감정을 천천히 가라앉히는 게 먼저예요. 마음이 조용해지면 보이지 않던 것도 보이기 시작해요.',
    hopeLine: '무너진 게 아니라, 잠깐 쉬어가는 중이에요.',
  },
  {
    id: 'seed',
    name: '씨앗',
    keyword: '다시 시작',
    shortMeaning: '작게 다시 시작해도 충분한 날이에요.',
    detailMeaning:
      '큰 결심이 아니어도 괜찮아요. 아주 작은 한 걸음이 오늘의 씨앗이 될 수 있어요. 지금 심는 마음이 나중에 나를 지켜줄 거예요.',
    hopeLine: '작게 시작해도, 시작한 건 시작한 거예요.',
  },
  {
    id: 'door',
    name: '문',
    keyword: '선택',
    shortMeaning: '어떤 선택이든 나를 위한 방향이면 돼요.',
    detailMeaning:
      '선택 앞에서 흔들리는 건 신중하다는 뜻이에요. 정답을 찾기보다, 내가 후회를 덜 할 쪽이 어디인지 먼저 생각해봐요.',
    hopeLine: '어떤 문을 열어도, 나를 위한 길이 될 수 있어요.',
  },
  {
    id: 'wave',
    name: '파도',
    keyword: '흔들림',
    shortMeaning: '흔들리는 건 약해서가 아니에요.',
    detailMeaning:
      '파도가 치는 건 바다가 살아있다는 뜻이에요. 지금의 흔들림도 지나가는 흐름이고, 곧 잔잔해질 순간이 와요.',
    hopeLine: '흔들려도 가라앉지는 않아요.',
  },
  {
    id: 'lamp',
    name: '등불',
    keyword: '방향',
    shortMeaning: '멀리 보지 않아도, 한 걸음 앞은 보여요.',
    detailMeaning:
      '모든 길을 다 알 필요는 없어요. 지금 발밑을 비추는 만큼만 걸어가도 충분해요. 방향은 걷다 보면 선명해져요.',
    hopeLine: '전부 안 보여도, 한 걸음은 갈 수 있어요.',
  },
  {
    id: 'wind',
    name: '바람',
    keyword: '변화',
    shortMeaning: '변화가 조금 낯설어도 괜찮아요.',
    detailMeaning:
      '바람은 눈에 안 보여도 분명히 무언가를 옮겨요. 지금의 변화도 나쁜 쪽만은 아닐 가능성이 있어요. 천천히 적응해도 돼요.',
    hopeLine: '바람의 방향이 바뀌면, 풍경도 바뀌어요.',
  },
  {
    id: 'calm',
    name: '고요',
    keyword: '멈춤',
    shortMeaning: '잠깐 멈추는 것도 나아가는 거예요.',
    detailMeaning:
      '아무것도 하지 않는 시간이 게으른 게 아니에요. 지금은 힘을 모으는 쉼표가 필요한 구간일 수 있어요.',
    hopeLine: '멈춤은 멈춘 게 아니라, 고르는 중이에요.',
  },
  {
    id: 'star',
    name: '별',
    keyword: '희망',
    shortMeaning: '어두울수록 더 잘 보이는 게 있어요.',
    detailMeaning:
      '지금이 좀 캄캄해도, 그래서 오히려 작은 빛이 더 또렷하게 느껴질 수 있어요. 그 빛을 놓치지 말아요.',
    hopeLine: '지금이 끝은 아니에요.',
  },
  {
    id: 'mirror',
    name: '거울',
    keyword: '자기이해',
    shortMeaning: '남보다 나를 먼저 들여다볼 시간이에요.',
    detailMeaning:
      '상대의 반응을 해석하기 전에, 내가 지금 무엇을 느끼는지부터 알아봐요. 내 마음을 아는 게 가장 정확한 출발점이에요.',
    hopeLine: '나를 이해하는 만큼, 마음이 편해져요.',
  },
  {
    id: 'bridge',
    name: '다리',
    keyword: '연결',
    shortMeaning: '먼저 손을 내밀어도 지지 않아요.',
    detailMeaning:
      '연결은 누군가 먼저 다리를 놓아야 생겨요. 그게 꼭 손해는 아니에요. 다만 나를 지치게 하는 관계라면 잠시 거리를 둬도 돼요.',
    hopeLine: '이어지는 마음은, 먼저 낸 손에서 시작돼요.',
  },
  {
    id: 'forest',
    name: '숲',
    keyword: '회복',
    shortMeaning: '회복은 천천히, 그러나 분명히 와요.',
    detailMeaning:
      '숲은 하루아침에 자라지 않아요. 지금의 나도 조금씩 회복하는 중이에요. 속도를 재촉하지 않아도 괜찮아요.',
    hopeLine: '느려도, 자라고 있어요.',
  },
  {
    id: 'sun',
    name: '태양',
    keyword: '자신감',
    shortMeaning: '오늘의 나를 조금 믿어봐도 돼요.',
    detailMeaning:
      '완벽하지 않아도 나는 여기까지 왔어요. 그건 꽤 대단한 일이에요. 오늘은 스스로를 조금 더 인정해줘요.',
    hopeLine: '나는 생각보다 잘 버텨왔어요.',
  },
  {
    id: 'rain',
    name: '비',
    keyword: '정화',
    shortMeaning: '울고 싶으면 울어도 되는 날이에요.',
    detailMeaning:
      '비가 지나가면 공기가 맑아지듯, 감정을 흘려보내면 마음도 가벼워져요. 참기만 하지 않아도 괜찮아요.',
    hopeLine: '비가 그치면, 하늘은 더 맑아져요.',
  },
  {
    id: 'letter',
    name: '편지',
    keyword: '기다림',
    shortMeaning: '기다림도 무언가를 하는 시간이에요.',
    detailMeaning:
      '답이 아직 오지 않았다고 조급해하지 않아도 돼요. 지금은 재촉보다 나를 돌보며 기다리는 쪽이 좋아요.',
    hopeLine: '기다리는 마음도, 소중한 마음이에요.',
  },
  {
    id: 'clock',
    name: '시계',
    keyword: '타이밍',
    shortMeaning: '아직 그때가 아닌 것뿐일 수 있어요.',
    detailMeaning:
      '늦은 게 아니라 나의 때가 따로 있는 거예요. 지금 안 되는 일이 영영 안 되는 건 아니에요.',
    hopeLine: '나의 때는, 나의 속도로 와요.',
  },
  {
    id: 'flower',
    name: '꽃',
    keyword: '관계 회복',
    shortMeaning: '멀어진 마음도 다시 피어날 수 있어요.',
    detailMeaning:
      '관계도 계절을 타요. 지금 조금 시들해 보여도, 다시 따뜻해질 여지가 있어요. 다만 나를 갉아먹는 관계라면 놓아줘도 돼요.',
    hopeLine: '다시 피어날 마음은, 아직 남아있어요.',
  },
  {
    id: 'stone',
    name: '돌',
    keyword: '버팀',
    shortMeaning: '버티는 지금이 이미 실력이에요.',
    detailMeaning:
      '아무것도 안 하는 것 같아도, 버티는 데는 큰 힘이 들어요. 그 시간을 지나온 나를 얕보지 말아요.',
    hopeLine: '버틴 시간은, 곧 단단함이 돼요.',
  },
  {
    id: 'cloud',
    name: '구름',
    keyword: '불확실성',
    shortMeaning: '흐린 날엔 무리해서 멀리 보지 않아도 돼요.',
    detailMeaning:
      '모든 게 불확실할 때 억지로 결론을 내면 후회가 남기 쉬워요. 지금은 판단을 잠시 미뤄도 괜찮은 날이에요.',
    hopeLine: '구름은 결국, 흘러가요.',
  },
  {
    id: 'ember',
    name: '불씨',
    keyword: '의지',
    shortMeaning: '작은 마음 하나가 아직 남아있어요.',
    detailMeaning:
      '전부 꺼진 것 같아도, 다시 타오를 불씨는 남아있어요. 오늘은 그 작은 마음을 지키는 것만으로 충분해요.',
    hopeLine: '작은 불씨 하나면, 다시 시작돼요.',
  },
  {
    id: 'road',
    name: '길',
    keyword: '전환',
    shortMeaning: '돌아가는 길도 나의 길이에요.',
    detailMeaning:
      '지금 방향을 바꾸는 게 실패가 아니에요. 더 나에게 맞는 길로 접어드는 전환일 수 있어요.',
    hopeLine: '돌아가도, 결국 나에게 닿아요.',
  },
  {
    id: 'home',
    name: '집',
    keyword: '안정',
    shortMeaning: '오늘은 나를 편히 쉬게 해줘요.',
    detailMeaning:
      '밖에서 애쓴 만큼, 나에게도 돌아올 자리가 필요해요. 무리하지 말고 안전하다고 느끼는 것부터 챙겨봐요.',
    hopeLine: '나에게 돌아올 자리는, 늘 있어요.',
  },
  {
    id: 'cup',
    name: '컵',
    keyword: '감정',
    shortMeaning: '내 마음이 지금 얼마나 찼는지 살펴봐요.',
    detailMeaning:
      '컵이 넘치기 전에 조금 비워내도 돼요. 다 담아두려 하지 말고, 오늘은 나를 위해 조금 덜어내요.',
    hopeLine: '비워낸 만큼, 다시 담을 수 있어요.',
  },
  {
    id: 'key',
    name: '열쇠',
    keyword: '해답',
    shortMeaning: '답은 밖이 아니라 내 안에 있을 수 있어요.',
    detailMeaning:
      '남의 정답을 좇기보다, 내가 진짜 원하는 게 무엇인지 물어봐요. 그 안에 열쇠가 있을 가능성이 커요.',
    hopeLine: '내 안의 답이, 가장 잘 맞아요.',
  },
  {
    id: 'dawn',
    name: '새벽',
    keyword: '새로운 흐름',
    shortMeaning: '가장 어두운 뒤에 새벽이 와요.',
    detailMeaning:
      '지금이 캄캄하게 느껴진다면, 오히려 흐름이 바뀌기 직전일 수 있어요. 조금만 더 나를 다독이며 기다려봐요.',
    hopeLine: '새벽은, 늘 어둠 다음에 와요.',
  },
];

// 시각용 이모지 (Card 타입은 PRD 스펙 유지, 이모지는 별도 매핑)
export const CARD_EMOJI: Record<string, string> = {
  moonlight: '🌙',
  seed: '🌱',
  door: '🚪',
  wave: '🌊',
  lamp: '🏮',
  wind: '🍃',
  calm: '🧘',
  star: '⭐',
  mirror: '🪞',
  bridge: '🌉',
  forest: '🌳',
  sun: '☀️',
  rain: '🌧️',
  letter: '💌',
  clock: '⏰',
  flower: '🌸',
  stone: '🪨',
  cloud: '☁️',
  ember: '🔥',
  road: '🛣️',
  home: '🏡',
  cup: '☕',
  key: '🔑',
  dawn: '🌅',
};

export function cardEmoji(id: string): string {
  return CARD_EMOJI[id] ?? '🃏';
}
