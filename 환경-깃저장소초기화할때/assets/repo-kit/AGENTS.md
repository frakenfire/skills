# AGENTS.md

This repo is operated as a GitHub-first AI coding environment for Codex, Claude Code, and other coding agents.

## 1. Source of truth

GitHub private repo is the source of truth. Local folders are checkouts. Work only inside the checkout. Do not treat `~/.claude/` or `~/.codex/` as the durable source of truth.

## 2. Start every task

```powershell
cd "$env:USERPROFILE\Documents\claude-config"
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git status --short
git pull
git log --oneline -5
```

Stop if this is not a Git repo or if no remote exists.

## 3. File rules

Create durable files only inside the repo. Do not work from Downloads, temp folders, app caches, or extracted zip folders. Use repo-root-relative paths in reports.

## 4. Do not read by default

Avoid `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`, `.cache/`, `coverage/`, `logs/`, large CSV/JSON/Markdown dumps, credentials, secrets, token files, `sessions/`, `projects/`, and `backups/`.

## 5. Finish every task

```powershell
git status --short
git diff --stat
git diff
```

Run the relevant verification. Before commit/push, show the diff summary and ask for confirmation. Do not say the work is available on another PC until it has been pushed.

## 6. Context discipline

Keep tasks small. Use `/compact` when the session grows long. Use `/done` for a Git-based handoff. The user manually runs `/clear` or starts a new session.

## 7. Safety

No automatic `/clear`, commit, push, deploy, deletion, permission change, or secret handling. Never commit credentials, sessions, projects, logs, tokens, secrets, or real `.env` files.
