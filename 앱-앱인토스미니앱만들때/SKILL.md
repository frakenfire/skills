---
name: appsintoss-miniapp
description: 토스 앱인토스(Apps in Toss) 웹 미니앱을 처음부터 출시까지 빠르게 찍어내는 스킬. granite.config 세팅, 리워드 광고·알림·공유·뒤로가기 SDK 연동, 검토 반려 단골 사유 사전 차단, ait build → 콘솔 업로드 → 테스트 링크 → 검토 요청을 콘솔 세션 API로 자동화, 미리보기 아티팩트 배포까지. "앱인토스", "토스 미니앱", "토스 인앱", "ait build", "ait deploy", "콘솔에 올려", "검토 요청", "반려 사유", "intoss://", "granite.config", "리워드 광고 그룹", "알림동의문" 같은 말이 나오면 반드시 이 스킬을 쓴다.
---

# 앱인토스 미니앱 양산 스킬

한 번 출시까지 가면서 실제로 겪은 반려·함정을 규칙으로 박아 둔 것이다.
새 미니앱은 이 순서대로만 가면 검토 1회 통과를 노릴 수 있다.

## 0. 먼저 알아둘 것 (전부 실제로 겪은 일)

| 함정 | 규칙 |
|---|---|
| 검토 반려 ① 첫 화면 뒤로가기로 앱이 안 닫힘 | `graniteEvent.addEventListener('backEvent')` 구독 + 첫 화면에서 `closeView()` |
| 검토 반려 ② 토스 내비 바 뒤로가기 + 자체 헤더 ‹ 중복 | **자체 헤더·뒤로가기 버튼 금지.** 뒤로가기는 토스 바 하나 |
| 광고가 예고 없이 뜸 → "이상하다" | 광고 전 화면에 `[광고]` 배지 + 로딩 마지막 멘트로 예고, 읽을 틈(≈1.2s) 주고 띄움 |
| 광고 봐야만 내용이 열림 → 심사 위험 | 광고 실패·미지원·닫기여도 본 흐름은 열린다. 보상은 `userEarnedReward` 때만 |
| 기능성 알림 캠페인은 "서비스 운영 중"에만 등록됨 | **첫 출시는 알림 없이.** 동의문만 만들어 두고 출시 후 캠페인 등록 → 다음 버전 |
| 알림동의문 발송 시점에 시각이 없으면 캠페인 AI 검수 탈락 | "매일 오전 10시, …" 처럼 **구체 시각**을 문구에 넣는다 |
| `templateCode` 를 동의문 ID 로 착각 | `templateCode` = 그 동의문에 연결된 **기능성 캠페인의 발송 코드** (`{appName}-xxx`) |
| 크롬 콘솔 탭이 가려지면 다이얼로그가 안 그려짐 (`visibilityState: hidden`) | 콘솔 작업은 **화면 대신 세션 API** ([references/console-api.md](references/console-api.md)) |
| 콘솔 시간 선택기 스크롤이 안 먹음 | 시간은 contenteditable spinbutton 에 포커스 후 숫자 타이핑 |
| 윈도우에서 검사 스크립트가 거짓 통과/실패 | `fileURLToPath`, `node:path/posix`, test glob 은 큰따옴표 ([§7](#7-윈도우에서-돌릴-때)) |
| 저장된 내 정보 때문에 다른 사람 걸 못 봄 | 시작 버튼 누를 때 "○○님 정보로 볼까요 / 새로 입력" 바텀시트 |
| 공유 글이 길고 "너는 몇 점인지 봐봐" | 결과 한 줄 + **"나도 보러가기"** + `getTossShareLink` 링크 |

## 1. 콘솔 준비 (사람이 한 번)

1. 앱인토스 콘솔 → 워크스페이스 → 앱 등록. **appName(앱 ID)** 과 **한국어 앱 이름**을 정한다.
2. 앱 정보: 로고 업로드 → 이미지 URL 이 `static.toss.im/appsintoss/<workspace>/<uuid>.png` 로 생긴다.
3. 인앱 광고 → 광고 그룹 생성 → 유형 **리워드**, 보상 단위·수량 입력, "확인했어요" 체크 → 등록.
   - SDK 에 넣는 `adGroupId` 는 콘솔 광고 그룹의 `groupId` (`ait.v2.live.xxxxxxxx`).
   - 생성 직후는 "구글 반영 중". 상태 ENABLED 가 되면 쓸 수 있다.
4. 알림이 필요하면 스마트 발송 → 알림동의문만 먼저 만든다(발송 시점에 구체 시각). 캠페인은 출시 후.
5. API 키(`npx ait token add`)는 **사용자가 직접**. 에이전트는 화면에서 키를 읽거나 파일·대화에 남기지 않는다.
   콘솔 세션 API 로 올리면 API 키 없이도 된다.

## 2. 프로젝트 골격

```
granite.config.ts   appName, brand.displayName(콘솔과 글자까지 동일), brand.icon(static.toss.im URL),
                    web.commands.build = 'tsc -b && vite build', outdir 'dist', webViewProps.type 'partner'
src/lib/toss.ts     브릿지 어댑터 — 모든 SDK 호출을 try/catch + isSupported 로 감싸 브라우저에서도 안전
src/lib/ads.ts      AD_GROUPS = { 자리: 'ait.v2.live…' }, 'REPLACE_' 면 호출 차단
src/lib/share.ts    INTOSS_APP_SLUG = appName, getTossShareLink('intoss://<appName>/<path>')
scripts/            check-release(제출 전 필수값), apply-console-values(콘솔 값 주입), check-no-mock …
```

- `@apps-in-toss/web-framework` 를 import 하는 파일은 몇 개로 고정하고 테스트로 못 박는다(게이팅 누락 방지).
- 개발 중 광고는 문서의 테스트 광고 ID, 운영 번들에 mock 이 섞이면 빌드 가드로 실패시킨다.

## 3. SDK 연동 규칙

### 뒤로가기 (반려 단골)
```ts
import { graniteEvent, closeView } from '@apps-in-toss/web-framework';
export function subscribeBackEvent(handler: () => void) {
  try { return graniteEvent.addEventListener('backEvent', { onEvent: handler, onError: () => {} }); }
  catch { return () => {}; }
}
// App: 구독하면 토스가 대신 안 닫아준다
function handleHardwareBack() {
  if (screen === 'home') { if (sheetOpen) closeSheet(); else void closeView().catch(() => {}); return; }
  goBack(); // 앱 내부 화면 스택
}
```
- 화면 레이아웃에 **‹ 버튼·화면 제목 헤더를 그리지 않는다.** 위 Safe Area 여백만 둔다.
- 회귀 테스트: 레이아웃 소스에 `onClick={onBack}` 가 없고, App 의 home 분기에 `closeView` 가 있는지 소스로 검사.

### 리워드 광고
- `loadFullScreenAd` → `showFullScreenAd`, 보상은 `userEarnedReward` 이벤트에서만. dismissed/failed/unsupported 를 보상으로 위장 금지.
- 광고 자리 버튼에 `[▷ 광고]` 배지. 자동으로 뜨는 광고(결과 전 등)는 **그 전 화면 제목 밑 안내 박스** + 로딩 마지막 멘트 "광고가 끝나면 결과가 열려요".
- 광고를 못 봐도 핵심 결과는 연다. 한 흐름에 광고 두 번 금지.

### 공유
- 문구: `서비스명 · 주제 점수` / `"한 줄"` / 빈 줄 / `나도 보러가기` → 뒤에 딥링크.
- 개인정보(생년월일 등)·설명문·명령조("~해봐") 금지.

### 알림
- `requestNotificationAgreement({ options: { templateCode }, onEvent, onError })` — 템플릿 코드 없으면 기능 자체를 숨긴다.
- 사용자가 직접 누를 때만 동의 UI. 앱이 먼저 띄우지 않는다.

### 저장된 개인 정보
- 이름·생년월일은 기기에만 저장. 시작 버튼 → 저장값이 있으면 바텀시트로 "○○님으로 볼게요 / 다른 사람 정보 새로 입력할게요".
- 홈 구석 밑줄 링크로 숨기지 않는다(못 찾는다, 토스답지 않다).

## 4. 디자인 (토스다움)

- 폰트 Pretendard 셀프호스팅(외부 폰트는 CSP 에 막힌다), 색은 TDS 팔레트 토큰만, 글자 크기·행간은 `@toss/tds-typography` 표(13/19.5, 15/22.5, 17/25.5, 20/29 …), 굵기 ≤700.
- 버튼: primary(파랑, 54px), weak(회색 바탕 `--gray-100`). 바텀시트는 위 모서리 20px, 아래 Safe Area 더함.
- 안내는 옅은 회색 박스(`--gray-50`, 12px 라운드, 13px/600). 작은 회색 줄 하나로 두면 실기기에서 아무도 못 본다.
- 이모지 UI 금지(항목 아이콘 데이터만), 한자 화면 노출 금지, 말줄임표 문자 금지 — 검사 스크립트로 고정.

## 5. 출시 파이프라인

```
npm run verify                         # 타입·테스트·번들 정책·디자인 검사 전부
node scripts/check-release.mjs --release
npm run build                          # ait build → <appName>.ait, 로그에 deploymentId
```
1. **업로드**: 콘솔 세션 API (initialize → PUT → complete). 절차와 스니펫은 [references/console-api.md](references/console-api.md).
2. **빌드 대기**: 상태가 "빌드 중" → "검토 필요"(보통 1분 안팎).
3. **테스트 링크**: `intoss-private://<appName>?_deploymentId=<id>` — QR 로 만들어 사용자에게 준다(qrcodejs CDN 으로 HTML 한 장). 실기기 테스트는 사람만 할 수 있다(토스 로그인).
4. **검토 요청**: `POST …/bundles/reviews` `{ deploymentId, releaseNotes }` (필드명 **복수형**). 화면에서는 "테스트 먼저" 를 강제하지만 API 는 받는다 — 그래도 실기기 1회 확인을 권한다.
5. **같은 앱에 검토 중인 버전은 하나만.** 이전 요청은 `…/bundles/reviews/withdrawal` 또는 화면의 "요청 취소". "검토 필요" 는 요청 전 상태라 둬도 된다(삭제 기능 없음).
6. **승인 후 출시 버튼은 반드시 사용자 확인 받고** 누른다.
7. 반려되면 사유를 [references/review-rejections.md](references/review-rejections.md) 에 추가하고, 고친 뒤 회귀 테스트를 하나 남긴다.

출시 노트: 서비스 한 줄 + 광고가 어디서 어떻게 나오는지 + 없는 기능(로그인·결제·알림) + 지난 반려 수정 내용.

## 6. 사용자에게 보여주기 (미리보기 아티팩트)

실기기 전에 눌러 보게 하려면 웹 번들을 아티팩트로 올린다.
```
npx vite build --base ./ --outDir <scratch>/preview --emptyOutDir
```
- index.html 의 `<!doctype>/<html>/<head>/<body>` 와 **CSP meta** 를 빼고 `<title>`, script, link, `<div id="root">` 만 남긴다.
- `assets/*` 를 files 로 함께 publish. 다음부터는 바뀐 `index-*.js/css` 만 교체(옛 파일은 null).
- 미리보기에서는 실제 광고·토스 공유창이 안 뜬다고 말해 준다.

## 7. 윈도우에서 돌릴 때

- `new URL(x, import.meta.url).pathname` → `/C:/...` 라 파일을 못 찾는다. `fileURLToPath(...)` + `.replace(/\\/g, '/')`.
- 경로 비교 스크립트는 `import { join } from 'node:path/posix'`.
- `node --test 'src/**/*.test.ts'` 의 작은따옴표는 cmd 에서 안 풀려 **테스트 0개로 통과**한다 → `\"src/**/*.test.ts\"`.
- 셸 heredoc/sed 로 백슬래시 정규식을 쓰지 말고 파일 편집 도구로.

## 8. 콘솔 화면을 직접 다룰 때 (Claude in Chrome)

- 탭이 가려지면(`document.visibilityState === 'hidden'`) 모달·드롭다운·시간 선택기가 안 움직인다. 가능하면 API 로, 아니면 사용자에게 크롬 창을 **한 귀퉁이라도 보이게** 해 달라고 한다.
- 입력은 `find` 로 ref 를 받아 클릭 후 타이핑. `ctrl+a` 는 이 환경에서 글자 'a' 로 들어갈 수 있어 `triple_click` 으로 선택한다.
- 등록·검토 요청·동의 체크처럼 되돌릴 수 없는 버튼은 값 확인 후 사용자 승인을 받고 누른다.
- 로그인이 풀리면 사용자가 직접 로그인한다. 비밀번호·API 키는 다루지 않는다.
