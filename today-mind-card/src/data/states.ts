import type { State, Choice } from '../types/reading';

// PRD §8.4
export const STATES: Choice<State>[] = [
  { key: 'enduring', label: '버티는 중이에요' },
  { key: 'deciding', label: '결정 앞에 있어요' },
  { key: 'waiting', label: '기다리는 중이에요' },
  { key: 'lettingGo', label: '정리하는 중이에요' },
];

export const STATE_LABEL: Record<State, string> = {
  enduring: '버티는 중',
  deciding: '결정 앞',
  waiting: '기다리는 중',
  lettingGo: '정리하는 중',
};
