import 'package:ppyong_ppyong_blockpop/core/models/board.dart';
import 'package:ppyong_ppyong_blockpop/core/models/piece.dart';
import 'package:ppyong_ppyong_blockpop/core/systems/collision_system.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('충돌 (PRD §7.6 / §31.2)', () {
    test('빈 보드 중앙 스폰은 충돌 아님', () {
      final board = Board.empty();
      final piece = Piece.spawn(PieceType.T); // x=4, y=-1
      expect(CollisionSystem.collides(board, piece.absoluteCells()), false);
    });

    test('QA-MOVE-003: 좌벽을 벗어나면 충돌', () {
      final board = Board.empty();
      final piece = Piece.spawn(PieceType.O, x: 0, y: 5);
      // O 셀 중 x=-1 이 되도록 한 칸 더 왼쪽 위치를 검사
      final abs = piece.absoluteCells(atX: -1);
      expect(CollisionSystem.collides(board, abs), true);
    });

    test('QA-MOVE-004: 우벽을 벗어나면 충돌', () {
      final board = Board.empty();
      final piece = Piece.spawn(PieceType.O, x: 9, y: 5); // 셀 x=9,10 → 10이 우벽 밖
      expect(CollisionSystem.collides(board, piece.absoluteCells()), true);
    });

    test('바닥(y >= height)을 벗어나면 충돌', () {
      final board = Board.empty();
      final piece = Piece.spawn(PieceType.O, x: 4, y: 19); // 셀 y=19,20 → 20이 바닥 밖
      expect(CollisionSystem.collides(board, piece.absoluteCells()), true);
    });

    test('QA-MOVE-005: 기존 고정 블록과 충돌', () {
      final board = Board.empty();
      board.grid[5][4] = PieceType.I;
      final piece = Piece.spawn(PieceType.O, x: 4, y: 4); // 셀 (4,4)(5,4)(4,5)(5,5) → (4,5) 점유
      expect(CollisionSystem.collides(board, piece.absoluteCells()), true);
    });

    test('숨김 스폰 영역(y < 0)은 기존 블록 충돌 검사 안 함', () {
      final board = Board.empty();
      final piece = Piece.spawn(PieceType.O, x: 4, y: -2); // 모든 셀 y < 0
      expect(CollisionSystem.collides(board, piece.absoluteCells()), false);
    });
  });
}
