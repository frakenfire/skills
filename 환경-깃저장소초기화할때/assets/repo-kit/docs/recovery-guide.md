# Recovery Guide

## Git missing

```powershell
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
```

Restart VS Code/Cursor/terminal after installing Git.

## Node missing

```powershell
winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
```

## GitHub CLI missing

```powershell
winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements
```

## unsafe repository

Prefer a specific checkout path:

```powershell
git config --global --add safe.directory "C:/Users/<user>/Documents/claude-config"
```

Use `safe.directory '*'` only as a last resort.
