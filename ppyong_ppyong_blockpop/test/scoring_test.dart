import 'package:ppyong_ppyong_blockpop/core/systems/scoring_system.dart';
import 'package:test/test.dart';

void main() {
  group('점수 (PRD §12 / §31.5)', () {
    test('QA-SCORE-001: 1줄 레벨1 = 100', () {
      expect(
        ScoringSystem.calculateScore(removedLines: 1, combo: 1, level: 1),
        100,
      );
    });

    test('QA-SCORE-002: 2줄 레벨1 = 300', () {
      expect(
        ScoringSystem.calculateScore(removedLines: 2, combo: 1, level: 1),
        300,
      );
    });

    test('QA-SCORE-003: 3줄 레벨1 = 500', () {
      expect(
        ScoringSystem.calculateScore(removedLines: 3, combo: 1, level: 1),
        500,
      );
    });

    test('QA-SCORE-004: 4줄 레벨1 = 800', () {
      expect(
        ScoringSystem.calculateScore(removedLines: 4, combo: 1, level: 1),
        800,
      );
    });

    test('QA-SCORE-005: 2줄 레벨3 콤보4 하드24 = 1374', () {
      expect(
        ScoringSystem.calculateScore(
          removedLines: 2,
          combo: 4,
          level: 3,
          hardDropBonus: 24,
        ),
        1374,
      );
    });

    test('QA-SCORE-006: 피버 중 1374 → floor(1374*1.5) = 2061', () {
      expect(
        ScoringSystem.calculateScore(
          removedLines: 2,
          combo: 4,
          level: 3,
          hardDropBonus: 24,
          isFever: true,
        ),
        2061,
      );
    });

    test('콤보 보너스 공식 (PRD §12.3)', () {
      // max(0, 4-1) * 50 * 3 = 450
      expect(ScoringSystem.comboBonus(4, 3), 450);
      // 콤보 1 → 보너스 0
      expect(ScoringSystem.comboBonus(1, 5), 0);
    });
  });
}
