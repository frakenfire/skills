import 'package:flutter/material.dart';

import '../../app_state.dart';
import '../theme/app_colors.dart';
import '../widgets/rounded_button.dart';
import 'collection_screen.dart';
import 'game_screen.dart';
import 'settings_screen.dart';
import 'shop_screen.dart';

/// 메인 화면 (PRD §19.3)
class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppState.instance;
    return Scaffold(
      backgroundColor: AppColors.skyBg,
      body: SafeArea(
        child: ValueListenableBuilder<int>(
          valueListenable: app.revision,
          builder: (context, _, __) {
            final p = app.data.player;
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _currencyBar(p.totalCoins, p.totalGems),
                  const Spacer(),
                  const Text('뿅뿅',
                      style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.w900,
                          color: AppColors.feverPink)),
                  const Text('블록팝',
                      style: TextStyle(
                          fontSize: 44,
                          fontWeight: FontWeight.w900,
                          color: AppColors.blue)),
                  const SizedBox(height: 12),
                  const Text('🐑 🐼 🐰 🐶 🦫',
                      style: TextStyle(fontSize: 36)),
                  const Spacer(),
                  RoundedButton(
                    label: '시작하기',
                    color: AppColors.green,
                    height: 64,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const GameScreen()),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _iconButton(context, '도감', Icons.menu_book,
                          const CollectionScreen()),
                      _iconButton(context, '상점', Icons.store,
                          const ShopScreen()),
                      _iconButton(context, '설정', Icons.settings,
                          const SettingsScreen()),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _currencyBar(int coins, int gems) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        _chip('🪙', '$coins', AppColors.coin),
        const SizedBox(width: 8),
        _chip('💎', '$gems', AppColors.gem),
      ],
    );
  }

  Widget _chip(String icon, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 4),
          Text(value,
              style: TextStyle(
                  fontWeight: FontWeight.w800, color: color)),
        ],
      ),
    );
  }

  Widget _iconButton(
      BuildContext context, String label, IconData icon, Widget screen) {
    return Column(
      children: [
        Material(
          color: Colors.white,
          shape: const CircleBorder(),
          elevation: 2,
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => screen)),
            child: SizedBox(
              width: 58,
              height: 58,
              child: Icon(icon, color: AppColors.textDark, size: 28),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(label,
            style: const TextStyle(
                fontWeight: FontWeight.w700, color: AppColors.textDark)),
      ],
    );
  }
}
