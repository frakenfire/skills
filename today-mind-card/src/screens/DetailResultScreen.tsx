import { AppLayout } from '../components/AppLayout';
import { ReadingCard } from '../components/ReadingCard';
import { Disclaimer } from '../components/Disclaimer';
import { cardEmoji } from '../data/cards';
import type { Card, ReadingResult } from '../types/reading';

type Props = {
  reading: ReadingResult;
  card: Card;
  busy: boolean;
  onShare: () => void;
  onSave: () => void;
  onBack: () => void;
};

// PRD §8.7 — 상세 위로 결과: 지금 마음 / 오늘의 흐름 / 조심할 것 / 해도 되는 것 / 오늘의 한 문장
export function DetailResultScreen({
  reading,
  card,
  busy,
  onShare,
  onSave,
  onBack,
}: Props) {
  return (
    <AppLayout onBack={onBack} title="상세 위로">
      <span className="eyebrow">{card.name} · {card.keyword}</span>

      <ReadingCard
        emoji={cardEmoji(card.id)}
        sections={[
          { label: '지금 마음', text: reading.currentMind },
          { label: '오늘의 흐름', text: reading.flow },
          { label: '조심할 것', text: reading.caution },
          { label: '해도 되는 것', text: reading.action },
        ]}
      />

      {/* 오늘의 한 문장 — 공유·저장용 (SIGNATURE ORANGE 강조) */}
      <div className="hope-line">
        <p className="hope-line__label">오늘의 한 문장</p>
        <p className="hope-line__text">{reading.hopeLine}</p>
      </div>

      <div className="btn-stack">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={onShare}
        >
          친구에게 카드 보내기
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={onSave}
        >
          결과 카드 저장하기
        </button>
      </div>

      <Disclaimer />
    </AppLayout>
  );
}
