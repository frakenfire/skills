# notion-mcp-edit 스킬
# 출처: https://developers.notion.com/guides/data-apis/enhanced-markdown
# 최종 업데이트: 2026-05-17

## 트리거 조건
"노션 수정", "노션 삭제", "노션 추가", "노션 페이지 작성", "노션 블록 제거",
"노션 update_content", "노션 HTML 잔재", "노션 깨진 테이블", "노션 콘텐츠 바꿔줘",
"스타팅 페이지", "온보딩 페이지 수정"

---

## 절대 규칙

```
1. old_str은 notion-fetch 결과에서 그대로 복사 — 수동 타이핑 절대 금지
2. command: "update_content" → properties: {} 빈 객체 고정
3. 작업 후 반드시 notion-fetch로 재확인 — 확인 전 완료 선언 금지
4. <br>, <empty-block/> 태그 절대 제거 금지 (마스터 수동 삽입 요소)
5. 범위 밖 블록 건드리지 말 것
6. 변경 전 채팅 보고 → 마스터 승인 → 실행 순서 엄수
```

---

## 작업 표준 순서

```
Step 1. notion-fetch(page_id)        ← 현재 상태 확인 + old_str 확보
Step 2. 수정 범위 확정               ← fetch 결과에서 정확히 복사
Step 3. 마스터에게 보고 → 승인 대기  ← 승인 없이 실행 금지
Step 4. notion-update-page 실행     ← update_content 방식
Step 5. notion-fetch 재확인          ← 반영 여부 검증
Step 6. 잔재 없으면 완료 보고        ← 있으면 재시도
```

---

## 도구 사용법

### notion-fetch
```
용도: 페이지 내용 조회, old_str 원본 확보
파라미터: id (page_id 또는 URL)
주의: 캐시 지연 발생 가능 → 수정 직후 결과가 이전 상태일 수 있음
```

### notion-update-page (update_content) ← 주력 도구
```
command: "update_content"
properties: {}         ← 반드시 빈 객체 고정
content_updates: [
  { old_str: "fetch 결과 그대로 복사", new_str: "교체 내용" }
]
```

### notion-update-page (replace_content) ← 최후 수단만
```
전체 페이지 교체. 자식 페이지/DB 삭제 시 실패.
allow_deleting_content: true 필요 → 반드시 마스터 승인 먼저.
```

---

## 패턴 카탈로그

### [P1] 깨진 HTML 테이블 전체 삭제
```
상황: \<colgroup\>, \<tr\>, \<td\> 잔재 블록 전체 제거

content_updates: [{
  old_str: "[fetch에서 \<colgroup\>부터 \</table\>까지 그대로 복사]",
  new_str: ""
}]

핵심: 바로 뒤 --- 구분선은 old_str에 포함하지 않음 → 자동 보존
```

### [P2] 특정 행만 삭제, closing tag 보존
```
content_updates: [{
  old_str: "[마지막 \<tr\>...\</tr\>\n\</table\>]",
  new_str: "\</table\>"
}]
```

### [P3] 한 페이지에서 복수 삭제 (한 번에)
```
content_updates: [
  { old_str: "삭제 대상 A", new_str: "" },
  { old_str: "삭제 대상 B", new_str: "" }
]
```

### [P4] 여러 페이지 병렬 실행 (토큰 절약)
```
다른 page_id끼리 → 동시 호출 가능
같은 page_id     → 반드시 순차 처리
```

### [P5] 특정 위치 뒤에 내용 삽입
```
content_updates: [{
  old_str: "기존 마지막 문장",
  new_str: "기존 마지막 문장\n\n새로 추가할 내용"
}]
```

### [P6] 섹션 전체 교체
```
content_updates: [{
  old_str: "# **👥 TEAM MEMBER**\n[기존 내용 전체]",
  new_str: "# **👥 TEAM MEMBER**\n[새 내용 전체]"
}]
```

---

## Enhanced Markdown 문법 (공식 스펙)

### 기본 규칙
```
들여쓰기: 탭(\t) 사용. 자식 블록은 부모보다 1탭 더.
이스케이프: 코드 블록 밖 특수문자 → \ * ~ ` $ [ ] < > { } | ^
코드 블록 내부: 이스케이프 금지 (리터럴 처리)
```

### 헤딩
```
# Heading 1 {color="gray_bg"}
## Heading 2
### Heading 3
#### Heading 4   ← H5·H6은 H4로 변환됨. 헤딩에 자식 블록 불가.
```

### 콜아웃
```
<callout icon="📌" color="gray_bg">
	Rich text
	Children (탭 들여쓰기)
</callout>
```

### 컬럼
```
<columns>
	<column>
		Children
	</column>
	<column>
		Children
	</column>
</columns>
```

### 토글
```
<details color="Color">
<summary>Toggle title</summary>
	Children (탭 들여쓰기)
</details>

토글 헤딩:
# Heading {toggle="true" color="Color"}
	Children
```

### 테이블
```
<table header-row="true">
<tr>
<td>헤더1</td><td>헤더2</td>
</tr>
<tr>
<td>내용1</td><td>내용2</td>
</tr>
</table>

속성: fit-page-width, header-row, header-column (선택, 기본값 false)
색상 우선순위: 셀 > 행 > 컬럼
테이블 셀은 rich text만 가능 (자식 블록 불가)
```

### 인용
```
> Rich text {color="Color"}

멀티라인 인용 (여러 > 줄 = 별도 블록):
> Line 1<br>Line 2<br>Line 3 {color="Color"}
```

### 빈 줄 (강제)
```
<empty-block/>    ← 단독 줄. 일반 빈 줄은 렌더링 시 제거됨.
```

### 줄바꿈·구분선
```
<br>    ← 인라인
---     ← 구분선
```

### 페이지·DB 참조
```
<page url="https://notion.so/...">Title</page>
<database url="https://notion.so/..." inline="true">Title</database>
```

### 멘션
```
<mention-user url="URL">User name</mention-user>
<mention-page url="URL">Page title</mention-page>
```

### 색상
```
텍스트: gray, brown, orange, yellow, green, blue, purple, pink, red
배경:   gray_bg, brown_bg, orange_bg, yellow_bg, green_bg, blue_bg, purple_bg, pink_bg, red_bg

블록 색상: {color="gray_bg"}  ← 블록 첫 줄 속성
인라인:    <span color="gray">text</span>
```

### 리치 텍스트
```
**bold**, *italic*, ~~strikethrough~~, `code`
<span underline="true">underline</span>
[link](URL)
$inline math$
```

---

## 실패 처리

```
1. update_content 실행
2. fetch 재확인
3. 잔재 남아있으면:
   a. fetch 결과 다시 복사 (이전 old_str 불일치 가능성)
   b. old_str 범위 재조정 후 재시도
4. 2회 연속 실패 → fetch 결과 그대로 마스터에게 보고 후 지시 대기
```

---

## 자주 발생하는 실패 원인

| 원인 | 해결 |
|---|---|
| old_str 수동 타이핑 | fetch 결과에서 그대로 복사 |
| 유니코드 오입력 (곽·겨 등) | fetch 복사로 해결 |
| properties 누락 | `properties: {}` 항상 포함 |
| old_str 범위 짧아 중복 매칭 | 앞뒤로 범위 확장 |
| fetch 캐시 지연 | 잠시 후 재시도 |
| 동일 page_id 병렬 요청 | 같은 페이지는 순차 처리 |
| 탭 대신 스페이스 | Enhanced Markdown은 탭 필수 |

---

## 토큰 절약 원칙

```
1. 다른 page_id 수정 → 병렬 호출
2. 한 페이지 내 복수 수정 → content_updates 배열에 한 번에
3. 재확인은 fetch 한 번으로
4. old_str은 고유 식별되는 최소 범위 (페이지 전체 복사 금지)
5. replace_content는 최후 수단 — update_content 우선
```

---

## LWC 온보딩 페이지 특이사항

```
페이지 ID 맵:
- 마케팅본부:      338c5bfa-1da7-8130-89c8-cb6477148e77
- CMO/글로벌시딩:  341c5bfa-1da7-8175-893e-ccb8ff1a4a78
- 국내사업본부:    33ec5bfa-1da7-81d2-b140-c5b6923844b0
- 아시아B2C:       363c5bfa-1da7-81a7-9975-ef3b92c94776
- OT 페이지:       2d8c5bfa-1da7-8082-b146-cf82025839d8

구조 순서: 자주 가는 곳 → 본부 미션 → TEAM MEMBER → 실제 운영 소스
          → 성공 방정식 → 데일리 루틴 → 첫 주 문서 → 온보딩 미션
          → 온보딩 여정 → 계정 & 시스템 → 용어집 → 근무 & 복리후생 (항상 마지막)

표현 금지: "것" 명사형("리더가 해줄 것" → "리더가 해줄 일"), "수습" → "첫 3개월"
```

---

## 검증 완료 기준

```
✅ fetch 결과에 삭제 대상 문자열 없음
✅ \<colgroup\>, \<tr\>, \<td\> 잔재 미존재
✅ TEAM MEMBER 섹션 직후 --- 구분선으로 바로 연결
✅ <br>, <empty-block/> 보존 확인
```
