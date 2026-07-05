import { AppLayout } from '../components/AppLayout';
import { BottomAction } from '../components/BottomAction';
import { START } from '../data/copy';
import { HERO_HOLDING_CARD } from '../data/cardArt';

// PRD §8.1 — 시작 화면. 진입 직후 광고/바텀시트 없음.
export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <AppLayout
      bottom={
        <BottomAction onClick={onStart} ariaLabel="오늘의 카드 뽑기">
          {START.cta}
        </BottomAction>
      }
    >
      <div className="center-hero">
        <img
          className="hero-img"
          src={HERO_HOLDING_CARD}
          alt="카드 한 장을 가만히 안고 있는 사람"
          width={220}
          height={391}
          loading="eager"
        />
        <h1 className="h1">{START.title}</h1>
        <p className="lead">{START.lead}</p>
      </div>
    </AppLayout>
  );
}
