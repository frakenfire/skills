// PRD §15 — 광고 mock 함수.
// 실제 앱인토스 SDK 연동 전까지 mock 으로 동작한다.
// 모든 함수는 Promise<boolean> 을 반환하며, 성공 시 true.
// 광고 실패 시에도 사용자에게 불이익 없이 기본 화면을 유지한다. (PRD §11.3)

const MOCK_DELAY_MS = 500;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** ResultScreen 진입 직전 전면형 광고 (PRD §11.2) */
export async function showInterstitialBeforeResult(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}

/** 상세 위로 보기 — 리워드 광고 */
export async function showRewardAdForDetail(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}

/** 오늘의 한 문장 보기 — 리워드 광고 */
export async function showRewardAdForHopeLine(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}

/** 다시 한 장 뽑기 — 리워드 광고 */
export async function showRewardAdForRetry(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}

/** 결과 카드 저장 — 리워드 광고 */
export async function showRewardAdForSaveImage(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}
