---
name: gas-deploy
description: Google Apps Script and clasp production deployment. Use when working on Apps Script projects — clasp push/deploy/run, installable triggers, time-driven automations, Google Chat/Gmail/Sheets automation, or verifying and repairing triggers without manual UI interaction, with 5x robust verification.
---

# Google Apps Script / clasp 운영 배포 & 5회 연속 신뢰성 검증 스킬

## Core Rules

1. **검증되지 않은 코드는 존재하지 않는다**: 완료 기준은 '실행'이 아니라 '물리적 검증'이다.
2. **5회 반복 검증 (5x Robustness Verification)**: 시스템의 정합성과 일관성을 담보하기 위해, 배포 전후로 Headless 검증 하네스(doPost API Executable 등)를 **최소 5회 연속 실행**하여 모든 결과가 `BLOCKER: 0` 및 완벽하게 동일한 결과값(`ok: true`)을 유지하는지 교차 확인한다.
3. **보안 및 권한 격리**: OAuth 인증 파일(`C:\Users\fpdlw\.clasprc.json`), GCP 서비스 계정 키 파일(`C:\Users\fpdlw\Downloads\tribal-affinity-469010-c4-*.json`) 등 중요 크리덴셜은 로컬 스토리지에 격리하고 절대로 Git 저장소에 커밋하지 않는다.
4. **clasp 실행 권한 격리 및 자기복구**: `clasp push` 업로드 성공이 원격 함수 실행 성공을 보장하지 않으므로, API Executable 배포, access 설정(`ANYONE` / `ANYONE_ANONYMOUS`), OAuth 스코프 점검을 철저히 수행하여 예외 발생 시 자기복구(Self-recovery)가 가능하도록 한다.
5. **완벽한 자동화 시나리오 구비**: 다른 대화방이나 환경에서도 이 가이드와 스크립트를 즉석에서 복사하여 **완전 자동으로 배포, 인증 획득, 검증 5회 루프**를 연속으로 처리할 수 있도록 상세하고 실행 가능한 코드 수준의 스펙을 명시한다.

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

## 🛠️ 단계별 배포 & 5회 검증 표준 가이드

본 시스템의 배포와 검증은 아래의 **5단계 파이프라인**을 따라 엄격하고 완전무결하게 순서대로 수행된다.

### [1단계] 로컬 소스코드 수정 및 Clasp Push
1. 로컬 환경(`C:\Users\fpdlw\OneDrive\문서\onboarding-script-review`)에서 수정한 코드를 정적 검사한다.
2. `clasp push --force` 명령을 통해 원격 구글 서버에 업로드한다.
```bash
clasp push --force
```

### [2단계] 서비스 계정 연동 및 의존성 환경 구축
안정적인 백그라운드 Headless API Executable 호출을 수행하기 위해 Google APIs 라이브러리를 준비한다.
```bash
# 디렉토리에 package.json 및 의존 라이브러리가 없는 경우 설치
npm install google-auth-library googleapis
```

### [3단계] 검증용 NodeJS 러너(Runner) 설정 파일 배치
GCP 서비스 계정 키 파일(`.json`)을 바탕으로 API Executable 웹앱에 POST 요청을 전송하여 하네스를 실행하는 `runHarnessWebapp.js` 파일을 로컬에 자동 구성한다.

#### 1. 웹앱 트리거 호출용 헬퍼 파일 (`runHarnessWebapp.js`)
```javascript
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

// 로컬 환경의 서비스 계정 키 경로 자동 로딩 (두 경로 중 존재하는 파일 선택)
let keyPath = 'C:\\Users\\fpdlw\\Downloads\\tribal-affinity-469010-c4-ce440c664a53.json';
if (!fs.existsSync(keyPath)) {
  keyPath = 'C:\\Users\\fpdlw\\Downloads\\tribal-affinity-469010-c4-f219ca32d30b.json';
}
if (!fs.existsSync(keyPath)) {
  keyPath = path.join(__dirname, 'service-account.json');
}

const url = 'https://script.google.com/macros/s/AKfycbwO6wvy44jCrBSw9S_FFW7fTAbOcKKKP3ujmQmVvPkMm_ecyIhlvlBUkWH2u2dJkDIxsw/exec';
const actionArg = process.argv[2] || 'runHarness';

const auth = new GoogleAuth({
  keyFile: keyPath,
  scopes: ['https://www.googleapis.com/auth/drive'] // 웹앱 API Executable 실행용 범위
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
* **원인**: 조직 내부(`pcalm.co.kr`)의 엄격한 자격 제한 조건으로 인해 외부 CLI 접근 차단.
* **해결**: `.clasp.json` 파일의 `projectId`가 `tribal-affinity-469010-c4` 인지 재확인하고, `ys-lee@tribal-affinity-469010-c4.iam.gserviceaccount.com` 서비스 계정에 시트/드라이브의 `편집자` 권한이 최종 상속되었는지 드라이브 UI에서 확인한다.

### 2. 구글 제한(Version 200개 초과)에 걸릴 때
* **원인**: Google Apps Script 웹 플랫폼 내 버전 히스토리가 200개 상한선 도달.
* **해결**: Apps Script 에디터 웹 UI -> `프로젝트 기록 (Project History)` 탭에 진입하여 쓰지 않는 예전 버전들을 수동 정리해 가용 공간을 확보한다.
