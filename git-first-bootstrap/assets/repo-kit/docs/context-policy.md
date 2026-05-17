# Context and Token Policy

- Split work by Git issue, branch, commit, or small task.
- Reconstruct context from Git state, docs, recent commits, and relevant files.
- Do not read the whole repo by default.
- Avoid `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`, `.cache/`, `coverage/`, `logs/`, large CSV/JSON/Markdown dumps, credentials, secrets, sessions, projects, and backups.
- Use `/compact` when the conversation becomes long.
- Use `/done` for a final handoff.
- Let the user manually run `/clear` or start a new session.
- Subagents should read only necessary files and return a short summary.
