# 콘솔 세션 API로 올리고 검토 요청하기

크롬 콘솔(`apps-in-toss.toss.im`)에 로그인된 탭에서 `javascript_tool` 로 실행한다.
쿠키 세션을 쓰므로 API 키가 필요 없고, 탭이 가려져 있어도 된다.
`<WS>` = 워크스페이스 번호(콘솔 URL `/workspace/<WS>/`), `<APP>` = appName.

기준 경로: `/console/api-public/v3/appsintossconsole/workspaces/<WS>/mini-app/<APP>`

| 단계 | 메서드 · 경로 | 본문 |
|---|---|---|
| 업로드 시작 | `POST /deployments/initialize` | `{ deploymentId, memo }` → `success.uploadUrl` |
| 파일 올리기 | `PUT <uploadUrl>` | `.ait` 바이트, `Content-Type: application/zip` |
| 업로드 완료 | `POST /deployments/complete` | `{ deploymentId }` |
| 검토 요청 | `POST /bundles/reviews` | `{ deploymentId, releaseNotes }` |
| 검토 취소 | `POST /bundles/reviews/withdrawal` | (본문은 콘솔 번들에서 확인) |
| 광고 그룹 목록 | `GET /in-app-ads-v2/placement-groups` | — `groupId`, `name`, `adFormat`, `state` |

`deploymentId` 는 `npm run build` 로그의 `deploymentId: …` 줄.

## 1) 업로드 시작 + 임시 파일 입력칸 만들기

```js
const WS = '<WS>', APP = '<APP>', DEP = '<deploymentId>';
const base = `/console/api-public/v3/appsintossconsole/workspaces/${WS}/mini-app/${APP}`;
const r = await fetch(`${base}/deployments/initialize`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ deploymentId: DEP, memo: 'v0.1.x 무엇을 고쳤는지' }),
});
const j = await r.json(); window.__ait = j;
let i = document.getElementById('ait-upload-tmp');
if (!i) {
  i = document.createElement('input'); i.type = 'file'; i.id = 'ait-upload-tmp';
  i.setAttribute('aria-label', 'ait 업로드 임시');
  i.style.cssText = 'position:fixed;top:0;left:0;width:10px;height:10px;opacity:.01;z-index:99999';
  document.body.appendChild(i);
}
[r.status, j.resultType, j.error?.reason ?? null];
```

## 2) 파일을 페이지에 넣기

`find` 로 "ait 업로드 임시" ref 를 받고 `file_upload` 에 `.ait` 경로를 넘긴다(10MB 이하).
uploadUrl 에는 서명 쿼리가 있어 결과로 출력하면 차단된다 — 값은 `window.__ait` 에만 둔다.

## 3) PUT + 완료

```js
const f = document.getElementById('ait-upload-tmp').files[0];
const put = await fetch(window.__ait.success.uploadUrl, {
  method: 'PUT', headers: { 'Content-Type': 'application/zip' }, body: f,
});
let c = null;
if (put.ok) {
  const r = await fetch(`${base}/deployments/complete`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deploymentId: DEP }),
  });
  const j = await r.json(); c = [r.status, j.resultType, j.error?.reason ?? null];
}
document.getElementById('ait-upload-tmp').remove();
[f?.size, put.status, c];
```

## 4) 빌드 확인 → 검토 요청

```js
// 앱 출시 표에서 상태 확인: '빌드 중' → '검토 필요'
[...document.querySelectorAll('main table tbody tr')].map(tr => tr.innerText.replace(/\s*\n\s*/g, ' | ').slice(0, 120));

const r = await fetch(`${base}/bundles/reviews`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ deploymentId: DEP, releaseNotes: '출시 노트' }), // releaseNote(단수)면 "필수" 오류
});
```

## API 경로를 다시 찾아야 할 때

콘솔 번들이 바뀌면 경로를 다시 뽑는다(같은 오리진 JS 만 fetch — 외부 스크립트는 막힌다):
```js
const urls = performance.getEntriesByType('resource').map(e => e.name)
  .filter(u => u.startsWith(location.origin) && /\.js(\?|$)/.test(u));
const hits = new Set();
for (const s of urls) {
  const t = await (await fetch(s)).text();
  for (const m of t.matchAll(/["'`]([^"'`\s]{0,100}(?:deploy|bundle|review)[^"'`\s]{0,60})["'`]/gi))
    if (m[1].includes('/')) hits.add(m[1]);
}
[...hits];
```
본문 필드명은 해당 경로 근처의 키 이름(`deploymentId`, `releaseNotes` …)을 모아 추정하고, 오류 메시지로 확정한다.
