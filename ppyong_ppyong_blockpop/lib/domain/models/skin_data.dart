import '../../ui/theme/background_skins.dart';
import '../../ui/theme/block_skins.dart';

/// 스킨 보유/선택 데이터 (PRD §17, §23.1 skins)
class SkinData {
  String selectedBlockSkin;
  String selectedBackground;
  List<String> ownedBlockSkins;
  List<String> ownedBackgrounds;

  SkinData({
    String? selectedBlockSkin,
    String? selectedBackground,
    List<String>? ownedBlockSkins,
    List<String>? ownedBackgrounds,
  })  : selectedBlockSkin = selectedBlockSkin ?? BlockSkins.jellyDefault,
        selectedBackground = selectedBackground ?? BackgroundSkins.forest,
        ownedBlockSkins = ownedBlockSkins ?? [BlockSkins.jellyDefault],
        ownedBackgrounds = ownedBackgrounds ?? [BackgroundSkins.forest];

  bool ownsBlock(String id) => ownedBlockSkins.contains(id);
  bool ownsBackground(String id) => ownedBackgrounds.contains(id);

  Map<String, dynamic> toJson() => {
        'selectedBlockSkin': selectedBlockSkin,
        'selectedBackground': selectedBackground,
        'ownedBlockSkins': ownedBlockSkins,
        'ownedBackgrounds': ownedBackgrounds,
      };

  factory SkinData.fromJson(Map<String, dynamic> j) => SkinData(
        selectedBlockSkin: j['selectedBlockSkin'] as String?,
        selectedBackground: j['selectedBackground'] as String?,
        ownedBlockSkins:
            (j['ownedBlockSkins'] as List?)?.map((e) => e as String).toList(),
        ownedBackgrounds:
            (j['ownedBackgrounds'] as List?)?.map((e) => e as String).toList(),
      );
}
