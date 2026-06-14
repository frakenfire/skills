import 'package:ppyong_ppyong_blockpop/core/models/board.dart';
import 'package:ppyong_ppyong_blockpop/core/models/piece.dart';
import 'package:ppyong_ppyong_blockpop/core/systems/rotation_system.dart';
import 'package:test/test.dart';

void main() {
  group('회전 (PRD §9 / §31.3)', () {
    test('QA-ROT-001: 빈 공간 회전 → 제자리 90도 적용', () {
      final board = Board.empty();
      final piece = Piece.spawn(PieceType.T, x: 4, y: 5);
      final r = RotationSystem.rotate(board, piece);
      expect(r, isNotNull);
      expect(r!.x, 4); // offset [0,0]
      expect(r.rotation, 1);
    });

    test('QA-ROT-002/003: 충돌 시 wall kick 으로 위치 보정', () {
      final board = Board.empty();
      // 제자리 세로 회전이 (4,4)에서 막히도록 막음 → 좌1 kick(x=3)으로 해소
      board.grid[4][4] = PieceType.O;
      final piece = Piece.spawn(PieceType.I, x: 4, y: 5);
      final r = RotationSystem.rotate(board, piece);
      expect(r, isNotNull);
      expect(r!.x, 3); // 좌1 wall kick 적용
    });

    test('QA-ROT-004: 모든 후보 충돌 → 회전 취소(null)', () {
      final board = Board.empty();
      for (var y = 0; y < board.height; y++) {
        for (var x = 0; x < board.width; x++) {
          board.grid[y][x] = PieceType.I;
        }
      }
      // 가로 I 가 놓일 4칸만 비움
      for (final x in [3, 4, 5, 6]) {
        board.grid[10][x] = null;
      }
      final piece = Piece.spawn(PieceType.I, x: 4, y: 10);
      expect(RotationSystem.rotate(board, piece), isNull);
    });

    test('QA-ROT-005: O 블록 회전 → 셀 동일 유지', () {
      final board = Board.empty();
      final piece = Piece.spawn(PieceType.O, x: 4, y: 5);
      final r = RotationSystem.rotate(board, piece);
      expect(r, isNotNull);
      expect(r!.cells, piece.cells); // 시각적으로 동일
      expect(r.x, 4);
    });
  });
}
