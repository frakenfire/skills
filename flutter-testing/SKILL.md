---
name: flutter-testing
description: |
  Flutter 프로젝트의 테스트 작성 패턴 — `flutter_test` 기반 단위 테스트와 위젯 테스트, `ChangeNotifier` ViewModel 검증, Fake Repository, `pumpWidget` + `ListenableBuilder`, 스트림 검증. "테스트 작성", "ViewModel 테스트", "widget test", "pumpWidget", "Fake Repository", "Mock", "단위 테스트" 같은 표현에 트리거합니다.
---

# Flutter 테스트

## 스택

| 관심사 | 라이브러리 |
|---|---|
| 단위/위젯 테스트 프레임워크 | `flutter_test` (pub.dev 기본) |
| 의존성 대체 | **Fake 직접 작성** (mock 라이브러리 지양) |
| 스트림 검증 | `Stream.first`, `expectLater(stream, emits...)` |

프로젝트에는 `flutter_test` 외의 테스트 의존성이 없다. `mockito`/`mocktail` 을 도입하기 전에 **Fake** 로 먼저 작성해 본다 — 대부분 Fake 만으로 충분하고 유지보수가 쉽다.

---

## 디렉터리

테스트는 프로덕션 코드와 거울 구조로 둔다.

```
test/
└─ presentation/
   └─ ingredient/
      └─ ingredient_screen_test.dart
```

- Unit test: `test/<layer>/<feature>/<file>_test.dart`
- Widget test: `test/presentation/<feature>/<feature>_screen_test.dart`

---

## 단위 테스트 — UseCase

가장 쉬운 출발점. Repository 를 Fake 로 바꿔 끼우고 입·출력만 확인한다.

```dart
// test/domain/use_case/get_saved_recipes_use_case_test.dart
void main() {
  test('북마크된 id 집합에 해당하는 레시피만 스트림으로 흘러나온다', () async {
    final useCase = GetSavedRecipesUseCase(
      recipeRepository: FakeRecipeRepository(
        recipes: [Recipe(id: 1, /* ... */), Recipe(id: 2, /* ... */)],
      ),
      bookmarkRepository: FakeBookmarkRepository(initialIds: {2}),
    );

    final result = await useCase.execute().first;

    expect(result.map((e) => e.id), [2]);
  });
}
```

스트림의 첫 이벤트만 필요하면 `.first` 가 편하다. 여러 이벤트의 순서를 확인하려면 `expectLater(stream, emitsInOrder([...]))`.

---

## 단위 테스트 — ChangeNotifier ViewModel

`ChangeNotifier` 는 `addListener` 로 변경을 관찰하거나, `notifyListeners()` 후 바로 `viewModel.state` 를 읽어 확인한다.

```dart
void main() {
  late FakeIngredientRepository ingredientRepo;
  late FakeProcedureRepository procedureRepo;
  late FakeGetDishesByCategoryUseCase getDishes;
  late FakeClipboardService clipboard;
  late IngredientViewModel viewModel;

  setUp(() {
    ingredientRepo = FakeIngredientRepository();
    procedureRepo = FakeProcedureRepository();
    getDishes = FakeGetDishesByCategoryUseCase();
    clipboard = FakeClipboardService();
    viewModel = IngredientViewModel(
      ingredientRepository: ingredientRepo,
      procedureRepository: procedureRepo,
      getDishesByCategoryUseCase: getDishes,
      clipboardService: clipboard,
    );
  });

  test('OnTapProcedure 를 받으면 선택 탭 인덱스가 1로 바뀐다', () {
    viewModel.onAction(const IngredientAction.onTapProcedure());
    expect(viewModel.state.selectedTabIndex, 1);
  });

  test('OnTapShareMenu 는 클립보드에 링크를 복사한다', () {
    viewModel.onAction(const IngredientAction.onTapShareMenu('https://example.com'));
    expect(clipboard.copiedTexts, ['https://example.com']);
  });
}
```

**스트림 업데이트를 기다려야 할 때**: `pumpEventQueue()` 를 `await` 해서 마이크로태스크를 비운 뒤 상태를 단언한다.

```dart
viewModel.onAction(const IngredientAction.loadRecipe(1));
await pumpEventQueue();
expect(viewModel.state.recipe, isNotNull);
```

**리스너가 여러 번 불렸는지 세고 싶으면**:

```dart
int notifyCount = 0;
viewModel.addListener(() => notifyCount++);
viewModel.onAction(const IngredientAction.onTapIngredient());
expect(notifyCount, 1);
```

---

## Fake 작성법

구현할 인터페이스는 `lib/domain/repository/` 에 이미 있다. 테스트 전용 디렉터리 `test/fake/` 에 간단한 인메모리 구현을 둔다.

```dart
class FakeRecipeRepository implements RecipeRepository {
  FakeRecipeRepository({List<Recipe>? recipes}) : _recipes = recipes ?? [];
  final List<Recipe> _recipes;

  @override
  Future<List<Recipe>> getRecipes() async => _recipes;

  @override
  Future<Recipe?> getRecipe(int id) async =>
      _recipes.where((r) => r.id == id).firstOrNull;
}
```

```dart
class FakeBookmarkRepository implements BookmarkRepository {
  FakeBookmarkRepository({Set<int>? initialIds}) : _ids = {...?initialIds} {
    _controller.add(_ids);
  }
  final Set<int> _ids;
  final _controller = StreamController<Set<int>>.broadcast();

  @override
  Stream<Set<int>> bookmarkIdsStream() => _controller.stream;

  @override
  Future<void> toggle(int id) async {
    _ids.contains(id) ? _ids.remove(id) : _ids.add(id);
    _controller.add({..._ids});
  }
  // 나머지 메서드는 동일 패턴
}
```

**원칙**:
- 실제 비즈니스 로직과 무관한 "가장 단순한 정답" 을 리턴한다.
- 실패 시나리오를 시뮬레이션할 변수를 둔다: `bool shouldReturnError = false;` → `if (shouldReturnError) return Result.error(...)`.
- `BehaviorSubject` 대신 `StreamController.broadcast()` + 수동 `add()` 로 충분하다 (rxdart 의존 없이).

---

## 위젯 테스트 — Screen 분리 덕분에 쉽다

Screen 은 `state` 와 `onAction` 만 받으므로 ViewModel 없이 직접 `pumpWidget` 할 수 있다.

```dart
void main() {
  testWidgets('레시피가 있으면 IngredientRecipeCard 가 표시된다', (tester) async {
    final state = IngredientState(
      recipe: Recipe(id: 1, name: 'Pizza', /* ... */),
      ingredients: const [],
      procedures: const [],
    );

    await tester.pumpWidget(
      MaterialApp(
        home: IngredientScreen(
          state: state,
          onAction: (_) {},
          onTapMenu: (_) {},
        ),
      ),
    );

    expect(find.text('Pizza'), findsOneWidget);
  });

  testWidgets('Procedure 탭을 누르면 onAction 으로 OnTapProcedure 가 전달된다', (tester) async {
    IngredientAction? captured;
    await tester.pumpWidget(
      MaterialApp(
        home: IngredientScreen(
          state: IngredientState(recipe: /* ... */),
          onAction: (a) => captured = a,
          onTapMenu: (_) {},
        ),
      ),
    );

    await tester.tap(find.text('Procedure'));
    expect(captured, isA<OnTapProcedure>());
  });
}
```

**요령**:
- 최상위를 `MaterialApp` 으로 감싸 `Directionality`, 테마, `MediaQuery` 기본값을 제공한다.
- 다이얼로그/스낵바/네비게이션은 Root 책임이라 Screen 테스트에서는 검증할 필요가 없다.
- 이미지·네트워크가 들어간 위젯은 `NetworkImage` 가 테스트 환경에서 실패할 수 있다. 필요하면 `provideMockedNetworkImages` 헬퍼를 만들거나, 이미지 부분을 프리뷰 플래그로 분기한다.

---

## Root 위젯 테스트는 언제?

Root 는 `getIt` 을 통해 실제 ViewModel 을 가져오므로 `diSetup()` 에 Fake 를 등록해 주는 유틸이 필요하다. Screen 테스트 + ViewModel 단위 테스트만으로도 대부분의 회귀가 잡힌다. Root 위젯은 통합 테스트(`integration_test/`)로 다룰 때가 자연스럽다.

Root 를 꼭 테스트해야 한다면:
```dart
setUp(() {
  getIt.reset();
  getIt.registerFactory<IngredientViewModel>(() => FakeIngredientViewModel());
});
```

---

## Robot 패턴 — 복잡한 화면 테스트

한 화면에 3개 이상의 위젯 테스트가 누적되면 Robot 패턴으로 setup 을 공유한다.

```dart
class IngredientRobot {
  IngredientRobot(this.tester);
  final WidgetTester tester;

  Future<IngredientRobot> pump(IngredientState state, {ValueChanged<IngredientAction>? onAction}) async {
    await tester.pumpWidget(MaterialApp(
      home: IngredientScreen(
        state: state,
        onAction: onAction ?? (_) {},
        onTapMenu: (_) {},
      ),
    ));
    return this;
  }

  Future<IngredientRobot> tapProcedureTab() async {
    await tester.tap(find.text('Procedure'));
    await tester.pump();
    return this;
  }

  IngredientRobot expectRecipeName(String name) {
    expect(find.text(name), findsOneWidget);
    return this;
  }
}
```

테스트에서는 체인으로 사용:
```dart
await IngredientRobot(tester)
    .pump(state)
    .then((r) => r.tapProcedureTab())
    .then((r) => r.expectRecipeName('Pizza'));
```

---

## 무엇을 테스트할 것인가

- **UseCase**: 입·출력이 명확하고 사이드이펙트가 드물어 가장 가성비가 높다. 우선 작성.
- **ViewModel**: 사용자 Action → 상태 변환 규칙. Fake Repository 와 결합해 단위 테스트.
- **Screen 위젯 테스트**: 렌더링/입력 전달. 복잡한 조건부 UI(비어있음, 로딩, 에러) 를 커버.
- **Data 레이어**: 매핑(`fromJson`) 이 까다로운 곳은 goldens 대신 단순 `expect` 로 키 필드 검증.
- **통합 테스트**: 실제 end-to-end 시나리오 (로그인 → 홈 → 상세) 는 `integration_test/` 에.

---

## 체크리스트

- [ ] 새 UseCase 마다 단위 테스트 1개 이상 (성공 + 실패 경로 각 1개)
- [ ] ViewModel 의 각 Action 케이스별 최소 1개 단언
- [ ] Screen 에 조건부 분기가 있다면 각 분기마다 `testWidgets`
- [ ] Fake 는 `test/fake/` 아래 공유
- [ ] `dispose()` 에서 스트림 취소 로직이 있다면 ViewModel 테스트에서 `dispose()` 를 명시적으로 호출해 검증

---

## 안티 패턴

- ❌ 실제 `getIt` 전역 상태를 공유한 채 테스트 실행 → 테스트 순서 의존성이 생긴다. 필요하면 `getIt.reset()` 을 setUp 에.
- ❌ Screen 테스트에서 내비게이션/스낵바를 검증하려고 전체 `MaterialApp.router` 를 띄우기 → Root 통합 테스트로 분리.
- ❌ `await Future.delayed(Duration(seconds: 1))` 같은 sleep 기반 동기화 → `pumpEventQueue`, `tester.pump(...)`, `expectLater` 를 써라.
- ❌ Mock 라이브러리로 모든 의존성을 자동 생성 → 작고 명시적인 Fake 가 읽기 쉽고 오해가 적다.
- ❌ Private 메서드 테스트를 위해 `@visibleForTesting` 남용 → public 인터페이스(Action, State) 로만 테스트한다.
