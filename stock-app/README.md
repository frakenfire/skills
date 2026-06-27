# StockPulse — 주식정보 웹앱 (Freemium 수익화 내장)

React + Vite로 만든 **실제 동작하는** 주식정보 웹앱. 수익화 모델로 **프리미엄 구독(Freemium)** 을 코드에 내장했습니다.

## 무엇으로 수익을 내는가 (수익화 구조)

무료로 시작해서 **Pro 구독(월 9,900원)** 으로 전환시키는 freemium 모델입니다.

| 구분 | 무료 | Pro (9,900원/월) |
|---|---|---|
| 기본 시세 · 스파크라인 | ✅ | ✅ |
| 관심종목 | **3개 한도** | 무제한 |
| 상세 차트 (이동평균·면적) | 🔒 | ✅ |
| AI 종목 분석 리포트 | 🔒 | ✅ |
| 실시간 가격 알림 | 🔒 | ✅ |
| 업셀 배너 / 광고 | 노출 | 제거 |

전환 지점(페이월)이 뜨는 트리거:
1. 잠긴 Pro 기능(상세차트·AI분석·알림) 클릭
2. 무료 관심종목 4번째 추가 시도
3. 상단/배너의 업그레이드 버튼

수익화 로직은 한곳에 모여 있어 교체가 쉽습니다.
- `src/monetization/plans.js` — 티어·가격·기능 게이팅 정의 (단일 진실 공급원)
- `src/monetization/SubscriptionContext.jsx` — 구독 상태 + 결제 흐름(현재는 데모 결제, 실제로는 Stripe/IAP로 교체)
- `src/components/PaywallModal.jsx` — 전환 화면

## 실행

```bash
cd stock-app
npm install
npm run dev      # http://localhost:5173
```

기타 명령:
```bash
npm test         # 수익화 게이팅 단위 테스트 (vitest)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 구조

```
src/
  data/market.js                  시세 데이터 레이어 (데모는 시뮬레이션 → 실제는 KRX/벤더 API로 교체)
  monetization/
    plans.js                      티어/가격/기능 게이팅 + 단위테스트
    SubscriptionContext.jsx       전역 구독 상태 (localStorage 영속)
  components/
    Sparkline.jsx                 의존성 없는 SVG 미니차트
    StockDetail.jsx               종목 상세 (Pro 게이팅 포함)
    PaywallModal.jsx              페이월/결제 모달
  App.jsx                         메인 레이아웃 (목록·상세·관심종목)
```

## 데모 한계와 실서비스 전환 포인트

- **시세**: 현재는 시드 기반 시뮬레이션. 실서비스에선 `data/market.js`를 실데이터 소스로 교체하고, **KRX/KOSCOM 등 시세 재배포 라이선스**를 확인해야 합니다.
- **결제**: 현재는 가짜 업그레이드. 실서비스에선 Stripe(웹)·Apple/Google IAP(앱)로 교체하고, 서버에서 영수증 검증 후 entitlement를 내려줘야 합니다.
- 본 앱의 분석/시그널은 **데모이며 투자권유가 아닙니다.** 개인화 시그널을 넣을 경우 국내 유사투자자문 규제 검토가 필요합니다.
