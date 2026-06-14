import 'package:flutter/material.dart';

import '../../core/models/piece.dart';

/// 블록 스킨 (PRD §17.1). 에셋 전까지 파스텔 색상으로 렌더링.
class BlockSkins {
  BlockSkins._();

  static const String jellyDefault = 'jelly_default';
  static const String cookie = 'cookie_block';
  static const String cloud = 'cloud_block';

  /// 기본 젤리 스킨 색상 (PRD §7.1 색상 계열 / §21.2 파스텔)
  static const Map<PieceType, Color> jellyColors = {
    PieceType.I: Color(0xFF7FD4F5), // 하늘
    PieceType.O: Color(0xFFFFD95A), // 노랑
    PieceType.T: Color(0xFFC59CF0), // 보라
    PieceType.S: Color(0xFF8FE39B), // 초록
    PieceType.Z: Color(0xFFFF8FA3), // 빨강(파스텔)
    PieceType.J: Color(0xFF8FB8FF), // 파랑
    PieceType.L: Color(0xFFFFB066), // 주황
  };

  static Color colorOf(PieceType t) => jellyColors[t] ?? Colors.grey;

  static const Map<String, String> displayName = {
    jellyDefault: '젤리 블록',
    cookie: '쿠키 블록',
    cloud: '구름 블록',
  };
}
