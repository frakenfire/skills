import type { Card, Category, Emotion, State } from '../types/reading';

// PRD §16 — localStorage 기준.
// 저장 금지: 이름·연락처·생년월일·자유 입력 고민 원문·민감 심리 상태·서버 전송 데이터.
// MVP 는 선택형 입력(enum)만 저장한다.

const KEYS = {
  lastReading: 'todayLastReading',
  dailyPickCount: 'dailyPickCount',
  lastCategory: 'lastCategory',
  lastVisitDate: 'lastVisitDate',
} as const;

export type StoredReading = {
  dateKey: string;
  category: Category;
  emotion: Emotion;
  state: State;
  cardId: string;
};

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 저장 실패해도 앱 흐름은 유지 */
  }
}

export function saveReading(reading: StoredReading): void {
  safeSet(KEYS.lastReading, JSON.stringify(reading));
  safeSet(KEYS.lastCategory, reading.category);
}

export function loadReading(): StoredReading | null {
  const raw = safeGet(KEYS.lastReading);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredReading;
  } catch {
    return null;
  }
}

/** 오늘 뽑은 횟수 (날짜가 바뀌면 0 으로 리셋) */
export function getDailyPickCount(dateKey: string): number {
  const lastVisit = safeGet(KEYS.lastVisitDate);
  if (lastVisit !== dateKey) return 0;
  const raw = safeGet(KEYS.dailyPickCount);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function incrementDailyPickCount(dateKey: string): number {
  const next = getDailyPickCount(dateKey) + 1;
  safeSet(KEYS.dailyPickCount, String(next));
  safeSet(KEYS.lastVisitDate, dateKey);
  return next;
}

export function markVisit(dateKey: string): void {
  safeSet(KEYS.lastVisitDate, dateKey);
}

/** 편의: 저장된 카드 id 로부터 카드 조회는 호출부에서 CARDS 를 참조한다 */
export type { Card };
