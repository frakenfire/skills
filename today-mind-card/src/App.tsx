import { useMemo, useState } from 'react';
import type {
  Card,
  Category,
  Emotion,
  ReadingResult,
  State,
} from './types/reading';
import { CARDS } from './data/cards';
import { pickBySeed, hashSeed, todayKey } from './lib/dateSeed';
import { generateReading } from './lib/generateReading';
import {
  showInterstitialBeforeResult,
  showRewardAdForDetail,
  showRewardAdForHopeLine,
  showRewardAdForRetry,
  showRewardAdForSaveImage,
} from './lib/ads';
import { shareOrCopy, copyText } from './lib/share';
import { saveResultCard } from './lib/saveImage';
import {
  incrementDailyPickCount,
  markVisit,
  saveReading,
} from './lib/storage';

import { StartScreen } from './screens/StartScreen';
import { CategoryScreen } from './screens/CategoryScreen';
import { EmotionScreen } from './screens/EmotionScreen';
import { StateScreen } from './screens/StateScreen';
import { CardPickScreen } from './screens/CardPickScreen';
import { ResultScreen } from './screens/ResultScreen';
import { DetailResultScreen } from './screens/DetailResultScreen';

type ScreenName =
  | 'start'
  | 'category'
  | 'emotion'
  | 'state'
  | 'pick'
  | 'result'
  | 'detail';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('start');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [category, setCategory] = useState<Category | null>(null);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  // 다시 뽑기 시 카드 조합을 바꾸기 위한 nonce
  const [pickNonce, setPickNonce] = useState(0);

  const dateKey = useMemo(() => todayKey(), []);

  // 오늘의 노출 카드 3장 (날짜 seed 기반, 다시 뽑기 시 nonce 로 변화)
  const shownCards = useMemo(() => {
    const seed = hashSeed(`${dateKey}#${pickNonce}`);
    return pickBySeed(CARDS, 3, seed);
  }, [dateKey, pickNonce]);

  const reading: ReadingResult | null = useMemo(() => {
    if (!category || !emotion || !state || !selectedCard) return null;
    return generateReading({ category, emotion, state, card: selectedCard, dateKey });
  }, [category, emotion, state, selectedCard, dateKey]);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  }

  // ── 흐름 ──
  function handleStart() {
    markVisit(dateKey);
    setScreen('category');
  }

  function handleCategory(c: Category) {
    setCategory(c);
    setScreen('emotion');
  }

  function handleEmotion(e: Emotion) {
    setEmotion(e);
    setScreen('state');
  }

  function handleState(s: State) {
    setState(s);
    setScreen('pick');
  }

  // 카드 선택 → 전면형 광고(mock) → 결과 (PRD §11.2)
  async function handlePick(card: Card) {
    if (busy) return;
    setSelectedCard(card);
    setBusy(true);
    await showInterstitialBeforeResult(); // 실패해도 흐름 유지
    if (category && emotion && state) {
      incrementDailyPickCount(dateKey);
      saveReading({ dateKey, category, emotion, state, cardId: card.id });
    }
    setBusy(false);
    setScreen('result');
  }

  // 상세 위로 보기 → 리워드 광고(mock) → 상세
  async function handleDetail() {
    if (busy) return;
    setBusy(true);
    await showRewardAdForDetail();
    setBusy(false);
    setScreen('detail');
  }

  // 오늘의 한 문장 보기 → 리워드 광고(mock) → 복사
  async function handleHopeLine() {
    if (busy || !reading) return;
    setBusy(true);
    await showRewardAdForHopeLine();
    const ok = await copyText(reading.hopeLine);
    setBusy(false);
    flash(ok ? '오늘의 한 문장을 복사했어요' : '복사를 완료하지 못했어요');
  }

  // 친구에게 카드 보내기 — 광고 없음 (PRD §8.6)
  async function handleShare() {
    if (!reading) return;
    const result = await shareOrCopy(reading.hopeLine);
    if (result === 'shared') flash('공유 창을 열었어요');
    else if (result === 'copied') flash('공유 문구를 복사했어요');
    else flash('공유를 완료하지 못했어요');
  }

  // 결과 카드 저장 → 리워드 광고(mock) → 이미지 저장
  async function handleSave() {
    if (busy || !reading || !selectedCard) return;
    setBusy(true);
    await showRewardAdForSaveImage();
    const ok = await saveResultCard({
      cardId: selectedCard.id,
      cardName: selectedCard.name,
      hopeLine: reading.hopeLine,
    });
    setBusy(false);
    flash(ok ? '결과 카드를 저장했어요' : '저장을 완료하지 못했어요');
  }

  // 다시 한 장 뽑기 → 리워드 광고(mock) → 카드 선택 화면
  async function handleRetry() {
    if (busy) return;
    setBusy(true);
    await showRewardAdForRetry();
    setBusy(false);
    setSelectedCard(null);
    setPickNonce((n) => n + 1);
    setScreen('pick');
  }

  return (
    <>
      {screen === 'start' && <StartScreen onStart={handleStart} />}

      {screen === 'category' && (
        <CategoryScreen
          selected={category}
          onSelect={handleCategory}
          onBack={() => setScreen('start')}
        />
      )}

      {screen === 'emotion' && (
        <EmotionScreen
          selected={emotion}
          onSelect={handleEmotion}
          onBack={() => setScreen('category')}
        />
      )}

      {screen === 'state' && (
        <StateScreen
          selected={state}
          onSelect={handleState}
          onBack={() => setScreen('emotion')}
        />
      )}

      {screen === 'pick' && (
        <CardPickScreen
          cards={shownCards}
          busy={busy}
          onPick={handlePick}
          onBack={() => setScreen('state')}
        />
      )}

      {screen === 'result' && reading && selectedCard && (
        <ResultScreen
          reading={reading}
          card={selectedCard}
          busy={busy}
          onDetail={handleDetail}
          onHopeLine={handleHopeLine}
          onShare={handleShare}
          onSave={handleSave}
          onRetry={handleRetry}
          onBack={() => setScreen('start')}
        />
      )}

      {screen === 'detail' && reading && selectedCard && (
        <DetailResultScreen
          reading={reading}
          card={selectedCard}
          busy={busy}
          onShare={handleShare}
          onSave={handleSave}
          onBack={() => setScreen('result')}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
