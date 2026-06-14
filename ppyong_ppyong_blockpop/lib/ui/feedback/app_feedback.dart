import 'package:flutter/services.dart';

import '../../app_state.dart';

/// 효과음 종류 (PRD §22.2)
enum Sfx {
  button,
  move,
  rotate,
  lock,
  clear1,
  clear2,
  clear3,
  clear4,
  combo,
  feverStart,
  feverEnd,
  gameOver,
}

/// 사운드 + 햅틱 피드백 (PRD §8.5, §22, §29).
///
/// 설정(OFF) 을 존중한다. 실제 오디오 재생은 추후 audioplayers + 에셋으로 연결한다.
class AppFeedback {
  AppFeedback._();

  static bool get _sfxOn => AppState.instance.data.settings.sfx;
  static bool get _vibOn => AppState.instance.data.settings.vibration;

  static void sfx(Sfx sound) {
    if (!_sfxOn) return;
    // TODO(audio): assets/audio/${sound.name}.wav 재생 (PRD §22.2)
  }

  static void lightTap() {
    if (_vibOn) HapticFeedback.lightImpact();
  }

  static void medium() {
    if (_vibOn) HapticFeedback.mediumImpact();
  }
}
