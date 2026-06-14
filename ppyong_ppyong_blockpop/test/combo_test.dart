import 'package:ppyong_ppyong_blockpop/core/systems/combo_system.dart';
import 'package:test/test.dart';

void main() {
  group('콤보 (PRD §13 / §31.6)', () {
    test('QA-COMBO-001: 첫 줄 제거 → combo = 1', () {
      expect(ComboSystem.updateCombo(0, 1), 1);
    });

    test('QA-COMBO-002: 연속 줄 제거 → combo 증가', () {
      expect(ComboSystem.updateCombo(1, 1), 2);
      expect(ComboSystem.updateCombo(2, 2), 3);
    });

    test('QA-COMBO-003: 줄 제거 실패 → combo = 0', () {
      expect(ComboSystem.updateCombo(5, 0), 0);
    });
  });
}
