---
name: gas-deploy
description: Google Apps Script and clasp production deployment. Use when working on Apps Script projects — clasp push/deploy/run, installable triggers, time-driven automations, Google Chat/Gmail/Sheets automation, or verifying and repairing triggers without manual UI interaction, with 5x robust verification.
---

# Google Apps Script / clasp 운영 배포 & 5회 연속 신뢰성 검증

## Core Rules

- **검증되지 않은 코드는 존재하지 않는다**: 완료 기준은 '실행'이 아니라 '물리적 검증'이다.
- **5회 반복 검증 (5x Robustness Verification)**: 시스템의 정합성과 일관성을 담보하기 위해, 배포 전후로 Headless 검증 하네스(doPost API Executable 등)를 **최소 5회 연속 실행**하여 모든 결과가 `BLOCKER: 0` 및 완벽하게 동일한 결과값(`ok: true`)을 유지하는지 교차 확인한다.
- **보안 및 권한 격리**: OAuth 인증 파일(`C:\Users\fpdlw\.clasprc.json`), GCP 서비스 계정 키 파일(`C:\Users\fpdlw\Downloads\tribal-affinity-469010-c4-*.json`) 등 중요 크리덴셜은 로컬 스토리지에 격리하고 절대로 Git 저장소에 커밋하지 않는다.
- **clasp 실행 권한 격리 및 자기복구**: `clasp push` 업로드 성공이 원격 함수 실행 성공을 보장하지 않으므로, API Executable 배포, access 설정(`ANYONE` / `ANYONE_ANONYMOUS`), OAuth 스코프 점검을 철저히 수행하여 예외 발생 시 자기복구(Self-recovery)가 가능하도록 한다.
- Treat `clasp push`, `clasp deploy`, and `clasp run` as separate capabilities with separate prerequisites.
- Before using `clasp run`, check the official clasp docs/GitHub requirements: `.clasp.json` `projectId`, API Executable deployment, `executionApi.access`, OAuth client, Apps Script API, and required OAuth scopes.
- Do not create temporary public web apps, anonymous maintenance endpoints, hardcoded token endpoints, or backdoor-style execution routes unless explicitly requested.
- Prefer self-repairing, idempotent Apps Script code that can run through existing triggers or safe existing execution paths.
- Never report completion until code is pushed and the available verification path has run or the remaining verification gap is explicit.

---

## 프로젝트 SSOT (Single Source of Truth) 상수

```
scriptId:       1y3TP7fwJkTLzFEXpBTZkQKTtGyPiG6efWeBOmJbbfjlOVREVIUXXtHMF
projectId:      tribal-affinity-469010-c4
SpreadsheetId:  1dcrCO1bOQqFTjgYTO84i2mcrGbzyfKOmMlzVfIDs_Kg
clasp auth:     C:\Users\fpdlw\.clasprc.json
gcp key path:   C:\Users\fpdlw\Downloads\tribal-affinity-469010-c4-ce440c664a53.json
                C:\Users\fpdlw\Downloads\tribal-affinity-469010-c4-f219ca32d30b.json
```

---

## 표준 배포 & 5회 검증 흐름

### 1. 코드 변경 및 clasp push
- 최소(surgical) 변경을 원칙으로 하며, 정상 동작 중인 기존 코드를 임의로 전면 재작성하지 않는다.
- 변경 완료 후 `clasp push`를 실행하여 코드를 업로드한다.
```bash
clasp push --force
```

### 2. Headless 하네스 5회 연속 검증 실행
- 로컬 Node.js 테스트 실행 환경 또는 curl/HTTP 요청을 활용하여 API Executable로 배포된 `doPost` 엔드포인트를 호출, `runHarness` 액션을 실행한다.
- 5회 연속 호출 시 단 한 번이라도 `BLOCKER`가 발생하거나, 응답 결과가 일치하지 않으면 배포 실패로 간주하고 즉시 롤백 및 디버깅을 수행한다.

#### Node.js 기반 검증 하네스 실행 예시:
```bash
# 5회 연속 검증 루프 실행
node runHarnessWebapp.txt runHarness
```

#### PowerShell/curl 기반 직접 호출 검증:
```powershell
# C:\Users\fpdlw\.clasprc.json 에서 access_token 추출
$raw = Get-Content "C:\Users\fpdlw\.clasprc.json" -Raw | ConvertFrom-Json
$token = $raw.tokens.default.access_token
$scriptId = "1y3TP7fwJkTLzFEXpBTZkQKTtGyPiG6efWeBOmJbbfjlOVREVIUXXtHMF"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# runHarness 액션을 doPost로 전송하여 5회 반복 검사 수행
for ($i = 1; $i -le 5; $i++) {
    $response = Invoke-RestMethod -Uri "https://script.google.com/macros/s/AKfycbza-1FMOY.../exec" `
        -Method POST -Headers $headers -Body '{"action":"runHarness"}'
    Write-Host "검증 #$i 결과: ok=$($response.ok), BLOCKER=$($response.summary.BLOCKER)"
    if ($response.ok -ne $true -or $response.summary.BLOCKER -gt 0) {
        Write-Error "검증 #$i 실패! 즉시 배포 중단 및 확인 필요."
        break
    }
}
```

### 3. 정합성 점검 가이드라인
하네스 검증 시 다음 핵심 지표를 확인한다:
1. **7대 필수 트리거 확인**:
   - `refreshProbationRosterOnly` (CLOCK, 1시간 간격)
   - `onRosterSheetEdit` (ON_EDIT)
   - `onRosterSheetChange` (ON_CHANGE)
   - `runOnboardingSurveyAutomation` (CLOCK, 매일 오전 9시)
   - `runOnboardingMissionGuideAutomation` (CLOCK, 매일 오전 9시)
   - `runProbationConsistencyCheck` (CLOCK, 6시간 간격)
   - `onCommunicationSubmit` (ON_FORM_SUBMIT)
2. **레거시 트리거 완전 박멸 (`0건` 유지)**:
   - `sendDailyReminders`를 포함한 과거 레거시 트리거가 남아있는지 철저하게 스캔하여 즉시 삭제한다.
3. **설문 응답 통합 수식 (`LET`) 검증**:
   - `설문 응답_통합` 탭 A31 셀의 수식이 유실되거나 손상되지 않았는지 검증한다.
4. **동작 의도 준수**:
   - D+3 ~ D+90일까지 설문이 순차적으로 잘 발송되는지, 미응답 시 리마인드 매일 발송 정책이 정상 루프를 도는지, 응답 완료 시 대시보드에 시트 네이티브 수식으로 자동 연동 및 얼라인이 수행되는지 로직의 무결성을 점검한다.

---

## 트러블슈팅 및 권한 이슈 해결

### 1. oauth org_internal 403 에러 발생 시
- Google App Script를 개인 Google 계정이 아닌 Workspace 조직 계정으로 배포했을 때, 조직 외부에서 접근 시 발생하는 차단 에러이다.
- 해결 방안:
  1. `.clasp.json` 및 `appsscript.json` 설정을 확인하고, 필요 시 GCP 서비스 계정(`ys-lee@tribal-affinity-469010-c4.iam.gserviceaccount.com`)에 드라이브 및 스프레드시트 편집 권한이 정상 부여되었는지 확인한다.
  2. clasp login을 실행할 때 조직 내부 사용자(`ys.lee@pcalm.co.kr`) 권한으로 로그인하거나, 서비스 계정의 credential json 파일을 환경변수(`GOOGLE_APPLICATION_CREDENTIALS`)로 설정하여 CLI 배포 권한을 획득한다.

### 2. Version Limit (200개 초과) 봉착 시
- Apps Script의 버전 개수가 최대 한도(200개)에 다다르면 배포가 차단된다.
- 해결 방안:
  - Apps Script 에디터 웹 UI에 진입하여 `프로젝트 기록 (Project History)` 탭에서 오래된 미사용 버전을 수동 삭제한다.
  - 또는 Google Apps Script API를 호출하여 레거시 버전을 벌크 정리한 후 배포를 다시 시도한다.
