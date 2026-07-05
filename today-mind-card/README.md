# 오늘의 마음 한 장 (today-mind-card)

토스 **앱인토스(Apps in Toss)** 웹뷰용 **무비용·광고형 위로 카드 미니앱** MVP.
사용자가 고민·감정·상황을 고르면, 카드 한 장으로 짧은 위로와 오늘의 문장을 받고
저장·공유할 수 있어요. **실제 생성형 AI / 서버 / DB 없이** 선택값과 카드 데이터만으로 동작합니다.

> 이 프로젝트는 `PRD: 오늘의 마음 한 장`(§0~§21)의 MVP 구현체입니다.

## 핵심 원칙 (PRD 준수)

- **AI API 호출 없음** — 결과는 `category + emotion + state + card + dateSeed` 조합으로 생성 (`src/lib/generateReading.ts`)
- **서버/DB/로그인 없음** — 상태는 React state, 기록은 `localStorage`(선택형 enum만)
- **개인정보 저장 없음** — 이름·연락처·생년월일·자유 입력 고민 원문 저장 금지 (`src/lib/storage.ts`)
- **위로·희망 중심 톤, 해요체** — 의료 진단/심리치료/법률·금융 조언 및 단정 표현 금지 (PRD §5.3)
- **광고는 mock** — 실제 SDK 연동 전까지 `Promise<boolean>` mock (`src/lib/ads.ts`)
- **디자인** — Primary `#114e48`(SIGNATURE GREEN), 보조 강조 `#ff4b00`, 375px 기준·360~430px 대응

## 화면 흐름 (PRD §7.1)

```
Start → Category → Emotion → State → CardPick → Result → Detail → Share/Retry
```

무료 결과 3줄은 광고 없이 제공하고, 상세 위로·한 문장·저장·다시 뽑기만 보상형 광고 지점입니다.
시작 화면 진입 직후에는 광고·바텀시트를 띄우지 않습니다(다크패턴 방지, PRD §6.1).

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 타입체크 + 프로덕션 빌드 → dist/
npm run preview
```

## 폴더 구조 (PRD §14)

```
src/
  App.tsx                 # 화면 상태 머신 + 광고/토스트 오케스트레이션
  main.tsx
  styles/                 # tokens.css(디자인 토큰) · globals.css
  components/             # AppLayout · BottomAction · ChoiceButton · CardTile
                          # ReadingCard · Disclaimer · AdNotice
  screens/                # Start · Category · Emotion · State · CardPick · Result · Detail
  data/                   # cards(24장) · categories · emotions · states · copy
  lib/                    # ads(mock) · dateSeed · generateReading · storage · share · saveImage
  types/                  # reading.ts
```

## 앱인토스 배포로 넘어갈 때 (PRD §13.3 / §19)

이 저장소는 프레임워크 독립적인 **React + TypeScript + Vite** MVP입니다.
실제 앱인토스 출시 시에는 아래로 감싸 옮기세요.

1. `npx create-ait-app today-mind-card` (template: `react-ts`, TDS: Y, examples: 인앱 광고)
2. `src/` 구현을 그대로 이식하고, TDS 컴포넌트로 기본 레이아웃 교체
3. `src/lib/ads.ts` 의 mock 을 실제 앱인토스 광고 SDK 호출로 교체
4. `@apps-in-toss/web-framework` 설정(`appName`, `brand.primaryColor: '#114e48'`)로 `vite.config.ts` 대체
5. 테스트 1회 이상 완료 후 콘솔에서 검토 요청 (영업일 기준 최대 3일)

## 라이선스

내부 프로토타입.
