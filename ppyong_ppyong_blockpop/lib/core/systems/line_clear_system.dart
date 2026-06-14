import '../models/board.dart';
import '../models/piece.dart';

/// 줄 제거 시스템 (PRD §11, §25.8, §25.9)
class LineClearSystem {
  LineClearSystem._();

  /// 완성된 줄(10칸 모두 점유)의 행 인덱스 목록 (PRD §25.8).
  static List<int> findCompletedLines(Board board) {
    final result = <int>[];
    for (int y = 0; y < board.height; y++) {
      if (board.grid[y].every((cell) => cell != null)) {
        result.add(y);
      }
    }
    return result;
  }

  /// 지정한 행을 제거하고 위 블록을 아래로 내린 뒤,
  /// 제거한 수만큼 상단에 빈 행을 추가한 새 Board 를 반환한다 (PRD §25.9).
  static Board clearLines(Board board, List<int> lineIndices) {
    if (lineIndices.isEmpty) return board.clone();

    final removeSet = lineIndices.toSet();
    final kept = <List<PieceType?>>[];
    for (int y = 0; y < board.height; y++) {
      if (!removeSet.contains(y)) {
        kept.add(List<PieceType?>.from(board.grid[y]));
      }
    }

    final addCount = board.height - kept.length;
    final newRows = <List<PieceType?>>[
      for (int i = 0; i < addCount; i++)
        List<PieceType?>.filled(board.width, null),
      ...kept,
    ];

    return Board.fromGrid(newRows);
  }
}
