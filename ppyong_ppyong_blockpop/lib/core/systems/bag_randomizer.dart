import 'dart:math';

import '../models/piece.dart';

/// 7-bag 랜덤 생성기 (PRD §7.2, §7.3).
///
/// I, O, T, S, Z, J, L 각 1개로 구성된 가방을 셔플해 하나씩 꺼낸다.
/// 가방이 비면 새 가방을 채워 셔플한다. [seed] 로 결정적 테스트가 가능하다.
class BagRandomizer {
  final Random _rng;
  final List<PieceType> _bag = [];

  BagRandomizer({int? seed}) : _rng = Random(seed);

  void _refill() {
    _bag.addAll(PieceType.values);
    _bag.shuffle(_rng);
  }

  PieceType next() {
    if (_bag.isEmpty) _refill();
    return _bag.removeLast();
  }
}
