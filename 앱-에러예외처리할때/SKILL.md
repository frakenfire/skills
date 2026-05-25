---
name: flutter-error-handling
description: Flutter 타입 안전 에러 처리 — Error 마커 인터페이스, freezed Result<D,E> sealed 클래스, 기능별 에러 enum, switch 패턴 매칭. "Result 래퍼", "에러 처리", "ResultSuccess", "ResultError", "freezed sealed", "exception 대신 Result" 표현에 사용.
---

# Flutter 에러 처리 — Result<D, E>

## 핵심 철학

예상 가능한 실패에는 **예외를 던지지 않는다.** 대신 타입으로 표현된 `Result` 를 반환한다. 이렇게 하면 호출자가 실패 케이스를 타입 시스템으로 강제로 다루게 되어, 런타임에 놓치는 UI 에러 경로가 사라진다.

예외는 **프레임워크/플랫폼이 던진 것**을 가장 낮은 레이어(Data)에서 잡아 `Result.error(...)` 로 변환하는 용도로만 쓴다. UseCase, ViewModel, Screen 은 더 이상 try/catch 를 보지 않는다.


## 기반 타입 (`lib/core/domain/error/`)

### Error 마커 인터페이스

```dart
// lib/core/domain/error/error.dart
abstract interface class Error {}
```

모든 커스텀 에러 타입은 이 `Error` 를 구현한다. `Result` 의 `E` 는 반드시 `extends Error` 이므로 Dart 표준 `Exception` 과 섞이지 않는다.

### Result<D, E>

```dart
// lib/core/domain/error/result.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'error.dart';

part 'result.freezed.dart';

@freezed
sealed class Result<D, E extends Error> with _$Result<D, E> {
  const factory Result.success(D data) = ResultSuccess;
  const factory Result.error(E error) = ResultError;
}
```

**중요**: `sealed` 로 선언했기 때문에 `switch` 에서 모든 케이스를 Dart 컴파일러가 강제한다. 케이스를 빠뜨리면 컴파일 경고가 뜬다.


## 기능별 에러 정의

에러는 **enum + `implements Error`** 로 정의한다. 각 값은 사용자에게 보여줄 한국어 메시지를 `toString()` 에 둔다.

```dart
// lib/core/domain/error/network_error.dart
enum NetworkError implements Error {
  requestTimeout,
  noInternet,
  serverError,
  unknown;

  @override
  String toString() => switch (this) {
        NetworkError.requestTimeout => '요청 시간이 초과되었습니다',
        NetworkError.noInternet => '인터넷 연결을 확인해 주세요',
        NetworkError.serverError => '서버에 문제가 발생했습니다',
        NetworkError.unknown => '알 수 없는 문제가 발생했습니다',
      };
}
```

공유 에러(`NetworkError`)는 `lib/core/domain/error/` 에, feature 전용 에러는 `lib/domain/error/<feature>_error.dart` 에 둔다. 예: `BookmarkError`, `NewRecipeError`.

**다중 에러는 표현하지 않는다.** 한 `Result` 는 정확히 한 가지 에러만 담는다. 여러 조건을 동시에 알려줘야 한다면 그것은 도메인 설계 문제다.


## UseCase / Repository 반환 타입

```dart
// UseCase 시그니처
Future<Result<List<String>, NetworkError>> execute();
Future<Result<List<Recipe>, BookmarkError>> execute(int recipeId);
```

- 성공 데이터 타입 `D` 와 에러 타입 `E` 를 명시한다.
- Data 레이어에서 네트워크/DB 예외를 catch 해 `NetworkError.unknown` 같은 값으로 변환한다.
- UseCase는 여러 Repository 에러를 자기 feature 에러로 **매핑**해서 반환한다 (예: 북마크 저장 실패 시 `BookmarkError.saveFailed`).


## ViewModel에서 소비하기

sealed 타입이므로 타입 파라미터를 명시해 `switch` 에서 패턴 매칭한다. 이 프로젝트는 다음 형태를 정석으로 쓴다 (`home_view_model.dart` 참조).

```dart
void _fetchCategories() async {
  final result = await _getCategoriesUseCase.execute();

  switch (result) {
    case ResultSuccess<List<String>, NetworkError>():
      _state = state.copyWith(
        categories: result.data,
        selectedCategory: 'All',
      );
      notifyListeners();

    case ResultError<List<String>, NetworkError>():
      switch (result.error) {
        case NetworkError.requestTimeout:
        case NetworkError.noInternet:
        case NetworkError.serverError:
        case NetworkError.unknown:
          _eventController.add(result.error);
      }
  }
}
```

**왜 이렇게 쓰나**:
- `ResultSuccess<D, E>()` / `ResultError<D, E>()` 를 적어야 제네릭이 유지되고 `result.data` / `result.error` 의 구체 타입이 살아 있다.
- 안쪽 `switch (result.error)` 는 모든 enum 케이스를 강제로 나열하게 만들어, 새 에러가 추가될 때 누락된 처리 지점을 컴파일러가 알려준다.


## 에러를 UI로 전달하는 방식

두 가지 표준 패턴이 있다.

### 1) 한 번 보여주는 스낵바/토스트 — `StreamController` 이벤트

```dart
final _eventController = StreamController<NetworkError>();
Stream<NetworkError> get eventStream => _eventController.stream;
```

Root 위젯이 `eventStream` 을 listen 해서 `ScaffoldMessenger.showSnackBar` 를 호출한다. 상태에 담으면 리빌드마다 반복되므로 이벤트로 내보낸다.

### 2) 지속 상태(에러 배너) — State 필드

에러 화면 자체를 그려야 한다면 `State` 에 `NetworkError? error` 필드를 두고 `copyWith(error: ...)` 로 반영한다. 사용자가 닫거나 재시도하면 `error: null` 로 초기화한다.


## Data 레이어 — 예외를 Result로 바꾸는 지점

```dart
Future<Result<List<RecipeDto>, NetworkError>> getRecipes() async {
  try {
    final raw = await _recipeDataSource.getRecipes();
    return Result.success(raw.map(RecipeDto.fromJson).toList());
  } on SocketException {
    return const Result.error(NetworkError.noInternet);
  } on TimeoutException {
    return const Result.error(NetworkError.requestTimeout);
  } catch (_) {
    return const Result.error(NetworkError.unknown);
  }
}
```

원칙:
- 예외가 **발생하는 레이어가 곧 잡는 레이어**다. 플랫폼/HTTP 예외는 Data에서, 도메인 검증 실패는 Domain에서 `Result.error` 로 변환한다.
- Presentation 에는 예외가 절대 올라오지 않게 한다. ViewModel 의 `try/catch` 가 보이면 경고 신호다.


## 어떤 에러 타입을 쓸지 결정표

| 시나리오 | 에러 타입 | 위치 |
|---|---|---|
| 네트워크 호출 실패 | `NetworkError` | `core/domain/error/` |
| 로컬 저장소/DB 실패 | `LocalError` (필요시 신규) | `core/domain/error/` |
| 기능 전용 실패 (북마크 저장 실패 등) | `BookmarkError` 같은 enum | `lib/domain/error/` |
| 여러 DataSource 를 묶는 Repository | 상위 에러 타입 (`NetworkError` 또는 feature error) | 해당 feature |


## 체크리스트

- [ ] 새 feature의 실패 유형을 **enum + `implements Error`** 로 정의했다
- [ ] UseCase 시그니처가 `Future<Result<D, FooError>>` 로 타입 파라미터를 명시한다
- [ ] ViewModel에서 `switch (result)` 가 `ResultSuccess<D, E>()` / `ResultError<D, E>()` 를 모두 처리한다
- [ ] 에러 enum 의 모든 값이 내부 `switch (result.error)` 에서 나열되어 있다
- [ ] Data 레이어가 플랫폼 예외를 catch 해 `Result.error` 로 변환한다
- [ ] Presentation 어디에도 `try/catch` 가 떠돌지 않는다


## 안티 패턴

- ❌ `Future<List<Recipe>>` 를 그대로 반환하고 실패를 `throw` 로 전달 → 호출자가 실패를 잊는다.
- ❌ `Result<List<Recipe>, Exception>` 처럼 `Exception` 을 에러 타입으로 사용 → `Error` 마커의 의미가 사라진다.
- ❌ 한 `Result` 에 리스트로 여러 에러를 담기 → 모델이 복잡해지고 UI 분기가 폭발한다.
- ❌ `switch` 에서 `default:` 로 퉁치기 → 새 에러 값 추가 시 컴파일러가 경고해 주는 안전망을 날려버린다.