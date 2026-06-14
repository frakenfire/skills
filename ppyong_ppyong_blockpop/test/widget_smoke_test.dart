import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ppyong_ppyong_blockpop/app_state.dart';
import 'package:ppyong_ppyong_blockpop/domain/models/game_result.dart';
import 'package:ppyong_ppyong_blockpop/domain/models/save_data.dart';
import 'package:ppyong_ppyong_blockpop/ui/screens/collection_screen.dart';
import 'package:ppyong_ppyong_blockpop/ui/screens/main_screen.dart';
import 'package:ppyong_ppyong_blockpop/ui/screens/result_screen.dart';

void main() {
  setUp(() {
    AppState.instance.data = SaveData();
  });

  testWidgets('메인 화면 빌드 + 제품명/시작 버튼', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: MainScreen()));
    expect(find.text('시작하기'), findsOneWidget);
    expect(find.text('블록팝'), findsOneWidget);
    // 금지 표기 부재
    expect(find.text('뿡뿡'), findsNothing);
  });

  testWidgets('도감 화면 빌드 + 5종 캐릭터', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: CollectionScreen()));
    expect(find.text('양'), findsOneWidget); // 기본 해금
    expect(find.byType(GridView), findsOneWidget);
  });

  testWidgets('결과 화면 빌드 + 최고 기록', (tester) async {
    const r = GameResult(
      score: 1374,
      level: 3,
      totalLinesCleared: 6,
      maxCombo: 4,
      earnedCoins: 11,
      isNewBest: true,
      bestScore: 1374,
    );
    await tester.pumpWidget(const MaterialApp(home: ResultScreen(result: r)));
    expect(find.text('최고 기록 달성!'), findsOneWidget);
    expect(find.text('1374'), findsWidgets); // 점수 + 최고 기록
  });
}
