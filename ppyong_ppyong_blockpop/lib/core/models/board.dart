import '../constants/game_constants.dart';
import 'piece.dart';

/// 표시 영역(20행 x 10열) 고정 블록 격자.
///
/// y >= 0 인 셀만 저장한다. 숨김 스폰 영역(y < 0)은 저장하지 않고
/// 충돌 로직에서만 다룬다 (PRD §6.3, §7.6, §23.3).
class Board {
  final int width;
  final int height;
  final List<List<PieceType?>> grid;

  Board._(this.width, this.height, this.grid);

  factory Board.empty() {
    return Board._(
      GameConstants.boardWidth,
      GameConstants.boardHeight,
      List.generate(
        GameConstants.boardHeight,
        (_) => List<PieceType?>.filled(GameConstants.boardWidth, null),
      ),
    );
  }

  /// 기존 행 목록으로 보드를 만든다 (줄 제거 결과 적용용).
  factory Board.fromGrid(List<List<PieceType?>> rows) {
    return Board._(GameConstants.boardWidth, rows.length, rows);
  }

  /// 해당 좌표가 고정 블록으로 점유됐는지. y < 0 은 항상 비점유.
  bool isOccupied(int x, int y) {
    if (y < 0) return false;
    return grid[y][x] != null;
  }

  Board clone() {
    return Board._(
      width,
      height,
      grid.map((r) => List<PieceType?>.from(r)).toList(),
    );
  }
}
