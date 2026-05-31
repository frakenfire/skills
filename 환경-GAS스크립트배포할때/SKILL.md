---
name: gas-deploy
description: Google Apps Script and clasp production deployment. Use when working on Apps Script projects — clasp push/deploy/run, installable triggers, time-driven automations, Google Chat/Gmail/Sheets automation, direct Google Sheet/Drive source inspection, or verifying and repairing triggers when clasp run/API Executable is unavailable, with robust validation and safe production guardrails.
---

# Google Apps Script / clasp 운영 배포 & 5회 연속 신뢰성 검증 스킬

## Core Rules

1. **검증되지 않은 코드는 존재하지 않는다**: 완료 기준은 '실행'이 아니라 '물리적 검증'이다.
2. **5회 반복 검증 (5x Robustness Verification)**: 시스템의 정합성과 일관성을 담보하기 위해, 배포 전후로 Headless 검증 하네스(doPost API Executable 등)를 **최소 5회 연속 실행**하여 모든 결과가 `BLOCKER: 0` 및 완벽하게 동일한 결과값(`ok: true`)을 유지하는지 교차 확인한다.
3. **clasp 실행 권한 격리 및 자기복구**: `clasp push` 업로드 성공이 원격 함수 실행 성공을 보장하지 않으므로, API Executable 배포, access 설정(`ANYONE` / `ANYONE_ANONYMOUS`), OAuth 스코프 점검을 철저히 수행하여 예외 발생 시 자기복구(Self-recovery)가 가능하도록 한다.
4. **원천 확인 우선**: 시트 구조, 실제 셀 링크, Drive 파일/폴더 상태, 현재 Apps Script 코드, 설치 트리거를 직접 확인하기 전에는 매칭/복구 로직을 추정하지 않는다.
5. **불필요한 원격 실행 설정 금지**: `clasp run`이 막혀도 즉시 API Executable을 만들지 않는다. Apps Script UI에서 수동 실행하면 충분한 경우에는 `clasp push` + UI 실행 절차를 보고하고, API Executable은 CLI 원격 실행이 실제로 필요한 때만 설정한다.

---

## 🔑 자격 증명 및 프로젝트 설정 (Project Setup)

이 스킬은 특정 프로젝트에 종속되지 않습니다 (Globalized). 
새로운 프로젝트에 배포할 때, 사용자의 프로젝트 환경에 맞게 다음 설정 파일들이 필요합니다.

### 1. GCP Service Account Key (`service-account.json`)
현재 프로젝트의 GCP 서비스 계정 키 파일(`service-account.json`)이 로컬 폴더에 존재해야 합니다.
없을 경우, `clasp login` 기반의 OAuth 로컬 인증 토큰(`~/.clasprc.json`)을 대체제로 사용합니다.

### 2. Clasp Project 설정 (`.clasp.json`)
해당 프로젝트 폴더에 `.clasp.json` 파일이 있어야 합니다.
```json
{
  "scriptId": "<YOUR_SCRIPT_ID>",
  "projectId": "<YOUR_GCP_PROJECT_ID>",
  "rootDir": ""
}
```

---

## 🛠️ 단계별 배포 & 5회 검증 표준 가이드

본 시스템의 배포와 검증은 아래의 **5단계 파이프라인**을 따라 다른 컴퓨터 환경에서도 완벽히 무결하게 재구성하여 실행된다.

### [1단계] 로컬 환경 세팅 및 인증 키 준비
1. 로컬 환경에 해당 프로젝트의 `.clasp.json` 파일이 있는지 확인합니다.
2. (선택사항) GCP 서비스 계정 키(`service-account.json`)를 프로젝트 루트에 배치하거나, 글로벌 `clasp` 토큰(`~/.clasprc.json`) 인증을 사용합니다.
3. 라이브러리 의존성을 설치한다.
   ```bash
   npm install google-auth-library googleapis
   ```

### [2단계] 로컬 소스코드 수정 및 Clasp Push
```bash
clasp push --force
```

### [2.5단계] clasp run이 막힌 실전 운영 패턴
`clasp run` 실패는 흔하다. 특히 `Script function not found. Please make sure script is deployed as API executable.`가 나오면 코드가 없는 것이 아니라 원격 실행 배포/인증 경로가 없는 것이다.

이때는 아래 순서로 처리한다.

1. `clasp clone <scriptId>` 또는 기존 로컬 프로젝트에서 실제 Apps Script 코드를 먼저 읽는다.
2. `.clasp.json`, `appsscript.json`, 트리거 설치 함수, 운영 엔트리포인트를 확인한다.
3. `rg`로 위험 패턴을 검색한다.
   ```bash
   rg -n "MailApp|GmailApp|Session\.getActiveUser|Session\.getEffectiveUser|DriveApp\.searchFiles|Drive\.Files\.list|newTrigger|deleteTrigger|getProjectTriggers|tryRecover|find.*Candidate|score.*Candidate" .
   ```
4. Google Sheets API가 OAuth/GCP 제한으로 막히면, 사용 가능한 Google Drive/Sheets 커넥터나 로그인된 브라우저 UI로 우회하여 실제 셀 값을 확인한다.
   - 일반 값: `get_spreadsheet_range`
   - 링크/수식/리치텍스트: `get_spreadsheet_cells`
   - 특정 사람/행 찾기: `search_spreadsheet_rows`
   - 폴더 파일 목록: Drive `list_folder`
   - 파일 부모/생성일/수정일: Drive `get_file_metadata`
5. Apps Script API Executable은 CLI에서 함수를 직접 실행해야 할 때만 설정한다. 위치는 Apps Script 편집기 `배포 > 새 배포 > 유형 선택(톱니바퀴) > API 실행 파일`이다. 필요한 경우 `appsscript.json`에 아래 설정을 추가한다.
   ```json
   "executionApi": {
     "access": "ANYONE"
   }
   ```
6. API Executable 설정이 없으면, 검증 함수 실행 순서를 운영자에게 명확히 보고한다. 예: `testRestoreRow38()` 먼저 실행, 로그 확인 후 전체 복구 함수 실행.

이 패턴에서는 `clasp push --force`가 성공하면 배포 반영은 된 것이다. 단, 원격 실행 검증은 Apps Script UI에서 실행하거나 API Executable 설정 후 `clasp run`으로 별도 검증해야 한다.

#### 로그인된 Chrome/Apps Script UI로 실제 실행까지 확인하는 방법

API Executable 배포가 없고 `clasp run`이 막혀도, 사용자의 Chrome 로그인 세션으로 Apps Script 편집기에서 지정 함수만 실행하면 실제 Drive/Sheets 권한으로 운영 작업을 끝낼 수 있다.

1. `clasp push --force` 직후 Apps Script 편집기 URL을 연다.
2. 함수 선택 드롭다운에서 검증/정리 함수 하나만 고른다. 전체 복구 함수와 부분 정리 함수를 혼동하지 않는다.
3. 실행 버튼을 눌러 Apps Script 실행 로그 패널에서 `실행이 시작됨`, 핵심 `console.log`, `실행이 완료됨`을 확인한다.
4. 실행 직후 반드시 원천을 다시 읽어 물리적으로 검증한다.
   - 시트: `get_spreadsheet_cells`로 링크가 비워졌거나 라벨 링크로 정리됐는지 확인
   - 폴더: `list_folder`로 파일이 목표 개인 폴더 바로 아래로 이동했는지 확인
   - 파일: `get_file_metadata`로 `createdTime`, `modifiedTime`, `parents`를 확인
5. 운영성 정리 함수는 파일 ID와 행/사번을 명시한 allowlist 방식으로 작성한다. Drive 전체 검색 결과를 움직이는 임시 함수는 만들지 않는다.
6. 결과는 Google Chat 요약 1건과 로그 시트에 남기고, 선택서류 빈칸이나 정상 스킵은 Chat으로 폭주시키지 않는다.

### [2.6단계] Google Form 파일 정리 자동화 안전 기준
구글폼 업로드 파일을 직원별 폴더로 정리하는 자동화는 특히 오매칭 위험이 크다. 다음 기준을 기본값으로 둔다.

1. 구글폼이 기록한 시트 셀 링크만 파일 원천으로 사용한다.
2. Drive 전체 검색, 후보 점수 계산, 파일명 기반 자동 매칭, 미분류 파일 자동 이동을 금지한다.
3. 선택서류 빈칸은 조용히 스킵하고 로그만 남긴다.
4. 필수서류 빈칸은 누락으로 보고한다.
5. 깨진 링크나 권한 없는 파일은 `FILE_NOT_FOUND`로 보고하고 해당 파일만 스킵한다.
6. 같은 Drive 파일 ID가 여러 직원/행에 연결되어 있으면 자동 이동하지 말고 `DUPLICATE_FILE_LINK`로 보고한다.
7. 성별과 문서유형을 교차검증한다. 특히 `성별=여성`인 행의 `병적 증명서` 링크는 있어도 자동 이동하지 말고 `MILITARY_DOC_GENDER_MISMATCH`로 보고한다.
8. 인사기록카드처럼 현재 수집하지 않는 문서는 처리 목록에서 제외한다.
9. 한 행 오류가 전체 실행을 멈추지 않게 하고, 전체 복구 중 파일별 성공 Chat 폭탄을 금지한다.
10. 운영 알림은 Google Chat 요약으로 통일하고 `MailApp.sendEmail`, `Session.getActiveUser`, `Session.getEffectiveUser`는 사용하지 않는다.
11. 실제 전체 복구 실행 전에는 특정 행 테스트 함수와 기대 로그를 먼저 제시한다.

### [3단계] 검증용 NodeJS 러너(Runner) 설정 파일 배치
GCP 서비스 계정 키 파일(`service-account.json`)을 바탕으로 API Executable 웹앱에 POST 요청을 전송하여 하네스를 실행하는 `runHarnessWebapp.js` 파일을 로컬에 동적으로 자동 구성한다.

#### 웹앱 트리거 호출용 헬퍼 파일 (`runHarnessWebapp.js`)
```javascript
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

const keyPath = path.join(__dirname, 'service-account.json');
const url = 'https://script.google.com/macros/s/AKfycbwO6wvy44jCrBSw9S_FFW7fTAbOcKKKP3ujmQmVvPkMm_ecyIhlvlBUkWH2u2dJkDIxsw/exec';
const actionArg = process.argv[2] || 'runHarness';

const auth = new GoogleAuth({
  keyFile: keyPath,
  scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'] // 웹앱 API Executable 실행용 범위
});

async function run() {
  console.log(`[ACTION] Authenticating for action: ${actionArg}...`);
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    console.log('[HTTP] Sending Web App Request to Apps Script...');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.token}`
      },
      body: JSON.stringify({ action: actionArg })
    });
    
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
      console.log('================ FINAL RESULT ================');
      console.log(JSON.stringify(json, null, 2));
      console.log('==============================================');
      return json;
    } catch (e) {
      console.log('Raw output:', text);
      return { ok: false, error: 'JSON_PARSE_ERROR', raw: text };
    }
  } catch(err) {
    console.error('[ERROR]', err);
    return { ok: false, error: err.message };
  }
}

run();
```

### [4단계] 5회 연속 신뢰성 하네스 실행 및 정합성 교차 점검
수동 조작 없이, 아래 CLI 스크립트를 사용하여 **5회 연속 무결성 루프**를 연속으로 실행하고 모니터링한다.

```powershell
# PowerShell CLI를 통한 5회 루프 자동 정합성 체크 실행
for ($i = 1; $i -le 5; $i++) {
    Write-Host "---------------------------------------------" -ForegroundColor Cyan
    Write-Host "▶ [검증 #$i/5] 하네스 건전성 감사 구동 중..." -ForegroundColor Yellow
    Write-Host "---------------------------------------------" -ForegroundColor Cyan
    
    $output = node runHarnessWebapp.js runHarness 2>&1
    Write-Host $output
    
    # 출력 분석: 실패(BLOCKER) 발생 여부 체크
    if ($output -match "BLOCKER: [1-9]") {
        Write-Host "🚨 [BLOCKER 감지] 검증 #$i 실패! 배포를 중단하고 트리거 및 시트를 복구하세요." -ForegroundColor Red
        exit 1
    }
    if ($output -match '"ok": false') {
        Write-Host "🚨 [오류 반환] 검증 #$i 실패! JSON 응답 상태 이상 감지." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ [검증 #$i 성공] BLOCKER 0건 확인 완료." -ForegroundColor Green
    Start-Sleep -Seconds 1 # 서버 부하 조절 및 동기식 지연
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host "🎉 [최종 통과] 5회 연속 교차 검증 완벽하게 성공!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
```

### [5단계] 시트 네이티브 정합성 체크리스트 실행
자동화 스크립트 실행 후 스프레드시트 내 다음 SSO 항목들이 완벽히 준수되는지 순차 검사한다.
1. **7대 필수 트리거 확인**
   - `refreshProbationRosterOnly` (CLOCK, 매시 정각)
   - `onRosterSheetEdit` (ON_EDIT)
   - `onRosterSheetChange` (ON_CHANGE)
   - `runOnboardingSurveyAutomation` (CLOCK, 매일 오전 9시)
   - `runOnboardingMissionGuideAutomation` (CLOCK, 매일 오전 9시)
   - `runProbationConsistencyCheck` (CLOCK, 6시간)
   - `onCommunicationSubmit` (ON_FORM_SUBMIT)
2. **레거시 트리거 완전 0건 유지**: `sendDailyReminders`를 위시한 모든 레거시 흔적 삭제 완료 상태 검증.
3. **통합 시트 수식 무결성**: `설문 응답_통합` 탭 A31 셀의 `LET` 수식이 정상 작동하여 대시보드에 신규 설문 완료 여부가 자동으로 실시간 반영(Align)되는지 여부.

---

## 🚨 트러블슈팅 및 비상 대책

### 1. 403 org_internal 에러가 나타날 때
* **원인**: 조직 내부의 엄격한 자격 제한 조건으로 인해 외부 CLI 접근 차단.
* **해결**: `.clasp.json` 파일의 `projectId`가 올바른지 확인하고, 인증된 계정에 시트/드라이브의 `편집자` 권한이 부여되었는지 드라이브 UI에서 재확인한다.

### 2. 구글 제한(Version 200개 초과)에 걸릴 때
* **원인**: Google Apps Script 웹 플랫폼 내 버전 히스토리가 200개 상한선 도달.
* **해결**: Apps Script 에디터 웹 UI -> `프로젝트 기록 (Project History)` 탭에 진입하여 쓰지 않는 예전 버전들을 수동 정리해 가용 공간을 확보한다.

### 3. 내장 크리덴셜 파싱 오류 또는 파일 손상 시 (clasp 토큰 우회법)
* **원인**: 문서 포맷팅 과정에서 내장된 Base64 텍스트에 물리적인 줄바꿈이나 이스케이프 문자(`\c`, `\n` 등)가 잘못 혼입되어 `service-account.json` 파싱 시 `Bad control character` 등 JSON 오류가 발생할 수 있다.
* **해결**: 서비스 계정 대신, 로컬에 이미 로그인되어 있는 사용자의 글로벌 `clasp` OAuth 토큰(`~/.clasprc.json`)을 읽어와 직접 웹앱(API Executable)에 POST 요청을 날리는 우회 스크립트를 작성하여 하네스를 실행한다.
  ```javascript
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const token = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.clasprc.json'), 'utf8')).tokens.default.access_token;
  
  // url과 actionArg는 기존 runHarnessWebapp.js와 동일하게 설정 후 fetch
  ```


---

## 보완: 실전 배포/검증 — 여러 방식 (정답 하나 아님)

위 5x 하네스가 정석이나, 환경에 따라 특정 경로가 막힐 수 있어 우선순위를 둔다.

### 배포
1. **접근권한 약화 없이 redeploy(권장)**: 매니페스트 `webapp.access`를 운영값 그대로 두고 `clasp push --force` → REST로 version 생성(`POST /v1/projects/{scriptId}/versions`) → 기존 deployment PUT(`/deployments/{id}`). 권한을 임시 공개로 바꾸지 않으므로 가장 안전하고, 일부 보안 가드 환경에서도 통과한다.
2. **repo 배포 스크립트**: 토큰 등 환경변수 충족 시 사용.
- ⚠️ 매니페스트를 임시 `ANYONE_ANONYMOUS`로 바꿔 검증하는 트릭은 운영 웹앱 보안을 약화시키고 일부 환경에서 차단되므로 지양.

### 토큰 주의
- clasp 로컬 토큰의 `access_token`은 만료가 잦아 `refresh_token`으로 갱신해 쓴다.
- 이 토큰 스코프는 보통 배포용에 한정 → Execution API(`scripts.run`)나 접근 제한된 웹앱 `/exec` 직접 호출은 401일 수 있다. 즉 배포는 되지만 함수 실행 검증은 별도 수단 필요.

### 검증 — 함수 실행 대신 (1번부터)
1. **연결된 커넥터로 원천 직접 읽기(권장)**: Sheets/Calendar 커넥터로 시트·캘린더를 직접 읽어 검증. 실행·발송 없음. 개인정보는 집계만 추출.
2. **토큰 보호 admin 엔드포인트**: 접근 권한 있는 세션(브라우저)에서 호출.
3. **node 로컬 하네스**: 순수 로직 함수는 GAS 전역을 Proxy 스텁으로 막고 node에서 실행.
4. **최종 실검증**: 배포 후 자동 트리거 실행 → 로그 시트에서 합 맞추기. 테스트 발송 금지.

### 교훈
- 스킬은 권장 경로지 유일 경로가 아니다. 한 경로가 막히면 연결된 다른 도구로 같은 데이터에 도달하는지부터 본다.
- "함수 실행"이 아니라 "그 함수가 만지는 데이터/로그"를 검증하면 되는 경우가 많다.
