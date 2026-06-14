/// 한 판의 최종 결과 (Result 화면용, PRD §19.6)
class GameResult {
  final int score;
  final int level;
  final int totalLinesCleared;
  final int maxCombo;
  final int earnedCoins;
  final bool isNewBest;
  final int bestScore;

  const GameResult({
    required this.score,
    required this.level,
    required this.totalLinesCleared,
    required this.maxCombo,
    required this.earnedCoins,
    required this.isNewBest,
    required this.bestScore,
  });
}

/// 플레이 중 누적되는 도감/통계 카운터 (PRD §16.2).
class SessionStats {
  int twoLineClears = 0; // 팬더 해금 조건
  int combo2Events = 0; // 토끼 해금 조건
  int combo3Events = 0; // 강아지 해금 조건
  int fourLineClears = 0; // 카피바라/통계
  int feverEnters = 0; // 카피바라/통계
  final Map<String, int> appearCounts = {}; // 캐릭터 등장 횟수

  void addAppearance(String charId) {
    appearCounts[charId] = (appearCounts[charId] ?? 0) + 1;
  }
}
