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

## 실행

```bash
cd stock-app
npm install
npm run dev      # http://localhost:5173 (모바일 화면 폭에 최적화)
npm test         # 수익화 게이팅 단위 테스트
npm run build    # 프로덕션 빌드
```

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

## 실서비스 전환 포인트

- **시세**: 지금은 시뮬레이션. `data/market.js`를 실데이터로 교체 시 **KRX/KOSCOM 시세 재배포 라이선스** 확인 필요.
- **예측**: `predict()`를 실제 모델/리서치 신호로 교체. 단, **개인별 종목·시점 추천은 국내 유사투자자문 규제** 검토가 선행돼야 함.
- **결제**: 데모 업그레이드 → Stripe(웹)/IAP(앱) + 서버 영수증 검증.
- 본 앱의 예측·분석은 **데모이며 투자권유가 아닙니다.**
