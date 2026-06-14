import 'package:ppyong_ppyong_blockpop/core/systems/fever_system.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('피버 (PRD §14 / §31.7)', () {
    test('QA-FEVER-001: 게이지 100 도달 시 진입', () {
      final r = FeverSystem.update(
        feverGauge: 80,
        isFever: false,
        feverPiecesLeft: 0,
        removedLines: 1, // gain = 25 → 80+25 = 105 >= 100
        combo: 0,
      );
      expect(r.justEntered, true);
      expect(r.isFever, true);
      expect(r.feverGauge, 0);
    });

    test('게이지 미달 시 진입하지 않고 누적', () {
      final r = FeverSystem.update(
        feverGauge: 10,
        isFever: false,
        feverPiecesLeft: 0,
        removedLines: 1, // gain = 25 → 35
        combo: 0,
      );
      expect(r.justEntered, false);
      expect(r.feverGauge, 35);
    });

    test('QA-FEVER-002: 4줄 제거 시 즉시 진입', () {
      final r = FeverSystem.update(
        feverGauge: 0,
        isFever: false,
        feverPiecesLeft: 0,
        removedLines: 4,
        combo: 0,
      );
      expect(r.justEntered, true);
      expect(r.isFever, true);
    });

    test('QA-FEVER-003: 피버 진입 후 feverPiecesLeft = 8', () {
      final r = FeverSystem.update(
        feverGauge: 0,
        isFever: false,
        feverPiecesLeft: 0,
        removedLines: 4,
        combo: 0,
      );
      expect(r.feverPiecesLeft, 8);
    });

    test('QA-FEVER-004: 피버 중 8개 고정 시 종료', () {
      var isFever = true;
      var left = 8;
      for (var i = 0; i < 8; i++) {
        final r = FeverSystem.onPieceLocked(
          isFever: isFever,
          feverPiecesLeft: left,
          feverGauge: 0,
        );
        isFever = r.isFever;
        left = r.feverPiecesLeft;
      }
      expect(isFever, false);
      expect(left, 0);
    });

    test('PRD §14.6 예시: 게이지40 + 2줄 + 콤보3 → 진입', () {
      // gain = 2*25 + 3*5 = 65 → 40+65 = 105 >= 100
      final r = FeverSystem.update(
        feverGauge: 40,
        isFever: false,
        feverPiecesLeft: 0,
        removedLines: 2,
        combo: 3,
      );
      expect(r.justEntered, true);
      expect(r.feverGauge, 0);
      expect(r.feverPiecesLeft, 8);
    });

    test('줄 제거 0이면 게이지 변화 없음', () {
      final r = FeverSystem.update(
        feverGauge: 40,
        isFever: false,
        feverPiecesLeft: 0,
        removedLines: 0,
        combo: 5,
      );
      expect(r.feverGauge, 40);
      expect(r.justEntered, false);
    });
  });
}
