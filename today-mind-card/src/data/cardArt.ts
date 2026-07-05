import heroHoldingCard from '../assets/hero-holding-card.webp';
import artForest from '../assets/art-forest.webp';
import artStar from '../assets/art-star.webp';
import artDoor from '../assets/art-door.webp';
import artSeed from '../assets/art-seed.webp';

// 사용자 제공 컨셉 이미지(무드보드) 매핑.
// 카드가 실제로 묘사하는 장면과 1:1로 연결한다.
// 아트가 있는 카드는 결과·상세 화면에서 삽화를 노출하고,
// 나머지 카드는 그라디언트+이모지 기본 비주얼을 쓴다.
export const CARD_ART: Record<string, string> = {
  forest: artForest, // 숲 · 회복
  star: artStar, //   별 · 희망
  door: artDoor, //   문 · 선택
  seed: artSeed, //   씨앗 · 다시 시작
};

export function cardArt(id: string): string | undefined {
  return CARD_ART[id];
}

// 시작 화면 히어로 (카드를 안고 있는 사람)
export const HERO_HOLDING_CARD = heroHoldingCard;
