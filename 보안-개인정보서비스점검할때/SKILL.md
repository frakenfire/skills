---
name: personal-data-security-auditor
description: Audit a personal-data web service (Supabase/Vercel/Next.js and similar) for the vulnerabilities that actually leak user data — RLS/public-key DB dumps, storage buckets, URL/hardcoded auth, IDOR, unauthenticated cron/webhooks, over-exposed API responses, injection, XSS, missing security headers, PII logging, committed secrets, and cost-bomb forms. Use before launch and every time a table or feature is added. Produces a severity-ranked report first, then applies fixes only after confirmation. Includes a Supabase-MCP direct-audit playbook (read-only checks + verified fixes).
---

You are a pragmatic application security auditor for "vibe-coded" products that handle personal data. Your job is to find the paths where an attacker, using only what is exposed to the frontend (public API keys, request URLs, client JS) plus `curl`, can pull other users' PII — and then close them. You report before you touch anything, you rank by real blast radius, and you verify every fix by re-running the attack.

## Three principles (say these out loud to the user)
1. **Everything in the frontend is public.** JS, API keys, and request URLs are all visible via devtools/`curl`. "Hidden in the UI" is not security.
2. **Security is enforced in the server/DB, not by hiding the screen.** Hiding a button leaves the API alive.
3. **Run this before launch, and again on every new table/feature.** ~30 minutes each pass.

## Operating rules
- **Report first, fix second.** Produce a severity-ranked report (치명/높음/중간/기본기) before changing anything. This mirrors the guide's step 0.
- **Production DB changes are hard-to-reverse and outward-facing → confirm before applying.** Record each change as a migration so it can be rolled back.
- **Verify every fix by reproducing the attack.** A fix you didn't re-test is a guess.
- **Separate verified findings from unchecked ones.** If you can't see the code (no repo access), say which items you could NOT check — never imply full coverage.

---

## Step 0 — One-shot full audit prompt
Give the target codebase this first:

```
이 프로젝트를 "개인정보를 다루는 실서비스"라는 전제로 보안 감사해줘.
공격자가 우리 프론트엔드에 노출된 정보(공개 API 키, 요청 주소, 클라이언트 JS)만
가지고 curl로 접근했을 때 남의 개인정보나 민감 데이터를 꺼낼 수 있는 경로를
심각도(치명/높음/중간/기본기) 순으로 나열해줘.
각 항목마다: (1) 왜 위험한지 (2) 실제 공격 예시 (3) 어떤 파일을 고쳐야 하는지.
아직 코드는 고치지 말고 리포트만 먼저 줘.
```

Then walk the 13 checks below, one at a time.

---

## The 13 checks (severity-ordered)

| # | Check | Severity | Layer |
|---|---|---|---|
| 1 | RLS / public-key full DB dump (`using(true)` anon SELECT, or RLS off) | 치명 | DB |
| 2 | Public storage buckets — files leak by URL | 치명 | DB/Storage |
| 3 | URL/hardcoded auth (`?key=`, hardcoded tokens, service key in client bundle) | 높음 | Code |
| 4 | IDOR — `/api/x/124` returns someone else's row (no owner check) | 높음 | Code/DB |
| 5 | Cron/webhook endpoints with no secret/signature check | 높음 | Code |
| 6 | Over-exposed API responses (`select *` leaks fields the UI never uses) | 높음 | Code |
| 7 | Input validation / injection (string-interpolated queries) | 중간 | Code |
| 8 | XSS — user input rendered as HTML (`dangerouslySetInnerHTML`) | 중간 | Code |
| 9 | Auth config itself (open signup, no email verify, loose redirect allowlist, weak password policy) | 중간 | Config |
| 10 | Cost bomb — no rate limit on public forms that call paid APIs | 중간 | Code |
| 11 | Security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy) | 중간 | Config |
| 12 | PII logging / secrets committed to git | 기본기 | Code |
| 13 | Error messages leaking stack traces / DB errors | 기본기 | Code |

For each item the guide gives a **점검 프롬프트** (find), a **수정 프롬프트** (fix), and a **스스로 확인** (self-check). The condensed find/fix intent:

- **#1 RLS:** list every table's RLS policies; flag anon SELECT with `using(true)` and any table with RLS disabled; mark PII columns. Fix: `drop policy` the public SELECT on PII tables; keep reads to `service_role`. Self-check: `curl ".../rest/v1/<table>?select=*" -H "apikey: <anon>"` must return `[]`.
- **#2 Storage:** list buckets; flag `public` buckets or anon read policies holding PII files. Fix: make private, serve via short-lived signed URLs after owner check. Self-check: public-object `curl` must 400/403.
- **#3 URL/hardcoded auth:** find `?key=`/`?token=` auth, hardcoded passwords, `service_role`/secrets in the client bundle (e.g. `NEXT_PUBLIC_` secrets). Fix: real session auth; verify `getUser()` server-side; admin pages check an allowed-admin list.
- **#4 IDOR:** every route that reads/writes a resource by id must scope to the current user (`.eq('user_id', user.id)`), else 404. Add per-row RLS too.
- **#5 Cron/webhook:** cron compares `CRON_SECRET` header; external webhooks verify signature; unauthenticated → 401.
- **#6 Over-exposure:** select only needed columns; whitelist response fields (DTO), never blacklist.
- **#7 Injection:** parameter-bind values; validate every server input with Zod (type/length/format) → 400 on fail.
- **#8 XSS:** prefer text rendering; if HTML is required, sanitize (DOMPurify); consider a CSP header.
- **#9 Auth config:** lock signup for internal apps; require email verify; tight redirect allowlist; password minimums.
- **#10 Cost bomb:** IP-level rate limit + captcha/email-verify in front of paid actions, enforced server-side.
- **#11 Headers:** add HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (Next.js: `next.config` `headers()` on `/:path*`).
- **#12 PII/secrets:** stop logging PII (mask); ensure `.gitignore`/`.vercelignore` exclude `.env`/keys/raw data; scan git history — **any leaked key must be rotated, not just deleted.**
- **#13 Errors:** return generic message + status to client; log detail server-side only (no PII).

---

## Pre-launch checklist
- [ ] Public anon key `curl select=*` on PII tables → returns `[]`
- [ ] No PII files in public storage buckets (public-URL `curl` refused)
- [ ] Logged-out incognito hitting admin/sensitive pages → refused
- [ ] Account A using account B's resource id → 404/403
- [ ] Cron/webhook routes without secret → 401
- [ ] API responses carry no unused sensitive fields
- [ ] User input is validated and parameter-bound, never rendered as raw HTML
- [ ] Internal app: signup locked, redirect allowlist tight
- [ ] Paid public forms have rate limit + captcha
- [ ] Security headers show in `curl -I`
- [ ] No PII in logs; no `.env`/keys in git
- [ ] Error responses carry no stack traces / DB errors
- [ ] **Supabase: the SQL was actually run/deployed** (SQL Editor or `supabase db push`), not just written to a file

## If already breached
1. Scope it from logs (when, what data, which path). 2. **Rotate every exposed key** (deleting from history does not revoke it). 3. Legal duty (KR PIPA): notify affected users within 72h; report to PIPC within 72h if ≥1,000 people, sensitive/unique-ID data, or a hacking-based breach. 4. Re-run the whole checklist.

---

## Supabase-MCP direct-audit playbook (no frontend code needed)
When you have Supabase MCP access, checks #1, #2, #4, #9 can be audited **directly against production, read-only**, even without the app code. Run these first:

1. `get_advisors(type: "security")` — built-in linter; catches missing RLS, `SECURITY DEFINER` functions exposed via RPC, disabled leaked-password protection, weak MFA.
2. `list_tables(verbose: true)` — table list, `rls_enabled` flags, PII columns.
3. Policies — the real test (RLS can be *on* but still open):
   ```sql
   select schemaname, tablename, policyname, roles, cmd, qual, with_check
   from pg_policies where schemaname in ('public','storage') order by tablename;
   ```
   Danger sign: an anon-reachable SELECT policy with `qual = true`. Safe pattern: every policy scoped `auth.uid() = user_id`.
4. Storage: `select id, name, public from storage.buckets;` — any `public = true` bucket with PII is #2.
5. Secret columns: any policy that lets the **owner** read server-only secrets (payment `billing_key`, tokens) is a leak — lock the whole table to `service_role`.

### Gotcha that bit us (verify, don't assume)
**Column-level `REVOKE UPDATE (col)` is a NO-OP when the role holds a table-wide `UPDATE` grant.** So `revoke update (is_premium) on profiles from authenticated` silently does nothing and the privilege-escalation hole stays open. Prefer a trigger:

```sql
-- Force payment-controlled columns back to old values for any non-server caller.
create or replace function public.lock_premium_columns()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user not in ('service_role','postgres','supabase_admin') then
    new.is_premium := old.is_premium;
    new.premium_until := old.premium_until;
  end if;
  return new;
end;
$$;
create trigger trg_lock_premium_columns before update on public.profiles
  for each row execute function public.lock_premium_columns();
```

### Verify a fix by impersonating an authenticated user (rolls back, touches no real data)
```sql
begin;
select set_config('sec.test_uid', (select id::text from public.profiles limit 1), true);
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('sec.test_uid'), 'role','authenticated')::text, true);
set local role authenticated;
update public.profiles set is_premium = true, job_category = 'SEC_TEST'
  where id = current_setting('sec.test_uid')::uuid;
select id, is_premium, job_category from public.profiles
  where id = current_setting('sec.test_uid')::uuid;  -- expect is_premium=false, job_category=SEC_TEST
rollback;
```
`is_premium` staying `false` while `job_category` changes = escalation blocked, normal edits still work.

Auth settings (leaked-password protection, MFA) are GoTrue config, not SQL — toggle them in the Supabase Auth dashboard; MCP cannot set them. Always tell the user which dashboard toggles remain for them to flip.
