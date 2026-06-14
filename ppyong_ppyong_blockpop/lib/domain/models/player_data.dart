/// 플레이어 누적 데이터 (PRD §23.1 player)
class PlayerData {
  int bestScore;
  int totalCoins;
  int totalGems;
  int totalLinesCleared;
  int maxComboAllTime;
  int playedCount;
  int feverCount;
  int fourLineClearCount;

  PlayerData({
    this.bestScore = 0,
    this.totalCoins = 0,
    this.totalGems = 0,
    this.totalLinesCleared = 0,
    this.maxComboAllTime = 0,
    this.playedCount = 0,
    this.feverCount = 0,
    this.fourLineClearCount = 0,
  });

  Map<String, dynamic> toJson() => {
        'bestScore': bestScore,
        'totalCoins': totalCoins,
        'totalGems': totalGems,
        'totalLinesCleared': totalLinesCleared,
        'maxComboAllTime': maxComboAllTime,
        'playedCount': playedCount,
        'feverCount': feverCount,
        'fourLineClearCount': fourLineClearCount,
      };

  factory PlayerData.fromJson(Map<String, dynamic> j) => PlayerData(
        bestScore: j['bestScore'] as int? ?? 0,
        totalCoins: j['totalCoins'] as int? ?? 0,
        totalGems: j['totalGems'] as int? ?? 0,
        totalLinesCleared: j['totalLinesCleared'] as int? ?? 0,
        maxComboAllTime: j['maxComboAllTime'] as int? ?? 0,
        playedCount: j['playedCount'] as int? ?? 0,
        feverCount: j['feverCount'] as int? ?? 0,
        fourLineClearCount: j['fourLineClearCount'] as int? ?? 0,
      );
}
