---
name: apps-script-mcp-builder
description: Google Apps Script API를 직접 읽고 수정하는 원격 MCP 서버를 만들고 배포할 때 사용한다. google-workspace-mcp-with-script, Render/Cloud Run 배포, Google Cloud OAuth credentials/token 생성, ChatGPT MCP/새 앱 연결, 커넥터 링크 실패, MCP URL/auth 설정 문제를 처리한다.
---

# Apps Script MCP 만들기

## 핵심 구분

항상 인증을 세 층으로 나누어 설명한다.

1. **ChatGPT/MCP 클라이언트 -> MCP 서버**
   - ChatGPT 새 앱/커스텀 MCP 테스트에서는 가능하면 `인증 없음 / No authentication`을 쓴다.
   - `MCP_API_KEY`를 쓴다면 이것은 서버 접속 비밀번호일 뿐이며 Google API key가 아니다.
   - ChatGPT UI가 `OAuth`만 요구하면 서버가 OAuth discovery/authorize/token 엔드포인트를 구현해야 한다.

2. **MCP 서버 -> Google**
   - 개인/비공개 Apps Script 코드를 읽고 수정하려면 Google OAuth 토큰이 필요하다.
   - `GOOGLE_CREDENTIALS_JSON` + `GOOGLE_TOKEN_JSON` 또는 권한이 부여된 `SERVICE_ACCOUNT_JSON`을 쓴다.
   - Google API key만으로는 Apps Script 프로젝트 코드 수정이 되지 않는다.

3. **Google Cloud**
   - Apps Script API와 Drive API를 켠다.
   - 로컬 토큰 생성을 위해 OAuth Client는 `Desktop app`이 가장 단순하다.

## 추천 서버 선택

- 실제 Apps Script 프로젝트 내용을 API로 직접 읽고 수정하려면 `sputnicyoji/google-workspace-mcp-with-script`를 우선 사용한다.
  - 주요 도구: `getScriptContent`, `updateScriptContent`, `getScriptProjects`, `createBoundScript`
- 로컬 clasp 개발 워크플로우, pull/push/deploy/log 중심이면 `clasp-enhanced-mcp`를 고려한다.

## 표준 절차

1. **repo 준비**
   - 대상 MCP repo를 fork/clone한다.
   - stdio 전용이면 HTTP transport를 추가한다.
   - FastMCP TypeScript 서버라면 `transportType: "httpStream"`과 `endpoint: "/mcp"`를 사용한다.

2. **Google Cloud 설정**
   - Google Cloud Console에서 프로젝트를 만든다.
   - 최소 API:
     - Google Apps Script API
     - Google Drive API
   - Docs/Sheets/Gmail/Calendar 도구를 쓸 때만 해당 API도 켠다.
   - OAuth consent screen을 만들고 본인 계정을 test user에 넣는다.
   - OAuth Client ID를 `Desktop app`으로 만들고 JSON을 다운로드한다.

3. **로컬 토큰 생성**
   - 다운로드한 OAuth JSON을 프로젝트 루트의 `credentials.json`으로 둔다.
   - setup/auth 명령을 실행해 브라우저 승인 플로우를 완료한다.
   - `token.json`이 생겼는지 확인한다.
   - `127.0.0.1:3000` 포트 충돌이 나면 남은 Node 인증 프로세스를 정리하고 재시도한다.

4. **Render 배포**
   - Docker 배포를 권장한다.
   - 무료 테스트면 Render plan은 `free`를 사용한다.
   - 환경변수:
     - `MCP_TRANSPORT=httpStream`
     - `MCP_ENDPOINT=/mcp`
     - `MCP_HOST=0.0.0.0`
     - `GOOGLE_CREDENTIALS_JSON=<credentials.json 전체 내용>`
     - `GOOGLE_TOKEN_JSON=<token.json 전체 내용>`
   - `credentials.json`, `token.json`, `.env`, service account key는 절대 commit하지 않는다.

5. **ChatGPT 새 앱/MCP 연결**
   - 서버 URL은 반드시 `https://`를 포함한다.
   - 예:
     ```text
     https://google-workspace-mcp-with-script-remote.onrender.com/mcp
     ```
   - 인증은 가능하면 `없음 / No authentication`을 선택한다.
   - `OAuth`를 선택하면 OAuth 서버 구현이 없는 단순 MCP 서버는 실패한다.
   - 위험 경고는 custom MCP 서버에 대한 일반 경고다. 사용자가 본인 서버를 신뢰할 때만 체크하고 진행하게 한다.

## Render 로그별 원인

```text
ENOENT: no such file or directory, open '/app/credentials.json'
```

`GOOGLE_CREDENTIALS_JSON`이 없거나 오타가 있거나 값에 JSON이 아니라 PowerShell 명령어를 붙여넣은 상태다.

```text
No service account path detected. Falling back to standard OAuth 2.0 flow...
```

사용자 OAuth 방식을 쓰는 경우 정상이다. 이후 `GOOGLE_CREDENTIALS_JSON`, `GOOGLE_TOKEN_JSON`을 읽어야 한다.

```text
406 Not Acceptable
```

수동 테스트 요청에 `Accept: application/json, text/event-stream`이 빠진 것이다. MCP 클라이언트는 둘 다 accept 해야 한다.

```text
400 No valid session ID provided
```

`initialize` 후 세션을 유지하지 않고 `tools/list`를 직접 호출하면 날 수 있다. 서버가 완전히 죽었다는 뜻은 아니다.

## 빠른 검증 명령

```powershell
Invoke-WebRequest -Uri "https://HOST/health" -UseBasicParsing
```

```powershell
Invoke-WebRequest -Uri "https://HOST/mcp" `
  -Method POST `
  -Headers @{Accept="application/json, text/event-stream"} `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"smoke","version":"1.0.0"}}}' `
  -UseBasicParsing
```

## 사용자를 안내할 때

- "Builder"라고만 말하지 말고 "ChatGPT의 새 앱/MCP 추가 화면"처럼 구체적으로 말한다.
- `Set-Clipboard` 명령은 출력이 없는 것이 정상이라고 알려준다.
- Render 값 칸에는 PowerShell 명령어가 아니라 JSON 본문이 들어가야 한다.

```powershell
Get-Content "C:\path\to\credentials.json" -Raw | Set-Clipboard
Get-Content "C:\path\to\token.json" -Raw | Set-Clipboard
```

올바른 값은 이렇게 시작한다.

```json
{"installed":{"client_id":"..."}}
```

```json
{"type":"authorized_user","client_id":"...","refresh_token":"..."}
```

## 안전 규칙

- Google 계정 아이디/비밀번호를 요구하거나 저장하지 않는다.
- Google API key와 OAuth token을 혼동하지 않는다.
- screenshot/chat에 노출된 `MCP_API_KEY`, refresh token, client secret은 설정 완료 후 교체를 권장한다.
- 배포 실패 시 먼저 Render logs, URL의 `https://`, `/mcp` endpoint, 인증 선택, 환경변수 오타를 확인한다.
