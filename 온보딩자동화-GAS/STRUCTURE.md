# 온보딩/수습 운영 자동화 시스템 — 구도 파악 (Apps Script)

> gas-deploy 스킬(`환경-GAS스크립트배포할때/SKILL.md`) 방식대로 `clasp clone`으로
> 비공개 Apps Script 코드를 받아 구조를 정리한 문서.
> 이 저장소(`gas-project`)는 skills 저장소와 분리된 **GAS 전용 독립 저장소**입니다.

## 연결 정보
- **Spreadsheet ID**: `1dcrCO1bOQqFTjgYTO84i2mcrGbzyfKOmMlzVfIDs_Kg`
- **Apps Script ID**: `1y3TP7fwJkTLzFEXpBTZkQKTtGyPiG6efWeBOmJbbfjlOVREVIUXXtHMF`
- **인증 계정**: `ys.lee@pcalm.co.kr` (clasp OAuth, `~/.clasprc.json`)
- **시간대**: Asia/Seoul / 런타임: V8 / 예외 로깅: STACKDRIVER

## 한눈에 보는 흐름
```
직원 마스터 시트(연동)  ──(01 동기화)──▶  온보딩 대상자 시트
                                            │
        ┌───────────────────────────────────┼───────────────────────────┐
   (02) 만족도 설문 발송              (03) 미션/수습평가 안내 발송   (04) 수습상태 정합성 점검
   D+3/7/30/60/90                    시작/1차/2차/3차(D+30/60/90)        과거 미정리 자동 정리
        │                                    │                           │
        └──────────────▶ (05) 운영관제: 발송결과 Google Chat 보고 ◀──────┘
                                  │
   (06) 소통창고 Form 응답 처리 + SLA   (07) 비재직자 캘린더 일정 정리
                                  │
           설문 응답_통합(A31 LET 수식) ──▶ 온보딩_대시보드
```

## 공통 설정 (`00_공통설정_유틸.gs.js`, 447줄)
`CFG` 객체가 시트명 단일 진실원천:
- `SHEET_MAIN` = `온보딩 대상자`
- `SHEET_EMP_MASTER` = `직원 마스터 시트 (연동)` (헤더가 **6행**)
- `SHEET_META` = `부서 메타 데이터`
- `SHEET_COMM` = `소통 창고`
- `SHEET_RESPONSES` = `설문 응답_통합`
- `SHEET_SCHEDULE` = `설문 발송 스케줄`
- `SHEET_TEMPLATE` = `메일 템플릿`

핵심 유틸: `getSheet`, `toKST`, `addBusinessDays`, `logToSheet`, `notifyChat`(Google Chat),
`getAutomationTriggerAudit_`, `onOpen`(메뉴), `installAllTriggers`(전체 트리거 일괄 설치).
트리거 감사용 상수: `AUTOMATION_CURRENT_HANDLERS_`, `AUTOMATION_LEGACY_TIME_HANDLERS_`.

## 모듈 구조 (엔트리포인트 = 트리거 핸들러)

| 파일(줄수) | 트리거 엔트리포인트 | 역할 |
|---|---|---|
| 01_인원동기화 (822) | `refreshProbationRosterOnly`(시간), `onRosterSheetEdit`(ON_EDIT), `onRosterSheetChange`(ON_CHANGE) | 직원 마스터→온보딩 대상자 동기화. 사번 기준 갱신/신규추가, D+30/60/90 예정일·발송·평가 기본값 세팅. A열 채번/완료열은 수식이라 직접 안 씀 |
| 02_온보딩 만족도 발송 (1270) | `runOnboardingSurveyAutomation`(시간) | D+3/7/30/60/90 만족도 설문 메일 발송. 템플릿 시트 기준, 재직/수습자만, D+30 진입자에겐 D+3/7 미발송 |
| 03_온보딩 미션 안내 발송 (1042) | `runOnboardingMissionGuideAutomation`(시간) | 미션/수습평가 안내(시작/1·2·3차) 발송, 평가 완료 전까지 리마인드 |
| 04_상태동기화_보관 (788) | `runProbationConsistencyCheck`(시간) | 수습상태 정합성 점검. 마스터 기준 재직/수습자만 처리, 그 외는 로그만. 예정일 경과 미처리 후보 기록 |
| 05_온보딩운영관제 (234) | `onSurveySubmit`(Form 제출) | 02/03 발송 결과를 Google Chat 카드로 즉시 보고. 설문 제출 수신 처리 |
| 06_소통창고 (68) | `onCommunicationSubmit`(Form 제출) | 소통창고 Form 응답 처리, SLA 처리기한 자동계산, 긴급/막힘 Chat 알림 |
| 07_캘린더정리 (439) | `runCalendarCleanupForInactiveEmployees`(시간) | 비재직/비수습자의 향후 수습평가 캘린더 일정 정리. 예정일+성명+차수 제목 패턴 탐색 |

각 모듈은 동일 패턴의 보조 함수 보유: `preview*`(읽기 전용 시뮬레이션), `install*Trigger`/`remove*Trigger`,
`*_normalizeEmpId_`/`*_normalizeEmail_`/`*_parseDateOnly_`/`*_isActiveEmployee_` 등.

## 진단 (`99_진단.gs.js`, 105줄)
- `diagnoseFull` — 주요 시트 존재/헤더/행수 점검
- `diagnoseTemplateKeys` — 메일 템플릿 A열(구분) 키 목록
- `diagnoseTriggers` — 현재 설치된 트리거 전체 덤프

## 검증 하네스 (`Harness_검증하네스.gs.js`, 716줄)
- `doPost(e)` — **웹앱 진입점**. `action`: `runHarness` | `installTriggers` | `getD7Url` | `testSurveySubmitCard`. JSON 응답
- `Harness_onboardingSystem_dryRun` — 전체 무해 검증. `fail(severity, area, msg, evidence, fixHint)` 수집기로 BLOCKER/WARN 누적
- 개별 점검: `Harness_checkSheets_`, `Harness_checkSurveyFormula_`(설문 응답_통합 **A31 LET 수식** + 5개 원천탭 참조 + A2:AC30 정적영역 검사), `Harness_checkDashboard_`(온보딩_대시보드 D+3/7/30/60/90 지표), `Harness_checkAppsScript_`, `Harness_checkTriggers_`, `Harness_runPreviewRoster_`, `Harness_runPreviewCalendarCleanup_`
- `Harness_cleanupLegacyTriggers` — 레거시 트리거 제거
- `Harness_getSS()` — 스프레드시트 ID 하드코딩(`1dcrCO...`)

설문 통합 원천 5개 탭: `설문지 응답_D+3/D+7/D+30/D+60/D+90` → A31 단일 LET 수식으로 통합.

## OAuth 스코프 (`appsscript.json`)
`spreadsheets`, `script.external_request`, `drive`, `gmail.send`, `calendar`,
`script.scriptapp`, `userinfo.email`
- `executionApi.access`: ANYONE
- `webapp`: `executeAs: USER_DEPLOYING`, `access: ANYONE`

## 로컬 개발 보조 스크립트 (GAS 아님, clasp가 함께 받음)
`runHarnessWebapp.js`(웹앱 POST 러너), `decoder.js`, `fix_json.js`,
`runWithClaspToken.js`, `test_sheets.js`

## 스킬 체크리스트와의 관계
`환경-GAS스크립트배포할때/SKILL.md` [5단계]의 "7대 필수 트리거"가 이 프로젝트와 일치:
`refreshProbationRosterOnly`, `onRosterSheetEdit`, `onRosterSheetChange`,
`runOnboardingSurveyAutomation`, `runOnboardingMissionGuideAutomation`,
`runProbationConsistencyCheck`, `onCommunicationSubmit` → **이 스킬은 본 프로젝트 기준으로 작성됨.**
(단 스킬엔 07 캘린더정리·05 onSurveySubmit 트리거는 빠져 있어, 트리거 점검 시 코드 기준으로 보강 필요.)
```
```
