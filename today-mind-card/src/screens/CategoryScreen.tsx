import { AppLayout } from '../components/AppLayout';
import { ChoiceButton } from '../components/ChoiceButton';
import { CATEGORIES } from '../data/categories';
import { QUESTIONS } from '../data/copy';
import type { Category } from '../types/reading';

type Props = {
  selected: Category | null;
  onSelect: (c: Category) => void;
  onBack: () => void;
};

// PRD §8.2 — 선택 즉시 다음 화면 이동. 별도 CTA 없음.
export function CategoryScreen({ selected, onSelect, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={1} totalSteps={4}>
      <span className="eyebrow">오늘의 마음</span>
      <h2 className="h2">{QUESTIONS.category}</h2>
      <div className="choice-grid">
        {CATEGORIES.map((c) => (
          <ChoiceButton
            key={c.key}
            label={c.label}
            selected={selected === c.key}
            onClick={() => onSelect(c.key)}
          />
        ))}
      </div>
    </AppLayout>
  );
}
