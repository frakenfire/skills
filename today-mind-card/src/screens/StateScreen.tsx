import { AppLayout } from '../components/AppLayout';
import { ChoiceButton } from '../components/ChoiceButton';
import { STATES } from '../data/states';
import { QUESTIONS } from '../data/copy';
import type { State } from '../types/reading';

type Props = {
  selected: State | null;
  onSelect: (s: State) => void;
  onBack: () => void;
};

// PRD §8.4
export function StateScreen({ selected, onSelect, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={3} totalSteps={4}>
      <span className="eyebrow">지금 상황</span>
      <h2 className="h2">{QUESTIONS.state}</h2>
      <div className="choice-grid choice-grid--single">
        {STATES.map((s) => (
          <ChoiceButton
            key={s.key}
            label={s.label}
            selected={selected === s.key}
            onClick={() => onSelect(s.key)}
          />
        ))}
      </div>
    </AppLayout>
  );
}
