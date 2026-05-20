---
name: flutter-di-get-it
description: Flutter get_it 기반 의존성 주입 — diSetup() 함수, DataSource/Repository/UseCase/ViewModel 등록 순서, 싱글턴 vs 팩토리, getIt<T>() 호출 패턴. "DI 설정", "get_it", "registerSingleton", "registerFactory", "의존성 주입", "ViewModel 등록" 표현에 사용.
---

# Flutter DI — get_it

## 원칙

- DI는 단일 엔트리 `lib/core/di/di_setup.dart` 의 `diSetup()` 함수 하나에서 등록한다. Feature별로 분산하지 않는다 (단일 패키지 구조이므로).
- `main()` 에서 `runApp()` 호출 **전에** `diSetup()` 을 반드시 호출한다.
- Root 위젯에서만 `getIt<T>()` 로 ViewModel을 꺼낸다. Screen 위젯이나 공용 위젯에는 절대 `getIt` 을 쓰지 않는다 (테스트 용이성 확보).
- ViewModel은 **항상 `registerFactory`** 로 등록한다. 싱글톤이면 여러 화면이 같은 상태를 공유하게 되어 버린다.


## 기본 진입점

```dart
// lib/core/di/di_setup.dart
final getIt = GetIt.instance;

void diSetup() {
  // 1) data source
  // 2) repository
  // 3) use case
  // 4) view model
}
```

```dart
// lib/main.dart
void main() {
  diSetup();
  runApp(const MyApp());
}
```

등록 순서는 **의존성 그래프의 리프부터** 위로 올린다. DataSource → Repository → UseCase → ViewModel 순서여야 `getIt()` 이 참조할 때 이미 등록되어 있다.


## 레이어별 등록 패턴

### DataSource (싱글톤)

```dart
getIt.registerSingleton<RecipeDataSource>(RemoteRecipeDataSourceImpl());
getIt.registerSingleton<LocalStorage>(DefaultLocalStorage());
```

인터페이스 타입으로 등록해 구현체를 Root/ViewModel에서 절대 직접 참조하지 않게 만든다.

### Repository (싱글톤)

생성자 파라미터는 `getIt()` 으로 풀어서 전달한다. 제네릭 추론이 필요한 경우 명시적으로 `getIt<Foo>()` 로 쓴다.

```dart
getIt.registerSingleton<RecipeRepository>(
  MockRecipeRepositoryImpl(
    recipeDataSource: getIt(),
  ),
);
getIt.registerSingleton<BookmarkRepository>(MockBookmarkRepositoryImpl());
```

### UseCase (싱글톤)

상태를 갖지 않는 순수 기능이므로 싱글톤으로 충분하다. 타입 파라미터는 생략해도 된다 (구현 클래스가 하나뿐이므로 Dart 추론이 된다).

```dart
getIt.registerSingleton(
  GetSavedRecipesUseCase(
    recipeRepository: getIt(),
    bookmarkRepository: getIt(),
  ),
);
```

### ViewModel (팩토리)

**반드시 `registerFactory` 를 쓴다.** 화면을 다시 열 때 새 인스턴스가 필요하기 때문이다.

```dart
getIt.registerFactory<IngredientViewModel>(
  () => IngredientViewModel(
    ingredientRepository: getIt(),
    procedureRepository: getIt(),
    getDishesByCategoryUseCase: getIt(),
    clipboardService: getIt(),
  ),
);
```


## Root 위젯에서 주입하기

```dart
class SavedRecipesRoot extends StatelessWidget {
  const SavedRecipesRoot({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = getIt<SavedRecipesViewModel>();
    return ListenableBuilder(
      listenable: viewModel,
      builder: (context, _) => SavedRecipesScreen(
        recipes: viewModel.state.recipes,
        onAction: viewModel.onAction,
      ),
    );
  }
}
```

**원칙**: `getIt<>()` 호출은 `*Root` 위젯의 `build()` 안에서만 일어난다. Screen 위젯은 `state` 와 `onAction` 만 받도록 유지해 프리뷰/테스트가 가능하게 한다.


## 싱글톤 vs 팩토리

| 등록 함수 | 언제 쓰나 | 예 |
|---|---|---|
| `registerSingleton<T>(instance)` | 앱 수명 동안 한 인스턴스만 필요. 이미 생성한 객체를 바로 넣을 때 | Repository, DataSource, UseCase, HttpClient |
| `registerLazySingleton<T>(() => ...)` | 최초 접근 시점까지 생성을 늦추고 싶을 때 | 초기화 비용이 큰 객체 |
| `registerFactory<T>(() => ...)` | 호출할 때마다 새 인스턴스 | ViewModel |

이 프로젝트의 실제 예(`lib/core/di/di_setup.dart`)에서는 Repository/DataSource/UseCase는 `registerSingleton`, ViewModel은 `registerFactory` 로 일관되게 분리되어 있다. 이 규칙을 따르라.


## 팩토리 메서드가 필요한 경우

생성자 하나로 끝나지 않고 팩토리 메서드를 호출해야 한다면 람다 폼을 쓴다.

```dart
getIt.registerSingleton<HttpClient>(HttpClientFactory.create(getIt()));
```

Named 파라미터가 필요한 경우도 동일하게 람다 폼을 사용한다.


## 체크리스트 — 새 feature 추가 시 DI 등록

- [ ] DataSource 인터페이스가 `domain` 또는 `data/data_source/` 에 정의되어 있다
- [ ] 구현체를 `registerSingleton<Interface>` 로 등록 (인터페이스 타입 명시)
- [ ] Repository 인터페이스/구현 등록
- [ ] UseCase 등록 (상태 없으면 싱글톤)
- [ ] ViewModel은 **항상 `registerFactory`**
- [ ] Root 위젯에서만 `getIt<ViewModelType>()` 로 꺼냄


## 안티 패턴

- ❌ `getIt<T>()` 를 Screen 위젯, 공용 위젯, StatelessWidget 트리 깊숙이에서 호출 → 테스트와 프리뷰가 불가능해진다.
- ❌ ViewModel을 `registerSingleton` 으로 등록 → 화면 재진입 시 상태가 오염된다.
- ❌ `diSetup()` 밖에서 `getIt.register*` 를 몰래 호출 → 등록 순서와 의존 그래프가 흩어진다.
- ❌ 구현 클래스 타입으로 `getIt` 에서 꺼내기 (`getIt<MockRecipeRepositoryImpl>()`) → 인터페이스 타입으로 꺼내 구현 교체가 가능하게 하라.