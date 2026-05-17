# Claude/Codex Git-first Setup Kit

## Quick start

```powershell
cd "$env:USERPROFILE\Documents"
git clone <GITHUB_PRIVATE_REPO_URL> claude-config
cd claude-config
powershell -ExecutionPolicy Bypass -File .\scripts\diagnose-env.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\sync-from-repo.ps1 -Approve
powershell -ExecutionPolicy Bypass -File .\scripts\verify-setup.ps1
```

Restart Claude Code/Codex after PATH or settings changes. Use `/done` at task boundaries, then commit/push after review.
