import type { Card } from '../types/reading';
import { cardEmoji } from '../data/cards';

type Props = {
  card: Card;
  /** 뒤집기 전(뒷면)이면 이름/키워드를 숨긴다 */
  faceDown?: boolean;
  onClick?: () => void;
};

// PRD §8.5 — 카드 타일
export function CardTile({ card, faceDown, onClick }: Props) {
  return (
    <button
      type="button"
      className="card-tile"
      onClick={onClick}
      aria-label={faceDown ? '카드 뒤집어 뽑기' : `${card.name} 카드`}
    >
      {faceDown ? (
        <span className="card-tile__emoji" aria-hidden>
          ✨
        </span>
      ) : (
        <>
          <span className="card-tile__emoji" aria-hidden>
            {cardEmoji(card.id)}
          </span>
          <span className="card-tile__name">{card.name}</span>
          <span className="card-tile__keyword">{card.keyword}</span>
        </>
      )}
    </button>
  );
}
