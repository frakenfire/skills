# Git-first Policy

## Source of truth

GitHub private repo is the source of truth. A local directory is only a checkout. `~/.claude/` and `~/.codex/` are application locations.

## Start of work

```powershell
cd "$env:USERPROFILE\Documents\claude-config"
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git status --short
git pull
git log --oneline -5
```

Stop if the directory is not a Git repo or has no remote.

## End of work

```powershell
git status --short
git diff --stat
git diff
```

After verification, ask before commit/push:

```powershell
git add .
git commit -m "<type(scope): summary>"
git push
```

Do not call the work cross-machine ready until it has been pushed.
