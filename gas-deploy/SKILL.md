---
name: gas-deploy
description: Google Apps Script (clasp) 배포 및 검증 스킬. lwc-attendance-center 전용. clasp push, version 생성, deployment redeploy, 임시 no-auth endpoint로 내부 상태 검증, DOMAIN 복구까지 전 과정 처리.
triggers:
  - clasp push
  - clasp deploy
  - Apps Script 배포
  - 트리거 확인
  - 원장 행 수
  - dedup 상태
  - automationStatus
  - installTriggers
---

# Google Apps Script 배포 & 검증 스킬

## 핵심 원칙

**clasp run, Sheets API, Execution API, Script Properties API 절대 사용 금지.**
항상 Apps Script 웹앱 내부 경로로 확인한다.

## 프로젝트 상수

```
scriptId:     1G-wUflwGwjQR-ora1daKLU3dwMau_wBooi0XPRxWySSw2N5zZByoOQWk
deploymentId: AKfycbza-1FMOYOFB085UBzuQMq-QMGL_3uRYjKKMeYKze7_o3cWhLgn64qsLbmAHSHW0bKYVA
webapp URL:   https://script.google.com/a/macros/pcalm.co.kr/s/{deploymentId}/exec
repo:         C:\Users\fpdlw\lwc-attendance-center
clasp auth:   C:\Users\fpdlw\.clasprc.json → .tokens.default.access_token
```

**새 deployment ID 절대 생성 금지. 기존 ID에 version만 올릴 것.**

## 표준 배포 흐름

### 1. Git 동기화
```bash
git fetch origin {branch}
git checkout {branch}
git pull origin {branch}
```

### 2. 검증용 임시 배포 (ANYONE_ANONYMOUS)

`10_AppApi.js` doGet 맨 위에 삽입:
```javascript
if (e && e.parameter && e.parameter.action === '_tempStatus') {
  try {
    const triggers = ScriptApp.getProjectTriggers().map(function(t) {
      return { handler: t.getHandlerFunction(), type: String(t.getEventType()) };
    });
    const props = PropertiesService.getScriptProperties();
    const dedupState = props.getProperty('DAOU_SYNC_FAILURE_STATE_V1');
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const ledgerSheet = ss.getSheetByName(CONFIG.SHEETS.LEDGER);
    const ledgerRows = ledgerSheet ? ledgerSheet.getLastRow() - 1 : -1;
    return ContentService.createTextOutput(JSON.stringify({
      ok: true, triggers: triggers,
      dedupState: dedupState ? JSON.parse(dedupState) : null,
      ledgerRows: ledgerRows, checkedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

`appsscript.json` access 변경:
```json
"access": "ANYONE_ANONYMOUS"
```

```bash
clasp push --force
```

### 3. Version 생성 + Deployment 업데이트 (PowerShell)

```powershell
$raw = Get-Content "C:\Users\fpdlw\.clasprc.json" -Raw | ConvertFrom-Json
$token = $raw.tokens.default.access_token
$scriptId = "1G-wUflwGwjQR-ora1daKLU3dwMau_wBooi0XPRxWySSw2N5zZByoOQWk"
$deploymentId = "AKfycbza-1FMOYOFB085UBzuQMq-QMGL_3uRYjKKMeYKze7_o3cWhLgn64qsLbmAHSHW0bKYVA"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

$vResp = Invoke-RestMethod -Uri "https://script.googleapis.com/v1/projects/$scriptId/versions" `
  -Method POST -Headers $headers -Body '{"description":"anon-verify"}'
$vNum = $vResp.versionNumber

$body = @{ deploymentConfig = @{
  scriptId = $scriptId; versionNumber = $vNum
  manifestFileName = "appsscript"; description = "anon-verify"
}} | ConvertTo-Json
Invoke-RestMethod -Uri "https://script.googleapis.com/v1/projects/$scriptId/deployments/$deploymentId" `
  -Method PUT -Headers $headers -Body $body
Write-Host "Deployed @$vNum"
```

### 4. 상태 확인

```bash
curl -sL "{webapp_url}?action=_tempStatus"
```

확인 항목:
- `triggers`: `syncDaouEvery4h` + `runDailyAttendanceBrief` 둘 다 CLOCK 타입
- `dedupState`: null이면 정상 (실패 누적 없음)
- `ledgerRows`: 배포 전후 동일하거나 증가

### 5. 임시 코드 제거 + DOMAIN 복구

- `10_AppApi.js`에서 `_tempStatus` 블록 제거
- `appsscript.json` → `"access": "DOMAIN"`
- `clasp push --force`
- PowerShell로 새 version 생성 + 기존 deployment PUT

### 6. 최종 확인

```bash
clasp deployments | grep "AKfycbza-1FMOY"
# → @{새버전} - {description} 확인
```

## version limit 초과 시

Apps Script는 최대 200개 version. 초과 시:
1. Apps Script 에디터 → Project History → 오래된 버전 삭제
2. `clasp versions`로 현재 개수 확인
3. 삭제 후 REST API로 version 생성 시도

**clasp deploy 명령은 version limit에서 막히므로 REST API로 직접 생성:**
```powershell
Invoke-RestMethod -Uri "https://script.googleapis.com/v1/projects/$scriptId/versions" `
  -Method POST -Headers $headers -Body '{"description":"..."}'
```

## 트리거 재설치 필요 시

ADMIN_TOKEN 있으면:
```bash
curl -sL "{webapp_url}?token={ADMIN_TOKEN}&action=installTriggers"
```

없으면 임시 endpoint에 `installAttendanceTriggers()` 호출 추가 후 동일 플로우.

## 주요 함수 목록

| 함수 | 파일 | 용도 |
|------|------|------|
| `installAttendanceTriggers` | 20_AttendanceEngine.js | 트리거 전체 재설치 |
| `syncDaouEvery4h` | 40_Integrations.js | 다우 4시간 sync |
| `runDailyAttendanceBrief` | 20_AttendanceEngine.js | 일일 리포트 (주말 skip) |
| `rebuildAttendanceLedger` | 20_AttendanceEngine.js | 원장 재생성 |
| `diagnoseAttendanceConnections` | 10_AppApi.js | 다우 연결 진단 |
