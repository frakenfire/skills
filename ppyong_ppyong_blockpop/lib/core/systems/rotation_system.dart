import '../constants/game_constants.dart';
import '../models/board.dart';
import '../models/piece.dart';
import 'collision_system.dart';

/// 회전 시스템 — 시계방향 90도 + SRS-lite wall kick (PRD §9)
class RotationSystem {
  RotationSystem._();

  /// 시계방향 회전을 시도한다. wall kick 후보를 순서대로 검사해
  /// 충돌이 없는 첫 위치를 적용한다. 모두 실패하면 null (회전 취소).
  static Piece? rotate(Board board, Piece piece) {
    final rotated = piece.rotatedCellsCW();
    for (final off in GameConstants.wallKickOffsets) {
      final nx = piece.x + off[0];
      final ny = piece.y + off[1];
      final abs = rotated.map((c) => <int>[nx + c[0], ny + c[1]]).toList();
      if (!CollisionSystem.collides(board, abs)) {
        return piece.copyWith(
          x: nx,
          y: ny,
          rotation: (piece.rotation + 1) % 4,
          cells: rotated,
        );
      }
    }
    return null;
  }
}
