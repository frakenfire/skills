import 'package:ppyong_ppyong_blockpop/core/models/board.dart';
import 'package:ppyong_ppyong_blockpop/core/models/piece.dart';
import 'package:ppyong_ppyong_blockpop/core/systems/line_clear_system.dart';
import 'package:test/test.dart';

void _fillRow(Board b, int y) {
  for (var x = 0; x < b.width; x++) {
    b.grid[y][x] = PieceType.I;
  }
}

void main() {
  group('줄 제거 (PRD §11 / §31.4)', () {
    test('QA-LINE-001: 1줄 완성 → 1줄 제거', () {
      final b = Board.empty();
      _fillRow(b, 19);
      final lines = LineClearSystem.findCompletedLines(b);
      expect(lines, [19]);
    });

    test('QA-LINE-002/003/004: 2~4줄 완성 탐지', () {
      final b = Board.empty();
      for (final y in [16, 17, 18, 19]) {
        _fillRow(b, y);
      }
      expect(LineClearSystem.findCompletedLines(b), [16, 17, 18, 19]);
    });

    test('QA-LINE-006: 완성 줄 없음', () {
      final b = Board.empty();
      b.grid[19][0] = PieceType.I; // 한 칸만 채움
      expect(LineClearSystem.findCompletedLines(b), isEmpty);
    });

    test('QA-LINE-005: 줄 제거 후 위 블록이 아래로 하강', () {
      final b = Board.empty();
      _fillRow(b, 19); // 바닥 줄 완성
      b.grid[18][5] = PieceType.T; // 그 위에 블록 하나

      final lines = LineClearSystem.findCompletedLines(b);
      final after = LineClearSystem.clearLines(b, lines);

      // 위에 있던 블록이 한 칸 내려와 바닥(19행)에 위치
      expect(after.grid[19][5], PieceType.T);
      // 보드 높이는 유지
      expect(after.height, 20);
      // 바닥 줄은 더 이상 가득 차 있지 않음
      expect(after.grid[19].where((c) => c != null).length, 1);
    });

    test('여러 줄 제거 후 상단에 빈 줄 추가', () {
      final b = Board.empty();
      _fillRow(b, 18);
      _fillRow(b, 19);
      final after = LineClearSystem.clearLines(b, [18, 19]);
      expect(after.grid[0].every((c) => c == null), true);
      expect(after.grid[1].every((c) => c == null), true);
    });
  });
}
