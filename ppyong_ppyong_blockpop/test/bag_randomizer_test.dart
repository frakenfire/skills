import 'package:ppyong_ppyong_blockpop/core/models/piece.dart';
import 'package:ppyong_ppyong_blockpop/core/systems/bag_randomizer.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('7-bag (PRD §7.2, §7.3)', () {
    test('한 가방(7개)은 7종을 정확히 1개씩 포함', () {
      final bag = BagRandomizer(seed: 42);
      final drawn = [for (var i = 0; i < 7; i++) bag.next()];
      expect(drawn.toSet(), PieceType.values.toSet());
      expect(drawn.length, 7);
    });

    test('두 가방(14개)은 각 종류 정확히 2개씩', () {
      final bag = BagRandomizer(seed: 7);
      final drawn = [for (var i = 0; i < 14; i++) bag.next()];
      for (final type in PieceType.values) {
        expect(drawn.where((t) => t == type).length, 2, reason: '$type');
      }
    });

    test('같은 seed 는 같은 순서 (결정적)', () {
      final a = BagRandomizer(seed: 99);
      final b = BagRandomizer(seed: 99);
      for (var i = 0; i < 21; i++) {
        expect(a.next(), b.next());
      }
    });
  });
}
