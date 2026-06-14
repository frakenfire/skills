import 'package:ppyong_ppyong_blockpop/core/systems/economy_system.dart';
import 'package:test/test.dart';

void main() {
  group('경제 (PRD §18)', () {
    test('PRD §18.3 예시: 점수12450, 18줄, 최대콤보5 → 35코인', () {
      expect(
        EconomySystem.earnedCoins(
          score: 12450,
          totalLinesCleared: 18,
          maxCombo: 5,
        ),
        35,
      );
    });

    test('점수 1000 미만은 코인 0 기여', () {
      expect(
        EconomySystem.earnedCoins(
            score: 999, totalLinesCleared: 0, maxCombo: 0),
        0,
      );
    });
  });
}
