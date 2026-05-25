# CLAUDE.md

Follow `AGENTS.md` first. This file only adds Claude Code specific behavior.

- Use `.claude/skills/`, `.claude/agents/`, and `.claude/commands/` from this repo.
- Treat `~/.claude/` as the application location, not the source of truth.
- Use the `git-first-bootstrap` skill for setup, restore, context cleanup, and `/done` workflows.
- Use `bootstrap-agent` only for setup/restore tasks.
- Use `context-manager` when context is long, noisy, or scope has changed.
- Do not auto-run `/clear`; suggest it only after `/done`.
