import { AppLayout } from '../components/AppLayout';
import { Disclaimer } from '../components/Disclaimer';
import { AdBadge, AdBanner } from '../components/AdNotice';
import { cardEmoji } from '../data/cards';
import type { Card, ReadingResult } from '../types/reading';

type Props = {
  reading: ReadingResult;
  card: Card;
  busy: boolean;
  onDetail: () => void;
  onHopeLine: () => void;
  onShare: () => void;
  onSave: () => void;
  onRetry: () => void;
  onBack: () => void;
};

// PRD §8.6 — 무료 결과 3줄은 광고 없이 제공. 나머지 CTA 는 보상형.
export function ResultScreen({
  reading,
  card,
  busy,
  onDetail,
  onHopeLine,
  onShare,
  onSave,
  onRetry,
  onBack,
}: Props) {
  return (
    <AppLayout onBack={onBack} title="오늘의 결과">
      <div className="reading fade-in">
        <div className="reading__hero-emoji" aria-hidden>
          {cardEmoji(card.id)}
        </div>
        <p className="reading__summary">{reading.summaryLines.join('\n')}</p>
      </div>

      <div className="btn-stack">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={onDetail}
        >
          상세 위로 보기 <AdBadge label="광고" />
        </button>

        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy}
          onClick={onHopeLine}
        >
          오늘의 한 문장 보기 <AdBadge label="광고" />
        </button>

        {/* 친구에게 카드 보내기 — 광고 없음 (PRD §8.6) */}
        <button
          type="button"
          className="btn btn--ghost"
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
          결과 카드 저장하기 <AdBadge label="광고" />
        </button>

        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={onRetry}
        >
          다시 한 장 뽑기 <AdBadge label="광고" />
        </button>
      </div>

      <AdBanner />
      <Disclaimer />
    </AppLayout>
  );
}
