---
name: gas-deploy
description: Google Apps Script and clasp 운영 배포 스킬. Use when Codex works on Apps Script projects, clasp push/deploy/run, installable triggers, time-driven automations, Google Chat/Gmail/Sheets automation, or needs to verify/safely repair triggers without making the user manually click Apps Script UI.
---

# Google Apps Script / clasp 운영 배포

## Core Rules

- Treat `clasp push`, `clasp deploy`, and `clasp run` as separate capabilities with separate prerequisites.
- Do not assume remote function execution works just because `clasp push` works.
- Before using `clasp run`, check the official clasp docs/GitHub requirements: `.clasp.json` `projectId`, API Executable deployment, `executionApi.access`, OAuth client, Apps Script API, and required OAuth scopes.
- Do not repeatedly ask the user for localhost callback URLs or OAuth codes. Use that path only as a last resort after explaining why `clasp run` is truly required.
- Do not create temporary public web apps, anonymous maintenance endpoints, hardcoded token endpoints, or backdoor-style execution routes.
- Prefer self-repairing, idempotent Apps Script code that can run through existing triggers or safe existing execution paths.
- Never report completion until code is pushed and the available verification path has run or the remaining verification gap is explicit.

## Standard Workflow

1. Inspect the project:
   - Read `.clasp.json`, `appsscript.json`, trigger installer functions, and current automation entrypoints.
   - Search for `ScriptApp.newTrigger`, `ScriptApp.deleteTrigger`, `ScriptApp.getProjectTriggers`, `.everyDays`, `.everyHours`, `.onWeekDay`, `doGet`, `doPost`, `GmailApp`, `MailApp`, `UrlFetchApp`.
   - Identify live sending functions separately from preview/dry-run functions.

2. Make trigger code idempotent:
   - Define managed handler lists and legacy handler lists.
   - Delete all managed and legacy time trigger handlers before creating replacements.
   - Create the expected triggers exactly once.
   - After install, audit `ScriptApp.getProjectTriggers()` and log handler counts.
   - Do not rely only on a version flag; verify actual trigger counts and legacy absence.

3. Add self-repair when `clasp run` is unavailable:
   - Add a lightweight `ensure...Installed_()` helper.
   - Call it at the start of existing scheduled entrypoints before the main lock when possible.
   - Make it lock-protected and no-op when trigger audit is already clean.
   - Use existing safe triggers to repair future trigger state instead of asking the user to manually install triggers.

4. Keep send logic safe:
   - Add business-day guards inside every scheduled sender, even if triggers are weekday-only.
   - For weekend due dates, encode the chosen policy explicitly.
   - Exclude resigned/retired/paused targets before send.
   - Report Chat only for actual sends and actionable failures. Normal skips should go to logs/preview, not noisy Chat messages.

5. Provide dry-run verification:
   - Add preview functions that do not send email, call Chat, or mutate Sheets.
   - Include normal, exception, boundary, weekend, already-sent, already-complete, and excluded cases when possible.
   - If remote execution is blocked, state that clearly and rely on code-level self-repair plus static validation.

## clasp Decision Guide

- Use `clasp push --force` for uploading source after local syntax/static validation.
- Use `clasp deploy` or REST deployment update only when the project actually uses deployments/web apps and the existing deployment ID is known.
- Use `clasp run` only when the project is already configured for it or setup is cheap and safe.
- If `clasp run` fails:
  - Read the exact error.
  - Check official clasp run docs/GitHub before retrying.
  - Avoid OAuth-code loops.
  - Prefer a code design that does not require immediate remote function execution.

## Validation Checklist

- `node --check` or equivalent syntax checks pass for changed `.js`/`.gs.js` files.
- No duplicate global function names remain across Apps Script files unless intentionally overriding.
- Searches show no accidental `ANYONE_ANONYMOUS`, temporary maintenance endpoint, or noisy skip-report phrases.
- Searches show no unwanted `.everyDays(1)` sender trigger when weekdays-only is required.
- Trigger installer deletes old handlers before creating new handlers.
- Trigger audit checks expected handler counts and legacy handler absence.
- `clasp status` shows only expected tracked files.
- Final report includes what was verified, what could not be verified, and what will self-repair on the next scheduled run.

## Useful Searches

```text
newTrigger|deleteTrigger|getProjectTriggers|install.*Triggers|remove.*Triggers
everyDays|everyHours|onWeekDay|timeBased
doGet|doPost|ANYONE_ANONYMOUS|webapp|maintenance|token
GmailApp|MailApp|UrlFetchApp|notifyChat
```
