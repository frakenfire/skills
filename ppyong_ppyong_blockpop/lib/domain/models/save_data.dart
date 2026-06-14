import 'collection_data.dart';
import 'game_settings.dart';
import 'player_data.dart';
import 'skin_data.dart';

/// 로컬 저장 루트 (PRD §23.1)
class SaveData {
  final int version;
  final PlayerData player;
  final GameSettings settings;
  final SkinData skins;
  final CollectionData collection;

  SaveData({
    this.version = 1,
    PlayerData? player,
    GameSettings? settings,
    SkinData? skins,
    CollectionData? collection,
  })  : player = player ?? PlayerData(),
        settings = settings ?? GameSettings(),
        skins = skins ?? SkinData(),
        collection = collection ?? CollectionData.initial();

  Map<String, dynamic> toJson() => {
        'version': version,
        'player': player.toJson(),
        'settings': settings.toJson(),
        'skins': skins.toJson(),
        'collection': collection.toJson(),
      };

  factory SaveData.fromJson(Map<String, dynamic> j) => SaveData(
        version: j['version'] as int? ?? 1,
        player: j['player'] != null
            ? PlayerData.fromJson(j['player'] as Map<String, dynamic>)
            : PlayerData(),
        settings: j['settings'] != null
            ? GameSettings.fromJson(j['settings'] as Map<String, dynamic>)
            : GameSettings(),
        skins: j['skins'] != null
            ? SkinData.fromJson(j['skins'] as Map<String, dynamic>)
            : SkinData(),
        collection: j['collection'] != null
            ? CollectionData.fromJson(j['collection'] as Map<String, dynamic>)
            : CollectionData.initial(),
      );
}
