# 🎯 AGENTS.md - 글로벌 하네스 & Flutter 아키텍처 지침

> **"검증되지 않은 코드는 존재하지 않는다. 완료 기준은 '실행'이 아니라 '물리적 검증'이다."**

---

## 1. 7단계 검증 하네스 (Harness Rules)

모든 작업은 코드 작성 전후로 아래 7단계 게이트를 거치며 물리적 증거를 기반으로만 완료를 선언한다.

1. **Intake Gate**: 목표, 수정/실행 범위, 수정 금지 범위를 확인한다. 확신도 95% 이하 시 질문한다.
2. **Plan Gate**: 변경 파일, 실행 명령, UI 흐름, 검증 성공 기준, 롤백 경로를 사전 수립한다.
3. **Reality Gate**: 기존 정상 동작, API 계약, 파일 상태, DB 스키마, 테스트 상태를 직접 확인한다.
4. **Execution Gate**: 최소(surgical) 변경을 수행한다. 정상 동작 중인 기존 코드를 임의로 전면 재작성하지 않는다.
5. **Verification Gate**: Lint/Test 실행, 생성 파일 내용 재조회, UI 변경 시 스크린샷 및 렌더링 검증을 수행한다.
   - 프로젝트 내 검증 스크립트(`check-quality.js`, `check-reality.js`, `verify-ui.js`)를 반드시 실행한다.
6. **Report Gate**: 하단 템플릿에 따라 실제 상태와 일치하는 증거 기반 보고서를 작성한다. (거짓/추정 보고 금지)
7. **Memory Gate**: 작업 종료 시 `walkthrough.md`를 동기화하고 재발 방지책을 기록한다.

---

## 2. Flutter 근본 아키텍처 규칙 (Survival Skills)

### A. Presentation 레이어 (MVI & Root-Screen)
- **State & Action**: `freezed` 불변 객체 `State`와 `sealed class Action`을 정의한다.
- **ViewModel**: `ChangeNotifier`를 믹스인하며, 단일 진입점인 `onAction(Action)`에서 switch 분기 처리한다. `BuildContext`나 네비게이션 효과는 몰라야 한다.
- **Root & Screen**: `Root` 위젯은 DI(`getIt`)와 이벤트 구독, `ListenableBuilder` 상태 변경을 처리하고, `Screen`은 `state`와 `onAction` 콜백만 수신하는 **순수 UI(Dummy)**로 구성한다.

### B. Data & DI 레이어 (DataSource, Repository, get_it)
- **DataSource vs Repository**: DataSource는 원시 DTO(`Map`)를 다루고, Repository 구현체(`*Impl`)는 이를 도메인 모델(`freezed`)로 매핑하여 반환한다.
- **반응형 상태 공유**: 동일 데이터(북마크, 세션 등)를 공유 관찰할 때는 `rxdart`의 `BehaviorSubject` 스트림을 이용한다.
- **DI 규칙**: `diSetup()`에서 그래프를 완성하며, **ViewModel은 항상 `registerFactory`**로 등록하여 상태 오염을 방지한다.

### C. 에러 처리 & 네비게이션
- **타입 안전 에러**: 예외(`throw Exception`)를 위로 던지지 않고, `Result<D, E extends Error>` sealed 객체를 사용하여 컴파일러 수준에서 모든 성공/실패 분기를 강제 처리한다.
- **go_router**: 경로 상수는 `RoutePaths`로 중앙 집중 관리하며, 딥링크와 바텀 네비게이션(`StatefulShellRoute`)을 명확히 구현한다. Screen은 context 네비게이션을 직접 수행하지 않고 콜백으로 위임한다.

### D. 실전 검증 & Fake 테스트
- **Fake 직접 작성**: 무겁고 깨지기 쉬운 Mocking 라이브러리 대신 명시적인 인메모리 `Fake` 객체를 작성해 UseCase 및 ViewModel 비즈니스 로직을 격리 테스트한다.

---

## 3. 작업 보고 템플릿

```text
[핵심 결론] 작업 결과를 한 문장으로 말한다. (확신도 XX%)

1. 수정 범위: (변경된 파일 및 경로)
2. 수정 이유: (작업의 의도 및 아키텍처적 일치성)
3. 실행한 검증: (물리적 성공 증거, 테스트 로그 등)
4. 실패 또는 미검증 항목: (미검증 대상 및 사유)
5. 다음에 할 일: (후속 개선 또는 연계 작업)
```
