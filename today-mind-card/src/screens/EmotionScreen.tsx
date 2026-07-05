import { AppLayout } from '../components/AppLayout';
import { ChoiceButton } from '../components/ChoiceButton';
import { EMOTIONS } from '../data/emotions';
import { QUESTIONS } from '../data/copy';
import type { Emotion } from '../types/reading';

type Props = {
  selected: Emotion | null;
  onSelect: (e: Emotion) => void;
  onBack: () => void;
};

// PRD §8.3
export function EmotionScreen({ selected, onSelect, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={2} totalSteps={4}>
      <span className="eyebrow">지금 감정</span>
      <h2 className="h2">{QUESTIONS.emotion}</h2>
      <div className="choice-grid">
        {EMOTIONS.map((e) => (
          <ChoiceButton
            key={e.key}
            label={e.label}
            selected={selected === e.key}
            onClick={() => onSelect(e.key)}
          />
        ))}
      </div>
    </AppLayout>
  );
}
