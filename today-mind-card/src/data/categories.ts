import type { Category, Choice } from '../types/reading';

// PRD §8.2
export const CATEGORIES: Choice<Category>[] = [
  { key: 'love', label: '연애' },
  { key: 'work', label: '일' },
  { key: 'money', label: '돈' },
  { key: 'relationship', label: '인간관계' },
  { key: 'career', label: '진로' },
  { key: 'mind', label: '그냥 마음이 복잡해요' },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  love: '연애',
  work: '일',
  money: '돈',
  relationship: '인간관계',
  career: '진로',
  mind: '마음',
};
