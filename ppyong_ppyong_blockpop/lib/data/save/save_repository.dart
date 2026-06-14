import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../domain/models/save_data.dart';

/// 로컬 저장소 (PRD §23.1, §26.3 Storage).
///
/// 저장 키는 ppyong/blockpop 계열을 사용한다 (PRD §31.1 QA-NAME-004).
/// 저장 실패 시 예외를 삼켜 게임이 크래시하지 않도록 한다 (PRD §32.2-5).
class SaveRepository {
  static const String _key = 'ppyong_blockpop_save_v1';

  Future<SaveData> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null || raw.isEmpty) return SaveData();
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return SaveData.fromJson(map);
    } catch (_) {
      return SaveData();
    }
  }

  Future<bool> save(SaveData data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.setString(_key, jsonEncode(data.toJson()));
    } catch (_) {
      return false;
    }
  }
}
