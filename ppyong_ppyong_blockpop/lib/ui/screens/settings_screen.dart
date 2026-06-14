import 'package:flutter/material.dart';

import '../../app_state.dart';
import '../../domain/models/game_settings.dart';
import '../theme/app_colors.dart';

/// 설정 화면 (PRD §19.7)
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  GameSettings get _s => AppState.instance.data.settings;

  void _update(VoidCallback change) {
    setState(change);
    AppState.instance.persist();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        title: const Text('설정'),
        backgroundColor: AppColors.cream,
        foregroundColor: AppColors.textDark,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _switchTile('배경음(BGM)', _s.bgm,
              (v) => _update(() => _s.bgm = v)),
          _switchTile('효과음', _s.sfx, (v) => _update(() => _s.sfx = v)),
          _switchTile('진동', _s.vibration,
              (v) => _update(() => _s.vibration = v)),
          const Divider(),
          ListTile(
            title: const Text('조작 방식'),
            trailing: ToggleButtons(
              borderRadius: BorderRadius.circular(12),
              isSelected: [
                _s.controlMode == ControlMode.buttons,
                _s.controlMode == ControlMode.gestures,
              ],
              onPressed: (i) => _update(() => _s.controlMode =
                  i == 0 ? ControlMode.buttons : ControlMode.gestures),
              children: const [
                Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('버튼')),
                Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('제스처')),
              ],
            ),
          ),
          const ListTile(
            title: Text('언어'),
            trailing: Text('한국어'),
          ),
        ],
      ),
    );
  }

  Widget _switchTile(String label, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile(
      title: Text(label),
      value: value,
      activeThumbColor: AppColors.green,
      onChanged: onChanged,
    );
  }
}
