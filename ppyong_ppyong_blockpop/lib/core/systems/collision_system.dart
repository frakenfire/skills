import '../models/board.dart';

/// 충돌 판정 (PRD §7.6)
class CollisionSystem {
  CollisionSystem._();

  /// 절대 좌표 셀 목록 [absCells] 가 보드와 충돌하면 true.
  ///
  /// 충돌 조건: x<0, x>=width, y>=height, 또는 (y>=0 이고 해당 칸 점유).
  /// y<0(숨김 스폰 영역)은 기존 블록 충돌 검사를 하지 않는다.
  static bool collides(Board board, List<List<int>> absCells) {
    for (final c in absCells) {
      final x = c[0];
      final y = c[1];
      if (x < 0) return true;
      if (x >= board.width) return true;
      if (y >= board.height) return true;
      if (y >= 0 && board.grid[y][x] != null) return true;
    }
    return false;
  }
}
