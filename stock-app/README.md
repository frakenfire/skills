# StockPulse — 초보자를 위한 주식 AI 예측 앱

주식 **완전 초보자**를 위한 모바일 우선 웹앱. **토스(Toss)풍** 깔끔한 UI에, 종목마다 **AI 매수·매도·관망 신호**를 쉬운 말로 보여주고, **스레드(Threads) 공유 카드**로 자연스럽게 퍼지게 설계했습니다. 수익화는 **프리미엄 구독(Freemium)**.

React + Vite. 실제로 동작하고, 브라우저 렌더까지 검증됨.

## 누구를 위한 앱인가 — 초보자 적합성

- **쉬운 말**: PER·분산투자 같은 개념을 한 줄로 풀어줌(용어 사전 + 한 줄 공부).
- **판단을 대신 요약**: 차트를 못 봐도 "📈 매수 / ⏸️ 관망 / 📉 매도 + 신뢰도 %"로 한눈에.
- **부담 없는 진입**: 무료로 핵심을 맛보고, 더 보고 싶을 때 월 9,900원.
- **안전장치**: 모든 예측에 "참고용 데모 · 투자권유 아님" 고지.

## 화면 (하단 탭 4개)

| 탭 | 내용 |
|---|---|
| 🏠 홈 | 인사 · 오늘의 시장 요약 · **오늘의 AI 추천**(공유 버튼) · 관심종목 · 한 줄 공부 |
| 🤖 AI예측 | 전 종목 매수/매도/관망 신호 + 신뢰도. 스레드 공유 CTA |
| 📊 종목 | 검색 + 목록 + 펼치면 AI 신호·기본정보·상세차트(Pro) |
| 👤 MY | 구독 상태 · 초보 공부 팁 · 쉬운 용어 사전 · 참고자료 |

## 무엇으로 돈을 버는가 (수익화)

freemium 구독입니다. 무료로 쓰다가 **Pro(월 9,900원)** 로 전환.

| | 무료 | Pro |
|---|---|---|
| AI 예측 | **상위 2개 종목만** | 전 종목 |
| 관심종목 | 3개 | 무제한 |
| 상세 차트·이동평균 | 🔒 | ✅ |
| 가격 알림 | 🔒 | ✅ |

**바이럴(홍보) 루프**: 홈/예측의 "공유"를 누르면 스레드에 올릴 **AI 예측 카드 + 해시태그 문구**가 만들어지고 클립보드에 복사됨(`#주식초보 #주식추천`). 공유 → 신규 유입 → 무료 사용 → Pro 전환.

### 실제 결제 (Stripe) — 돈 받기

`server/payments.js`가 Stripe Checkout 세션을 만듭니다. `.env`에 `STRIPE_SECRET_KEY`만 넣으면 **실결제**가 켜지고, 없으면 데모 업그레이드로 동작합니다(앱은 항상 작동).

```
[Pro 시작하기] → /api/checkout → Stripe 결제창 → 성공 시 ?paid=1 로 복귀 → Pro 활성화
```

- 키 발급: https://dashboard.stripe.com/apikeys → `STRIPE_SECRET_KEY=sk_live_...`
- 가격: 기본 ₩9,900/월 자동 생성. 대시보드에서 만든 가격을 쓰려면 `STRIPE_PRICE_ID=price_...`
- ⚠️ MVP는 복귀 시 클라이언트에서 Pro 처리합니다. **운영 시에는 Stripe 웹훅(checkout.session.completed)으로 서버 검증** 후 entitlement를 내려주도록 강화하세요(결제 위변조 방지).

### 신호 엔진 (RSI + 이동평균)

매수/매도/관망 신호는 장난감이 아니라 **공개 표준 기술적 지표**로 계산합니다 — `src/data/signals.js`.
- **RSI(14)**: 과매도(<30)면 "쌀 수 있음", 과매수(>70)면 "조심"
- **이동평균 크로스오버**: 단기(5) ≥ 장기(20) → 상승 추세
- 둘을 0~100 점수로 합쳐 🟢/🟡/🔴 3단계 + 쉬운 말 근거로 변환
- series만 실데이터로 바꾸면 동일 엔진이 그대로 동작 (참고: technicalindicators, debut-js/Indicators)

## 실행

```bash
cd stock-app
npm install
npm run dev      # http://localhost:5173 (모바일 화면 폭에 최적화)
npm run server   # (선택) 시세/결제 프록시 — 실 API/결제 쓸 때
npm test         # 수익화 게이팅 단위 테스트
npm run build    # 프로덕션 빌드
```

## 배포 (GitHub Pages)

`.github/workflows/deploy-pages.yml`가 푸시 시 자동으로 빌드→배포합니다. 정적 빌드는 백엔드 없이도 시뮬레이션으로 완전 동작하므로, 배포 링크만으로 전체 UX를 시연할 수 있습니다. (실 시세/결제는 백엔드 프록시를 띄우고 키를 넣을 때 활성화)

## 구조

```
src/
  data/
    market.js        시세 시뮬레이션 + predict()/topPick()/marketMood() (AI 신호 로직)
    education.js     초보 팁·용어 사전 (실제 입문 가이드 기반, 출처 포함)
  monetization/
    plans.js         티어/가격/기능 게이팅 + 단위테스트
    SubscriptionContext.jsx   전역 구독 상태 (localStorage)
  components/        BottomNav · PredictionRow · Sparkline · PaywallModal · ShareModal
  views/             HomeView · PredictView · StocksView · MyView
  App.jsx            탭 오케스트레이션 + 공유 상태
```

## 교육 콘텐츠 출처 (웹 검색 기반)

- [뱅크샐러드 — 초보 주식 하는 법](https://www.banksalad.com/articles/%EC%99%95%EC%B4%88%EB%B3%B4%EA%B0%80-%EC%A3%BC%EC%8B%9D%ED%88%AC%EC%9E%90%EB%A5%BC-%EC%8B%9C%EC%9E%91%ED%95%98%EB%8A%94-%EB%B2%95)
- [패스트캠퍼스 — 주식 입문 공부법 TOP4](https://fastcampus.co.kr/story_article_investtop4)

## 실제 시세 API 연결 (국내 + 해외)

키 노출·CORS 때문에 **백엔드 프록시**(`server/index.js`)를 두고, 프론트는 `/api/quotes`만 호출합니다. 키가 없으면 **시뮬레이션으로 자동 폴백**하므로 앱은 항상 동작합니다.

```
프론트(market 화면) → /api/quotes → 프록시(server) → provider(KIS/TwelveData/sim) → 실제 시세
```

### 실행 (2개 터미널)

```bash
# 터미널 A — 시세 프록시
cp .env.example .env          # 쓰려는 provider 키만 채우기
npm run server                # http://localhost:8787

# 터미널 B — 프론트 (개발 중 /api 를 8787로 프록시)
npm run dev                   # http://localhost:5173
```

키 없이 `npm run dev`만 켜도 동작합니다(시뮬레이션 폴백).

### provider 선택 (`.env`의 `DATA_PROVIDER`)

| 값 | 설명 | 국내 | 해외 | 필요한 것 |
|---|---|:--:|:--:|---|
| `sim` (기본) | 시뮬레이션 데이터 | – | – | 없음 |
| `twelvedata` | Twelve Data API | ✅ | ✅ | 무료 API 키 |
| `kis` | 한국투자증권 KIS | ✅ | ✅ | 증권계좌 + 앱키 (스캐폴드, TODO 채우면 동작) |

- **Twelve Data**: [twelvedata.com](https://twelvedata.com) 가입 → `TWELVEDATA_API_KEY` 설정 → `DATA_PROVIDER=twelvedata`. KRX(`005930:KRX`)와 미국(`AAPL`) 모두 지원. (무료 800req/일)
- **KIS**: [apiportal.koreainvestment.com](https://apiportal.koreainvestment.com)에서 앱 등록 → `KIS_APP_KEY/KIS_APP_SECRET`. 국내+해외 실시간. `server/providers/kis.js`에 토큰·현재가 호출 흐름이 주석으로 잡혀 있고 TODO만 채우면 됩니다.

### 다른 provider 추가하기

`server/providers/<name>.js`에 `export const name`과 `export async function getQuotes()`(앱 데이터 모양의 배열 반환)만 구현하고 `server/providers/index.js`에 등록하면 끝. 화면 코드는 손댈 필요 없습니다.

**데이터 모양** (provider가 맞춰야 할 형식):
```js
{ symbol, name, sector, price, prevClose, change, changePct, series:[...48], volume }
```

> ⚠️ KRX 실시간 시세를 외부에 보여주려면 **KRX/KOSCOM 시세 재배포 라이선스**가 필요할 수 있습니다. KIS 같은 정식 API는 약관 범위 내 사용이 전제입니다.

## 실서비스 전환 포인트

- **시세**: 지금은 시뮬레이션. `data/market.js`를 실데이터로 교체 시 **KRX/KOSCOM 시세 재배포 라이선스** 확인 필요.
- **예측**: `predict()`를 실제 모델/리서치 신호로 교체. 단, **개인별 종목·시점 추천은 국내 유사투자자문 규제** 검토가 선행돼야 함.
- **결제**: 데모 업그레이드 → Stripe(웹)/IAP(앱) + 서버 영수증 검증.
- 본 앱의 예측·분석은 **데모이며 투자권유가 아닙니다.**
