# Token-Efficient Agent Rules

Use this file as a shared rulebook for Claude Code, Gemini CLI, Codex, Cursor, and other coding agents.

Goal: reduce token waste while keeping engineering quality high.

---

## 1. Work in gates

Do not jump straight into broad code edits.

Use this order:

1. Plan
2. Reality check
3. Minimal execution
4. Verification
5. Evidence-based report

Completion means verified behavior, not code output.

---

## 2. Plan first for large work

For broad, risky, or ambiguous requests, write a short plan before editing.

The plan must include:

| Item | Required content |
|---|---|
| Goal | What result is required |
| Scope | What may be changed |
| Prohibited scope | What must not be touched |
| Files to inspect | Likely files and why |
| Verification | Commands and manual flows |
| Completion criteria | What proves the task is done |

If the user already gave a clear execution command, keep the plan short and proceed.

---

## 3. Reality check before edits

Before changing files, inspect the actual repository state.

Check:

- current branch
- latest commit
- relevant files
- package scripts
- test commands
- environment requirements
- API contracts
- data/schema assumptions
- existing behavior

Do not rely on memory, old chat summaries, or previous branches.

---

## 4. Edit surgically

Prefer the smallest safe change.

Rules:

- Do not rewrite working code without need.
- Do not rename unrelated structures.
- Do not perform broad refactors for small fixes.
- Do not add fake success states for unimplemented features.
- Do not change product policy silently.
- Preserve existing behavior outside the requested scope.

---

## 5. Verify before reporting success

Run available checks.

Common commands:

```bash
npm install
npm run build
npm run lint
npm run test
npm run dev
```

Use the commands actually available in the project.

For UI work, also verify browser flow when possible.

If a check cannot be run, mark it as `NOT_VERIFIED` and explain why.

If credentials or external services are missing, mark the item as `BLOCKED_BY_SECRET`.

---

## 6. Separate secret-blocked work

Do not treat missing credentials as general failure.

Use these labels:

| Label | Meaning |
|---|---|
| PASS | Verified and working |
| FAIL | Verified and failing |
| FIXED | Failed, fixed, and re-verified |
| NOT_VERIFIED | Not run or not inspected |
| BLOCKED_BY_SECRET | Blocked by missing API key, token, credential, or external service |
| NEEDS_USER_DECISION | Requires product, policy, or business decision |

Never invent credentials or simulate real payment, login, email, or AI success.

---

## 7. Output less, but with evidence

Default report format:

| Area | Output |
|---|---|
| Changed files | Paths and one-line reason |
| Verification | Command, result, error if any |
| Remaining risks | Severity and next action |
| Secret-blocked items | Required value and blocked flow |
| User decisions | Only decisions the user must make |

Do not output:

- full files unless requested
- long diffs unless requested
- repeated explanations
- every searched file
- unverified success claims

---

## 8. Verification plan before verification loops

Before repeated checking, write a short verification plan.

| Area | Method | Expected result | Failure handling |
|---|---|---|---|
| Build | project build command | build passes | inspect first relevant error |
| Lint | lint command | lint passes | fix touched files first |
| Runtime | dev/preview command | app renders | inspect console/runtime errors |
| Flow | manual click path | expected UI transition | classify P0/P1/P2 |
| Secret work | external service call | blocked if missing credentials | request only required values |

Avoid repeated "check again" loops without a plan.

---

## 9. Severity rules

| Severity | Definition |
|---|---|
| P0 | App cannot build/run, customer flow blocked, data loss, auth/payment failure, or severe security risk |
| P1 | Core feature broken, wrong state, dead button, misleading UI, or important validation missing |
| P2 | UX/design quality issue, accessibility issue, unclear copy, visual hierarchy problem |
| P3 | Cleanup or polish with no immediate customer impact |

Fix P0/P1 before P2/P3.

---

## 10. Standard final report

```text
[핵심 결론] One sentence with actual status. (확신도 XX%)

1. 수정 범위
   - changed files only

2. 수정 이유
   - why each change was needed

3. 실행한 검증
   - commands/manual checks actually run

4. 실패 또는 미검증 항목
   - NOT_VERIFIED / BLOCKED_BY_SECRET / NEEDS_USER_DECISION

5. 다음에 할 일
   - immediate next actions only
```
