import 'package:flutter/material.dart';

/// 배경 스킨 (PRD §17.2). 에셋 전까지 그라데이션으로 대체.
class BackgroundSkins {
  BackgroundSkins._();

  static const String forest = 'forest_playground';
  static const String canal = 'canal_village';
  static const String dessert = 'dessert_shop';
  static const String nap = 'nap_park';

  static const Map<String, String> displayName = {
    forest: '숲속 놀이터',
    canal: '운하 마을',
    dessert: '디저트 가게',
    nap: '낮잠 공원',
  };

  static List<Color> gradientOf(String id) {
    switch (id) {
      case canal:
        return const [Color(0xFFBFE9FF), Color(0xFF8FD0E8)];
      case dessert:
        return const [Color(0xFFFFD9EC), Color(0xFFFFC2DD)];
      case nap:
        return const [Color(0xFFE7F5D8), Color(0xFFCDE8C0)];
      case forest:
      default:
        return const [Color(0xFFD7F0DA), Color(0xFFB8E6BE)];
    }
  }
}
