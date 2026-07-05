// PRD §10.2 / §10.3 — 입출력 타입 정의

export type Category =
  | 'love'
  | 'work'
  | 'money'
  | 'relationship'
  | 'career'
  | 'mind';

export type Emotion =
  | 'anxious'
  | 'tired'
  | 'sad'
  | 'confused'
  | 'lonely'
  | 'regretful'
  | 'hopeful'
  | 'empty';

export type State = 'enduring' | 'deciding' | 'waiting' | 'lettingGo';

export type Card = {
  id: string;
  name: string;
  keyword: string;
  shortMeaning: string;
  detailMeaning: string;
  hopeLine: string;
};

export type ReadingResult = {
  summaryLines: string[];
  currentMind: string;
  flow: string;
  caution: string;
  action: string;
  hopeLine: string;
  shareText: string;
};

// 선택 화면 공용 옵션 타입
export type Choice<T extends string> = {
  key: T;
  label: string;
};
