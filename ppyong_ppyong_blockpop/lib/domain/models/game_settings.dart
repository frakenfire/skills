/// 조작 방식 (PRD §8, §19.7)
enum ControlMode { buttons, gestures }

/// 설정 데이터 (PRD §19.7, §23.1)
class GameSettings {
  bool bgm;
  bool sfx;
  bool vibration;
  ControlMode controlMode;

  GameSettings({
    this.bgm = true,
    this.sfx = true,
    this.vibration = true,
    this.controlMode = ControlMode.buttons,
  });

  Map<String, dynamic> toJson() => {
        'bgm': bgm,
        'sfx': sfx,
        'vibration': vibration,
        'controlMode': controlMode.name,
      };

  factory GameSettings.fromJson(Map<String, dynamic> j) => GameSettings(
        bgm: j['bgm'] as bool? ?? true,
        sfx: j['sfx'] as bool? ?? true,
        vibration: j['vibration'] as bool? ?? true,
        controlMode: ControlMode.values.firstWhere(
          (m) => m.name == j['controlMode'],
          orElse: () => ControlMode.buttons,
        ),
      );
}
