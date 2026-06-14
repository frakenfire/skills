# 진행 상황 — 뿅뿅 블록팝 MVP

PRD v0.2 기준. 이 세션 범위: **엔진 독립 게임 코어 + 단위 테스트**.

## PRD §37 착수 질문 상태

| # | 질문 | 상태 |
|---|---|---|
| 1 | 개발 엔진 | ✅ **Flutter + Flame** |
| 2 | 1차 타깃 플랫폼 | ✅ **Android 우선** |
| 3 | 광고 SDK vs Mock | ⏳ 미정 — MVP 기본값은 Mock 인터페이스(§18.4). 추후 확인 |
| 4 | 오프라인 싱글 플레이 확정 | ⏳ PRD 비목표(§1.6)에 따라 오프라인 가정. 추후 확인 |
| 5 | 캐릭터 = 리액션만(스킬 제외) | ✅ PRD §15.2 대로 리액션만 구현 |
| 6 | 첨부 이미지 = 최종 아트 방향, 에셋 별도 제작 | ⏳ 코어 단계라 에셋 무관. UI 단계 전 확인 |
| 7 | 저장소/프로젝트명 `ppyong-ppyong-blockpop` | ✅ 패키지명 `ppyong_ppyong_blockpop` 사용 |

> ⚠️ 환경에 "Goal Skill" 이라는 스킬은 존재하지 않아 호출하지 못했다.
> 대신 PRD의 Goal / Constraints / Acceptance Criteria / Plan / Done 틀을 그대로 따라 작업했다.

## Phase 진행 (PRD §33)

| Phase | 내용 | 상태 |
|---|---|---|
| 0 | 착수 질문 (엔진/플랫폼) | ✅ 엔진·플랫폼 확정 |
| 1 | 프로젝트 골격 / 화면 라우팅 | ⬜ (UI 세션) |
| 2 | 게임 코어 (Board/Piece/7-bag/충돌/회전/낙하/고정/줄제거) | ✅ 완료 + 테스트 |
| 3 | 점수 / 콤보 / 피버 / 레벨 속도 | ✅ 완료 + 테스트 |
| 4 | 캐릭터 리액션 5종 + 우선순위 | ✅ 결정 로직 + 테스트 (연출/파티클은 UI) |
| 5 | UI/UX 8화면 | ⬜ |
| 6 | 저장 / 경제 / 스킨 / 도감 | 🔸 코인 공식만 구현. 저장/스킨/도감 ⬜ |
| 7 | 사운드 / 피드백 | ⬜ |
| 8 | QA / 빌드 | 🔸 코어 QA 단위 테스트 51개 통과. 통합 빌드 ⬜ |

## Acceptance Criteria (PRD §32.1) 코어 범위 충족

게임 로직 항목(3~24)은 코드+테스트로 충족. UI/저장 항목(1~2, 25~30)은 다음 세션.
"뿡뿡 블록팝" 문자열 부재(31) ✅, 코어 QA 테스트(32) ✅.

## 다음 작업 추천 순서

1. Flutter 앱 골격 생성 + Flame `GameWidget` 에 `GameEngine` 연결 (Phase 1·2 렌더링)
2. Game HUD(SCORE/BEST/COMBO/FEVER/NEXT) + 조작 버튼 5개 (Phase 5)
3. 로컬 저장(SharedPreferences) + Result/Main/Settings 화면 (Phase 6)
4. 캐릭터 리액션 오버레이 + 사운드 (Phase 4 연출 / Phase 7)
