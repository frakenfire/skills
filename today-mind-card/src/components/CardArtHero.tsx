import type { Card } from '../types/reading';
import { cardArt } from '../data/cardArt';
import { cardEmoji } from '../data/cards';

// 카드에 컨셉 삽화가 있으면 이미지를, 없으면 이모지 히어로를 보여준다.
export function CardArtHero({ card }: { card: Card }) {
  const art = cardArt(card.id);
  if (art) {
    return (
      <img
        className="reading__art"
        src={art}
        alt={`${card.name} 카드 삽화`}
        width={280}
        height={373}
        loading="lazy"
      />
    );
  }
  return (
    <div className="reading__hero-emoji" aria-hidden>
      {cardEmoji(card.id)}
    </div>
  );
}
