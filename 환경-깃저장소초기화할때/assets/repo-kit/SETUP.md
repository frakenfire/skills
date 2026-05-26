# AI 코딩 환경 초기 세팅 문서

## 1. 목적

어느 Windows PC에서든 GitHub private repo를 기준 원본으로 삼아 Claude Code와 Codex 작업 환경을 복원하고, 코딩·수정·검증·저장까지 Git 기반으로 운영한다.

## 2. 지원 환경

- Windows 11
- PowerShell
- Git for Windows
- Node.js LTS
- GitHub private repo
- Claude Code
- Codex

## 3. Git-first 운영 원칙

GitHub private repo가 기준 원본이다. 로컬 폴더는 원본이 아니라 로컬 checkout이다. `~/.claude/`와 `~/.codex/`는 실제 적용 위치일 뿐 장기 기준이 아니다. push되지 않은 변경은 다른 PC에서 이어받을 수 없으므로 완료로 보지 않는다.

## 4. 표준 작업 시작 절차

```powershell
cd "$env:USERPROFILE\Documents\claude-config"
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git status --short
git pull
git log --oneline -5
```

## 5. 표준 작업 완료 절차

```powershell
git status --short
git diff --stat
git diff
```

검증 후 사용자 확인을 받고 commit/push한다.

## 6. 컨텍스트·토큰 관리

긴 대화 하나로 이어가지 않는다. Git 상태, 문서, 최근 commit, 관련 파일만 읽어 맥락을 복원한다. 필요하면 `/compact`, 작업 종료 시 `/done`, 이후 사용자가 직접 `/clear`를 사용한다.

## 7. 다음 구현 작업

1. scripts/diagnose-env.ps1
2. scripts/install-prerequisites.ps1
3. scripts/verify-setup.ps1
4. scripts/sync-from-repo.ps1
5. scripts/sync-to-repo.ps1
6. scripts/fix-git-safe-directory.ps1
