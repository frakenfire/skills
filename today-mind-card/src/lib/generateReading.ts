import type {
  Card,
  Category,
  Emotion,
  ReadingResult,
  State,
} from '../types/reading';
import { hashSeed } from './dateSeed';

// PRD §10 — 결과 생성 로직.
// 실제 AI API 없이 (category + emotion + state + card + dateSeed) 를 조합한다.
// 톤 규칙(§10.4): 감정 인정 · 단정 회피 · 작은 행동 · 희망 유지 · 불안 억제.
// 금지 표현(§5.3)은 어떤 조합에서도 등장하지 않도록 문장을 사전 검수했다.

// 감정 → 지금 마음 (여러 문장 중 seed 로 하나 선택)
const CURRENT_MIND: Record<Emotion, string[]> = {
  anxious: [
    '지금 마음이 예민한 건 약해서가 아니라, 계속 버텨온 시간이 길었기 때문이에요.',
    '불안이 크게 느껴질 수 있어요. 그래도 그 마음은 나를 지키려는 신호일 수 있어요.',
  ],
  tired: [
    '많이 지쳐 있는 상태예요. 무너진 게 아니라 충전이 필요한 것뿐이에요.',
    '오늘의 피로는 게을러서가 아니라, 그동안 충분히 애써왔기 때문이에요.',
  ],
  sad: [
    '서운한 마음이 남아있어요. 그 감정을 억지로 지우지 않아도 괜찮아요.',
    '마음이 조금 상했을 수 있어요. 그럴 수 있어요, 자연스러운 감정이에요.',
  ],
  confused: [
    '지금은 생각이 많아 복잡한 시기예요. 답을 서둘러 내지 않아도 돼요.',
    '헷갈리는 건 신중하다는 뜻이기도 해요. 천천히 정리해도 늦지 않아요.',
  ],
  lonely: [
    '조금 외롭게 느껴질 수 있어요. 그 마음을 느끼는 나를 탓하지 말아요.',
    '혼자인 것 같은 날이에요. 그래도 이 감정은 지나가는 흐름일 가능성이 커요.',
  ],
  regretful: [
    '후회가 남을 수 있어요. 그건 더 잘하고 싶었던 마음의 다른 이름이에요.',
    '지난 일이 자꾸 떠오를 수 있어요. 나를 너무 오래 몰아세우지는 말아요.',
  ],
  hopeful: [
    '기대되는 마음이 있네요. 그 설렘을 조심스레 지켜봐도 좋아요.',
    '무언가를 향한 기대가 느껴져요. 그 마음이 오늘의 나를 움직이게 해요.',
  ],
  empty: [
    '아무것도 하기 싫은 날이에요. 그런 날도 있어도 괜찮아요.',
    '지금은 의욕이 잘 안 나는 상태일 수 있어요. 억지로 끌어올리지 않아도 돼요.',
  ],
};

// 상태 → 오늘의 흐름
const FLOW: Record<State, string[]> = {
  enduring: [
    '오늘은 큰 결론보다 하루를 잘 넘기는 데 집중하는 쪽이 좋아요.',
    '지금은 버티는 것만으로 충분해요. 그 시간이 곧 힘이 될 수 있어요.',
  ],
  deciding: [
    '결정 앞에 있다면, 오늘은 마음을 먼저 정리하고 판단은 조금 미뤄도 돼요.',
    '중요한 선택일수록 서두르지 않는 게 좋아요. 내가 후회를 덜 할 쪽을 살펴봐요.',
  ],
  waiting: [
    '기다리는 시간엔 재촉보다 나를 돌보는 데 마음을 써봐요.',
    '아직 답이 오지 않았다면, 그 사이 나를 챙기는 게 오늘의 할 일이에요.',
  ],
  lettingGo: [
    '정리하는 중이라면, 천천히 놓아가도 괜찮아요. 한 번에 다 비우지 않아도 돼요.',
    '무언가를 내려놓는 건 지는 게 아니라, 나를 위한 선택일 수 있어요.',
  ],
};

// 감정 → 조심할 것 (불안 자극 없이, 피해야 할 행동)
const CAUTION: Record<Emotion, string> = {
  anxious: '작은 신호 하나로 최악을 미리 그리지 않도록, 지금 확인되지 않은 걱정은 잠시 접어둬요.',
  tired: '오늘 하루로 나를 평가하지 말아요. 지친 날엔 무리한 결정을 미루는 게 좋아요.',
  sad: '상대의 반응 하나로 나를 판단하지 마세요. 감정이 격할 때의 말은 아껴둬요.',
  confused: '혼란스러울 때 억지로 결론을 내면 후회가 남기 쉬워요. 판단을 잠시 미뤄도 돼요.',
  lonely: '외로움을 급하게 메우려다 나에게 맞지 않는 선택을 하지 않도록 조심해요.',
  regretful: '지난 일을 곱씹으며 나를 몰아세우지 않도록, 오늘은 나에게 조금 너그러워져요.',
  hopeful: '기대가 큰 만큼 실망도 미리 겁내지 않도록, 지금은 지금의 설렘만 챙겨요.',
  empty: '아무것도 못 한 나를 자책하지 말아요. 오늘은 쉬어도 되는 날이에요.',
};

// 카테고리 → 해도 되는 것 (작은 행동 제안)
const ACTION: Record<Category, string> = {
  love: '오늘은 답장을 보내기 전에 내 마음을 먼저 한 줄 적어봐요.',
  work: '오늘은 가장 작은 일 하나만 끝내도 충분해요. 나머지는 내일의 나에게 맡겨요.',
  money: '숫자를 보며 불안해하기보다, 오늘은 흐름을 한 번 차분히 적어보는 것부터 해봐요.',
  relationship: '모두를 이해하려 애쓰기보다, 오늘은 나를 편하게 해주는 사람에게 마음을 써요.',
  career: '먼 미래를 다 정하려 하지 말고, 오늘 할 수 있는 아주 작은 한 걸음만 골라봐요.',
  mind: '오늘은 나에게 필요한 쉼 하나를 스스로에게 허락해줘요.',
};

// 카테고리 → 요약 첫 줄
const SUMMARY_LEAD: Record<Category, string> = {
  love: '오늘의 마음 흐름',
  work: '오늘의 마음 흐름',
  money: '오늘의 마음 흐름',
  relationship: '오늘의 마음 흐름',
  career: '오늘의 마음 흐름',
  mind: '오늘의 마음 흐름',
};

function pickOne<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export type ReadingInput = {
  category: Category;
  emotion: Emotion;
  state: State;
  card: Card;
  dateKey?: string;
};

export function generateReading(input: ReadingInput): ReadingResult {
  const { category, emotion, state, card, dateKey = '' } = input;
  const seed = hashSeed(`${dateKey}|${category}|${emotion}|${state}|${card.id}`);

  const currentMind = pickOne(CURRENT_MIND[emotion], seed);
  const flow = pickOne(FLOW[state], seed >> 3);
  const caution = CAUTION[emotion];
  const action = ACTION[category];
  const hopeLine = card.hopeLine;

  const summaryLines = [
    SUMMARY_LEAD[category],
    `${card.name} 카드예요. ${card.shortMeaning}`,
    '오늘을 잘 넘기면 생각보다 마음이 가벼워질 수 있어요.',
  ];

  const shareText = `${hopeLine}\n\n[오늘의 마음 한 장]`;

  return {
    summaryLines,
    currentMind,
    flow,
    caution,
    action,
    hopeLine,
    shareText,
  };
}
