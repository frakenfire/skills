# 진행 상황 — 뿅뿅 블록팝 MVP

PRD v0.2 기준. 엔진 **Flutter + Flame**, 1차 타깃 **Android**.

## 검증 상태 (이 환경에서 실제 실행)

- `flutter analyze` → **No issues found**
- `flutter test` → **56개 통과** (코어 QA 51 + 저장 직렬화 + 위젯 스모크 3)
- `flutter build web --release` → **빌드 성공** (전체 앱 end-to-end 컴파일 확인)

> Android APK 빌드는 이 환경에 Android SDK가 없어 미수행. 코드 컴파일/링크는 web 빌드로 검증됨.

## PRD §37 착수 질문 상태

| # | 질문 | 상태 |
|---|---|---|
| 1 | 개발 엔진 | ✅ Flutter + Flame |
| 2 | 1차 타깃 플랫폼 | ✅ Android (android/ 스캐폴딩 생성, web도 추가) |
| 3 | 광고 SDK vs Mock | 🔸 Mock 인터페이스로 구현(결과 코인 2배). 실제 SDK 추후 확인 |
| 4 | 오프라인 싱글 플레이 확정 | 🔸 오프라인 가정으로 구현. 확정 확인 필요 |
| 5 | 캐릭터 = 리액션만 | ✅ 리액션만 (PRD §15.2) |
| 6 | 이미지=최종 아트, 에셋 별도 제작 | 🔸 현재 색상/이모지 플레이스홀더. 실제 에셋 연결 지점 마련 |
| 7 | 프로젝트명 `ppyong-ppyong-blockpop` | ✅ `ppyong_ppyong_blockpop` |

> ⚠️ 환경에 "Goal Skill" 스킬이 없어 호출 불가. PRD의 Goal/Constraints/AC/Plan/Done 틀을 그대로 따름.

## Phase 진행 (PRD §33)

| Phase | 내용 | 상태 |
|---|---|---|
| 0 | 착수 질문 (엔진/플랫폼) | ✅ |
| 1 | 프로젝트 골격 / 화면 라우팅 | ✅ Splash→Main→Game→Result + Pause/Settings/Shop/Collection |
| 2 | 게임 코어 | ✅ (pure Dart, 테스트 완료) |
| 3 | 점수/콤보/피버/레벨 속도 | ✅ |
| 4 | 캐릭터 리액션 5종 + 오버레이 | ✅ 결정 로직 + 등장 애니메이션(이모지/말풍선). 전용 아트/파티클 ⬜ |
| 5 | UI/UX 화면 | ✅ HUD(SCORE/BEST/COMBO/FEVER/NEXT) + 조작 버튼 5개 + 8화면 |
| 6 | 저장/경제/스킨/도감 | ✅ SharedPreferences 저장, 코인, 스킨 구매·적용, 도감 해금 |
| 7 | 사운드/피드백 | 🔸 햅틱 연결 + 사운드 훅(설정 ON/OFF 반영). 실제 오디오 에셋 ⬜ |
| 8 | QA/빌드 | 🔸 코어 QA 56 테스트 통과 + web 빌드. Android 빌드/실기기 QA ⬜ |

## Acceptance Criteria (PRD §32.1)

게임 로직(3~24), 화면 흐름(1~2), 결과/저장(25~30), 금지표기 부재(31), QA(32) — MVP 핵심 충족.
제스처 조작(§8.2), 튜토리얼(§28), 실제 오디오/아트 에셋은 후속.

## 남은 작업 (다음 세션 추천)

1. 실제 아트 에셋(캐릭터/블록/배경 PNG) + 사운드(wav) 연결 — 현재 플레이스홀더 교체
2. 제스처 조작 모드(§8.2) 구현
3. 최초 1회 튜토리얼(§28)
4. Android 빌드 환경에서 실기기 QA(§30 성능 기준)
5. 광고 SDK 실제 연동 여부 확정 후 교체(§18.4)
