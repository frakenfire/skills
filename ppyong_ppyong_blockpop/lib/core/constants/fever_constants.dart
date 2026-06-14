/// 피버 상수 (PRD §14)
class FeverConstants {
  FeverConstants._();

  static const int maxGauge = 100; // 최대 게이지
  static const int feverPieces = 8; // 피버 지속 블록 수
  static const double multiplier = 1.5; // 피버 점수 배율

  static const int gainPerLine = 25; // 제거 줄당 게이지 증가
  static const int gainPerCombo = 5; // 콤보당 게이지 증가
}
