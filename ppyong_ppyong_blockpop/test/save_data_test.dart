import 'package:flutter_test/flutter_test.dart';
import 'package:ppyong_ppyong_blockpop/domain/models/game_settings.dart';
import 'package:ppyong_ppyong_blockpop/domain/models/save_data.dart';

void main() {
  group('저장 데이터 직렬화 (PRD §23.1 / §31.9)', () {
    test('SaveData JSON 왕복 후 값 유지', () {
      final data = SaveData();
      data.player.bestScore = 12450;
      data.player.totalCoins = 35;
      data.settings.bgm = false;
      data.settings.controlMode = ControlMode.gestures;
      data.skins.ownedBlockSkins.add('cookie_block');
      data.skins.selectedBackground = 'canal_village';
      data.collection.entry('panda').unlocked = true;
      data.collection.entry('panda').appearCount = 3;

      final restored = SaveData.fromJson(data.toJson());

      expect(restored.player.bestScore, 12450);
      expect(restored.player.totalCoins, 35);
      expect(restored.settings.bgm, false);
      expect(restored.settings.controlMode, ControlMode.gestures);
      expect(restored.skins.ownsBlock('cookie_block'), true);
      expect(restored.skins.selectedBackground, 'canal_village');
      expect(restored.collection.entry('panda').unlocked, true);
      expect(restored.collection.entry('panda').appearCount, 3);
    });

    test('기본값: 젤리 스킨/숲속 배경/양만 해금', () {
      final d = SaveData();
      expect(d.skins.selectedBlockSkin, 'jelly_default');
      expect(d.skins.selectedBackground, 'forest_playground');
      expect(d.collection.entry('sheep').unlocked, true);
      expect(d.collection.entry('panda').unlocked, false);
    });
  });
}
