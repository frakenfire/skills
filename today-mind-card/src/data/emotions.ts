import type { Emotion, Choice } from '../types/reading';

// PRD §8.3
export const EMOTIONS: Choice<Emotion>[] = [
  { key: 'anxious', label: '불안해요' },
  { key: 'tired', label: '지쳤어요' },
  { key: 'sad', label: '서운해요' },
  { key: 'confused', label: '헷갈려요' },
  { key: 'lonely', label: '외로워요' },
  { key: 'regretful', label: '후회돼요' },
  { key: 'hopeful', label: '기대돼요' },
  { key: 'empty', label: '아무것도 하기 싫어요' },
];

export const EMOTION_LABEL: Record<Emotion, string> = {
  anxious: '불안',
  tired: '지침',
  sad: '서운함',
  confused: '혼란',
  lonely: '외로움',
  regretful: '후회',
  hopeful: '기대',
  empty: '무기력',
};
