# 뿅뿅 블록팝 — 게임 코어 (Game Core)

캐주얼 낙하형 블록 퍼즐 **뿅뿅 블록팝**의 MVP 게임 로직.
이 디렉터리는 PRD v0.2 기준 **엔진 독립(pure Dart) 게임 코어**다.

> 제품명은 **뿅뿅 블록팝** 으로만 표기한다. (금지 표기: 뿡뿡 블록팝)

## 결정 사항 (사용자 확정)

| 항목 | 값 |
|---|---|
| 엔진 | **Flutter + Flame** |
| 1차 타깃 플랫폼 | **Android 우선** |
| 이 단계 범위 | **엔진 독립 게임 코어 먼저** (UI/사운드/저장은 다음 단계) |

`lib/core/` 는 순수 Dart라서 Flutter + Flame 앱의 `lib/core` 로 그대로 재사용된다.
게임 규칙은 UI에 의존하지 않는다 (PRD §26.4).

## 구조

```
lib/
├─ main.dart                         ← 진입점 (세로 고정, 저장 로드 후 runApp)
├─ app_state.dart                    ← 전역 상태 + 진행도 반영(코인/도감/최고점)
├─ core/                             ← 엔진 독립 게임 로직 (pure Dart)
│  ├─ game_engine.dart               ←  헤드리스 오케스트레이터 (spawn→drop→lock→clear→score→fever→캐릭터)
│  ├─ constants/ models/ systems/ states/
├─ domain/models/                    ← 저장 모델 (player/settings/skins/collection/save) (§23)
├─ data/save/                        ← SharedPreferences 저장소 (§26.3 Storage)
└─ ui/
   ├─ app.dart                       ← MaterialApp + 라우팅
   ├─ theme/                         ← 파스텔 팔레트, 블록/배경 스킨 (§21)
   ├─ game/blockpop_game.dart        ← Flame 게임 (보드 렌더링 + 자동 낙하)
   ├─ widgets/                       ← ScorePanel/FeverGauge/NextPiece/ControlButtons/리액션 오버레이
   └─ screens/                       ← Splash/Main/Game/Result/Settings/Shop/Collection (§19)
test/                                ← QA(§31) 단위 + 저장 직렬화 + 위젯 스모크
android/  web/                       ← 플랫폼 (Android 1차 타깃, web은 빌드 검증용)
```

## 구현된 게임 규칙 (PRD 매핑)

- 10x20 보드 + 숨김 스폰 영역 처리 (§6, §7.6)
- 7종 테트로미노 / 7-bag 랜덤 (§7)
- 이동 / 시계방향 회전 + SRS-lite wall kick (§8, §9)
- 자동 낙하 / 소프트·하드 드롭 / 고정 / 오버플로 게임오버 (§10, §7.7)
- 줄 제거 1~4줄 (§11)
- 점수 공식 + 콤보 보너스 + 피버 배율 (§12)
- 콤보 / 최대 콤보 (§13)
- 피버 게이지·진입·지속·종료 (§14)
- 캐릭터 리액션 5종 + 우선순위 (양/팬더/토끼/강아지/카피바라) (§15)
- 코인 지급 공식 (§18.2)

## 실행 / 테스트

```bash
flutter pub get
flutter test            # 56개 통과 (코어 QA 51 + 저장 + 위젯 스모크)
flutter analyze         # 이슈 없음
flutter run             # 실행 (Android 1차 타깃)
flutter build web       # 전체 컴파일 검증용
```

### QA 케이스 커버리지 (PRD §31)

| 그룹 | 파일 | 핵심 검증값 |
|---|---|---|
| QA-MOVE / 충돌 | `test/collision_test.dart` | 벽·바닥·기존블록 충돌, 숨김영역 |
| QA-ROT / 회전 | `test/rotation_test.dart` | 90도, wall kick, O 동일, 전부충돌→취소 |
| QA-LINE / 줄제거 | `test/line_clear_test.dart` | 1~4줄 탐지, 하강 |
| QA-SCORE / 점수 | `test/scoring_test.dart` | **1374**, 피버 **2061** |
| QA-COMBO / 콤보 | `test/combo_test.dart` | +1 / 0 초기화 |
| QA-FEVER / 피버 | `test/fever_test.dart` | 100도달·4줄 진입, 8개 종료 |
| QA-CHAR / 캐릭터 | `test/character_reaction_test.dart` | 8케이스 우선순위 |
| 경제 | `test/economy_test.dart` | **35코인** |
| 7-bag | `test/bag_randomizer_test.dart` | 종류별 균등 |
| 엔진 통합 | `test/game_engine_test.dart` | end-to-end 2줄 제거, 게임오버 |

## 다음 단계 (미구현 — 이후 세션)

실제 아트/사운드 에셋 연결(현재 색상·이모지 플레이스홀더), 제스처 조작(§8.2),
튜토리얼(§28), 광고 SDK 실연동(§18.4), Android 실기기 QA(§30). 자세한 진행 상황은 `STATUS.md` 참고.

## 알려진 한계

- 회전은 피벗 기준 단순 회전(§9.2 SRS-lite). I/O 블록은 반복 회전 시 약간의 드리프트가 있을 수
  있으나 wall kick으로 보정된다. 클래식 SRS 정확 재현이 필요하면 추후 교체 (PRD §9.3).
