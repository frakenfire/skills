import { AppLayout } from '../components/AppLayout';
import { CardTile } from '../components/CardTile';
import { CARD_PICK } from '../data/copy';
import type { Card } from '../types/reading';

type Props = {
  cards: Card[];
  busy: boolean;
  onPick: (card: Card) => void;
  onBack: () => void;
};

// PRD §8.5 — 날짜 seed 기반 3장 노출, 뒷면으로 보여 뽑는 몰입감.
export function CardPickScreen({ cards, busy, onPick, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={4} totalSteps={4}>
      <span className="eyebrow">카드 뽑기</span>
      <h2 className="h2" style={{ whiteSpace: 'pre-line' }}>
        {CARD_PICK.title}
      </h2>
      <p className="lead">{CARD_PICK.lead}</p>

      <div className="card-row" style={{ marginTop: 'var(--space-6)' }}>
        {cards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            faceDown
            onClick={() => !busy && onPick(card)}
          />
        ))}
      </div>

      {busy ? (
        <p
          className="lead"
          style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}
        >
          카드를 뒤집는 중이에요…
        </p>
      ) : null}
    </AppLayout>
  );
}
