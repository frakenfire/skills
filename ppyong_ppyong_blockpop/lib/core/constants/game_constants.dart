import '../models/piece.dart';

/// 보드 / 블록 / 회전 / 낙하 속도 등 핵심 상수. PRD §6, §7, §9, §10 기준.
class GameConstants {
  GameConstants._();

  // 보드 (PRD §6.1)
  static const int boardWidth = 10; // 표시 보드 가로
  static const int boardHeight = 20; // 표시 보드 세로 (렌더링/저장 대상)
  static const int hiddenRows = 2; // 숨김 스폰 영역
  static const int totalRows = boardHeight + hiddenRows; // 22

  // 스폰 위치 (PRD §7.5)
  static const int spawnX = 4;
  static const int spawnY = -1;

  // 고정 지연 (PRD §10.4)
  static const int lockDelayMs = 500;
  static const int maxLockResets = 15;

  /// 피벗 기준 상대 좌표 (PRD §7.4)
  static const Map<PieceType, List<List<int>>> pieceCells = {
    PieceType.I: [
      [-1, 0],
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    PieceType.O: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    PieceType.T: [
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    PieceType.S: [
      [0, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
    ],
    PieceType.Z: [
      [-1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    PieceType.J: [
      [-1, 0],
      [0, 0],
      [1, 0],
      [-1, 1],
    ],
    PieceType.L: [
      [-1, 0],
      [0, 0],
      [1, 0],
      [1, 1],
    ],
  };

  /// SRS-lite wall kick 후보 (PRD §9.2). 시도 순서: 제자리→좌1→우1→좌2→우2→위1.
  static const List<List<int>> wallKickOffsets = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [0, -1],
  ];

  /// 레벨별 `[필요 누적 제거 줄, 자동 낙하 간격 ms]` (PRD §10.2). 인덱스 0 = 레벨 1.
  static const List<List<int>> levelTable = [
    [0, 900],
    [10, 800],
    [20, 700],
    [30, 600],
    [40, 500],
    [55, 420],
    [70, 360],
    [90, 300],
    [110, 250],
    [140, 220],
  ];

  /// 누적 제거 줄 수로 현재 레벨(1~10) 산출 (PRD §10.3).
  static int levelForLines(int totalLines) {
    int level = 1;
    for (int i = 0; i < levelTable.length; i++) {
      if (totalLines >= levelTable[i][0]) {
        level = i + 1;
      }
    }
    return level;
  }

  /// 현재 레벨의 자동 낙하 간격(ms).
  static int dropIntervalMs(int level) {
    final idx = (level - 1).clamp(0, levelTable.length - 1);
    return levelTable[idx][1];
  }
}
