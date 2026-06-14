import 'dart:math';

import '../constants/score_constants.dart';

/// 점수 계산 (PRD §12)
class ScoringSystem {
  ScoringSystem._();

  /// 콤보 보너스 (PRD §12.3): max(0, combo-1) * 50 * level
  static int comboBonus(int combo, int level) {
    return max(0, combo - 1) * ScoreConstants.comboBonusUnit * level;
  }

  /// 점수 획득량 (PRD §12.2).
  ///
  /// scoreGain = baseLineScore*level + comboBonus + hardDropBonus + softDropBonus
  /// 피버 중이면 floor(scoreGain * feverMultiplier).
  static int calculateScore({
    required int removedLines,
    required int combo,
    required int level,
    int hardDropBonus = 0,
    int softDropBonus = 0,
    bool isFever = false,
  }) {
    final base = (ScoreConstants.baseLineScore[removedLines] ?? 0) * level;
    final cBonus = comboBonus(combo, level);
    var gain = base + cBonus + hardDropBonus + softDropBonus;
    if (isFever) {
      gain = (gain * ScoreConstants.feverMultiplier).floor();
    }
    return gain;
  }
}
