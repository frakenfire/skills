/// 경제 시스템 (PRD §18)
class EconomySystem {
  EconomySystem._();

  /// 결과 화면 코인 지급 (PRD §18.2):
  /// earnedCoins = floor(score / 1000) + totalLinesCleared + maxCombo
  static int earnedCoins({
    required int score,
    required int totalLinesCleared,
    required int maxCombo,
  }) {
    return (score ~/ 1000) + totalLinesCleared + maxCombo;
  }
}
