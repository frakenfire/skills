---
name: setup
description: 오케스트레이터 하네스 부트스트랩 — 권한→환경→프로젝트선택→콘텍스트→GitHub워크플로→태스크큐→에이전트로스터 순서로 완전 자동 실행. Use when starting a new session, bootstrapping a project, or running /setup.
---

# /setup — Orchestrator Harness Bootstrap

**지원 도구:** Codex · OpenAI Codex · Cursor · Windsurf · GitHub Copilot  
**실행 방식:** 오케스트레이터가 지휘, 8단계 순차 자동 실행, 각 단계 결과 인라인 보고


## Phase 0: 하네스 자기선언

실행 환경을 감지하고 역할을 선언한다.

```
[ORCHESTRATOR ONLINE]
Tool: <Codex | Codex | Cursor | Unknown>
AGENTS.md: <로드됨 | 없음>
Role: 오케스트레이터 — 전체 흐름 지휘, 직접 코드 작성 안 함
```

감지 방법:
- `Codex` 환경변수 존재 → Codex
- `CODEX_SESSION` 존재 → Codex
- `.cursor/` 폴더 존재 → Cursor
- 없으면 → Unknown (AGENTS.md 기준으로 동작)


## Phase 1: 권한 자동화

`~/.Codex/settings.json`을 아래로 덮어쓴다. 이후 모든 도구 호출은 자동 승인된다.

```json
{
  "effortLevel": "high",
  "model": "Codex-sonnet-4-6",
  "permissions": {
    "allow": ["Bash(*)", "PowerShell(*)", "Edit(*)", "Write(*)"],
    "deny": []
  }
}
```

보고: `✓ Permissions — 모든 승인 프롬프트 비활성화`


## Phase 2: 환경 진단

| 도구 | 확인 명령 | 없을 때 |
|------|-----------|---------|
| node | `node --version` | `winget install OpenJS.NodeJS` |
| npm | `npm --version` | node와 함께 설치됨 |
| git | `git --version` | `winget install Git.Git` |
| gh | `gh --version` | `winget install GitHub.cli` |
| python | `python --version` | `winget install Python.Python.3` |

선택적 도구 누락은 경고만, 중단하지 않는다.

보고: `✓ Environment — node X.X / npm X.X / git X.X / gh X.X`


## Phase 3: 프로젝트 선택

`~/.Codex/projects-registry.md`를 읽어 목록을 출력한다.

```
어떤 프로젝트를 작업할까요?

  [01] 클릭핏 AI 이력서  →  github.com/frakenfire/clickfit-ai-resume
  [N]  새 프로젝트 추가

번호 또는 이름을 입력하세요 (현재 디렉토리가 프로젝트면 자동 감지):
```

**자동 감지:** 현재 디렉토리에 `package.json` 또는 `.git`이 있으면 해당 프로젝트로 자동 선택, 확인만 받는다.

선택 후:
- 로컬 경로로 `cd`
- `.Codex/` 폴더 존재 확인
- 없으면 `~/.Codex/skills/setup/` 기준으로 복사

보고: `✓ Project — 클릭핏 AI 이력서 선택됨`


## Phase 4: Git & GitHub 동기화

```bash
git fetch --all
git status
```

| 상태 | 처리 |
|------|------|
| 최신 | 다음 단계 진행 |
| 뒤처짐 | `git pull` 자동 실행 |
| 커밋 안 된 변경 | 파일 목록 보고, 리셋 안 함 |
| 분기됨 | 사용자에게 브랜치 전략 제안 |

보고: `✓ Git — branch: master, origin/master와 동기화됨`


## Phase 5: 의존성 설치

| 파일 | 명령 |
|------|------|
| `package.json` | `npm install` |
| `requirements.txt` | `pip install -r requirements.txt` |
| `pyproject.toml` | `pip install -e .` |
| `Cargo.toml` | `cargo build` |

보고: `✓ Dependencies — npm install 완료`


## Phase 6: 컨텍스트 로드

순서대로 읽어 활성 컨텍스트에 로드:

1. `.Codex/AGENTS.md` → 에이전트 역할 정의
2. `.Codex/design-system.md` → UI 디자인 표준 (있을 경우)
3. `.Codex/tasks/session-state.md` → 이전 세션 진행 상황 (있을 경우)
4. `AGENTS.md` (프로젝트 루트) → 프로젝트 맥락

세션 상태 있을 경우 출력:
```
이전 세션 발견:
  마지막 작업: [작업명]
  완료된 태스크: X/Y
  이어서 할까요? (y/n)
```

보고: `✓ Context — AGENTS.md + design-system.md + session-state 로드됨`


## Phase 7: GitHub 워크플로 초기화

새 작업 시작 시 브랜치 전략을 제안한다:

```
작업 유형을 선택하세요:
  [1] 새 기능  → feat/<이름> 브랜치 생성
  [2] 버그 픽스 → fix/<이름> 브랜치 생성  
  [3] 기존 브랜치 이어서 작업
  [4] main/master 직접 작업 (소규모 수정)
```

선택에 따라:
- `git checkout -b feat/<이름>` 또는 `fix/<이름>` 자동 실행
- `.Codex/tasks/session-state.md` 초기화:

```markdown
# Session State
시작: <날짜시간>
브랜치: <브랜치명>
목표: <사용자 입력>
태스크:
- [ ] ...
완료:
- ...
```

보고: `✓ GitHub Workflow — feat/xxx 브랜치 생성됨`


## Phase 8: 에이전트 로스터 & 준비 완료

로드된 에이전트와 역할 출력:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ORCHESTRATOR HARNESS — 준비 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Phase 1: Permissions          ✓ (자동 승인 활성화)
  Phase 2: Environment          ✓ (node / npm / git / gh)
  Phase 3: Project              ✓ (클릭핏 AI 이력서)
  Phase 4: Git Sync             ✓ (master, 최신)
  Phase 5: Dependencies         ✓ (npm install)
  Phase 6: Context              ✓ (AGENTS.md + 디자인시스템)
  Phase 7: GitHub Workflow      ✓ (feat/xxx)
  Phase 8: Ready

  에이전트 로스터:
  🎯 오케스트레이터  — 전체 지휘
  💻 코더           — 코드 작성
  🔍 리뷰어         — 품질 게이트
  📦 GitHub 에이전트 — 버전 관리
  🧠 컨텍스트 매니저 — 세션 유지

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  주방이 세팅됐습니다. 무엇을 요리할까요?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```


## 세션 종료 규칙 (/done 또는 컨텍스트 한계 도달 시)

1. `.Codex/tasks/session-state.md` 업데이트 (완료/미완료 태스크)
2. `git add -p` → 변경사항 스테이징
3. `git commit` → 세션 요약 커밋 메시지
4. `git push` → GitHub에 영구 저장
5. 미완료 태스크 요약 출력
6. `/clear` 제안 (직접 실행 안 함)


## 멀티툴 호환성

| 도구 | 진입점 | AGENTS.md 인식 |
|------|--------|---------------|
| Codex | `/setup` 슬래시 커맨드 | ✓ 자동 |
| OpenAI Codex | `AGENTS.md` 시스템 프롬프트 | ✓ 자동 |
| Cursor | `.cursor/rules` 또는 `.Codex/` | 수동 참조 |
| Windsurf | `.windsurf/rules` | 수동 참조 |
| GitHub Copilot | `.github/copilot-instructions.md` | 수동 미러링 |


## 철칙 (Iron Rules)

1. **GitHub 우선** — 모든 변경사항은 GitHub에 저장. 로컬은 임시.
2. **이 파일도 GitHub에** — setup 스킬 변경 시 즉시 커밋+푸시.
3. **오케스트레이터는 코드 안 씀** — 직접 수정 없이 코더에게 위임.
4. **force push 절대 금지** — 히스토리 보존 필수.
5. **세션 종료 = 커밋** — push 없이 세션 끝내지 않는다.


## 금지사항

- 자동 커밋/푸시 (사용자 확인 없이)
- 시크릿/크리덴셜 파일 커밋
- uncommitted 작업 강제 리셋
- `--no-verify` 플래그 사용