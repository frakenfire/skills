/// 점수 상수 (PRD §12)
class ScoreConstants {
  ScoreConstants._();

  /// 제거 줄 수별 기본 점수 (PRD §12.1)
  static const Map<int, int> baseLineScore = {
    0: 0,
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  };

  /// 콤보 보너스 단위 (PRD §12.3): max(0, combo-1) * 50 * level
  static const int comboBonusUnit = 50;

  /// 하드 드롭 보너스 배율 (PRD §10.5): 거리 * 2
  static const int hardDropMultiplier = 2;

  /// 피버 점수 배율 (PRD §12.2)
  static const double feverMultiplier = 1.5;
}
