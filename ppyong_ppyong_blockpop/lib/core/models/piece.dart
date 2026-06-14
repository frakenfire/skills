import '../constants/game_constants.dart';

/// 7종 테트로미노 (PRD §7.1)
enum PieceType { I, O, T, S, Z, J, L }

/// 현재 조작 중인 블록.
///
/// 좌표계: 원점 좌상단, x→오른쪽 증가, y→아래 증가 (PRD §6.3).
/// [cells] 는 회전이 적용된 "피벗 기준 상대 좌표" 목록이다.
class Piece {
  final PieceType type;
  final int x;
  final int y;
  final int rotation; // 0~3, 시계방향 단계
  final List<List<int>> cells;

  const Piece({
    required this.type,
    required this.x,
    required this.y,
    required this.rotation,
    required this.cells,
  });

  /// 기본 스폰 상태 블록 생성 (PRD §7.4, §7.5)
  factory Piece.spawn(
    PieceType type, {
    int x = GameConstants.spawnX,
    int y = GameConstants.spawnY,
  }) {
    return Piece(
      type: type,
      x: x,
      y: y,
      rotation: 0,
      cells: GameConstants.pieceCells[type]!
          .map((c) => <int>[c[0], c[1]])
          .toList(),
    );
  }

  /// 보드 절대 좌표 목록 `[[absX, absY], ...]`.
  /// 위치([atX]/[atY])나 셀([withCells])을 가정해 미리 계산할 수 있다 (충돌 검사용).
  List<List<int>> absoluteCells({int? atX, int? atY, List<List<int>>? withCells}) {
    final px = atX ?? x;
    final py = atY ?? y;
    final cs = withCells ?? cells;
    return cs.map((c) => <int>[px + c[0], py + c[1]]).toList();
  }

  Piece copyWith({int? x, int? y, int? rotation, List<List<int>>? cells}) {
    return Piece(
      type: type,
      x: x ?? this.x,
      y: y ?? this.y,
      rotation: rotation ?? this.rotation,
      cells: cells ?? this.cells,
    );
  }

  /// 시계방향 90도 회전된 상대 좌표 (PRD §9.1).
  ///
  /// y축이 아래로 증가하는 좌표계에서 시계방향 회전은 (x, y) -> (-y, x).
  /// O 블록은 회전해도 시각적으로 동일하므로 그대로 둔다 (PRD §9.1, QA-ROT-005).
  List<List<int>> rotatedCellsCW() {
    if (type == PieceType.O) {
      return cells.map((c) => <int>[c[0], c[1]]).toList();
    }
    return cells.map((c) => <int>[-c[1], c[0]]).toList();
  }
}
