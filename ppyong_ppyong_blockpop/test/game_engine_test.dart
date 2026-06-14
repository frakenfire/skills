import 'package:ppyong_ppyong_blockpop/core/game_engine.dart';
import 'package:ppyong_ppyong_blockpop/core/models/piece.dart';
import 'package:ppyong_ppyong_blockpop/core/states/game_state.dart';
import 'package:ppyong_ppyong_blockpop/core/systems/character_reaction_system.dart';
import 'package:test/test.dart';

void main() {
  group('게임 엔진 통합 (PRD §5.1, §25)', () {
    test('init: 보드/블록 초기화, 상태 falling, 레벨1', () {
      final e = GameEngine();
      e.init(seed: 1);
      expect(e.state, GameState.falling);
      expect(e.score, 0);
      expect(e.level, 1);
      expect(e.dropIntervalMs, 900);
      expect(e.totalLinesCleared, 0);
    });

    test('빈 보드 하드 드롭: 줄 제거 없이 고정 후 다음 블록 (게임오버 아님)', () {
      final e = GameEngine();
      e.init(seed: 1);
      final r = e.hardDrop();
      expect(r.removedLines, 0);
      expect(r.gameOver, false);
      expect(e.state, GameState.falling);
    });

    test('2줄 동시 제거 end-to-end: 점수/콤보/캐릭터(팬더)', () {
      final e = GameEngine();
      e.init(seed: 1);
      // 바닥 2줄을 col4,5 만 비우고 채움
      for (final y in [18, 19]) {
        for (var x = 0; x < 10; x++) {
          if (x != 4 && x != 5) e.board.grid[y][x] = PieceType.I;
        }
      }
      e.current = Piece.spawn(PieceType.O); // 2x2 구멍에 정확히 들어감
      final r = e.hardDrop();

      expect(r.removedLines, 2);
      expect(e.totalLinesCleared, 2);
      expect(e.combo, 1);
      expect(r.character, ReactionCharacter.panda);
      expect(r.scoreGain, greaterThan(0));
      expect(r.gameOver, false);
    });

    test('오버플로 고정 시 게임 오버 (PRD §7.7)', () {
      final e = GameEngine();
      e.init(seed: 2);
      // 스폰존을 막아 y<0 에서 고정되도록 유도
      for (final y in [0, 1]) {
        for (final x in [3, 4, 5, 6]) {
          e.board.grid[y][x] = PieceType.T;
        }
      }
      e.current = Piece.spawn(PieceType.O); // y=-1 에서 바로 고정 → y<0 셀 잔존
      final r = e.hardDrop();

      expect(r.gameOver, true);
      expect(e.state, GameState.gameOver);
    });
  });
}
