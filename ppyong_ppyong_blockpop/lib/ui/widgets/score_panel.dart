import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// SCORE / BEST / COMBO 표시 (PRD §19.4, 아트 가이드 HUD)
class ScorePanel extends StatelessWidget {
  final int score;
  final int best;
  final int combo;

  const ScorePanel({
    super.key,
    required this.score,
    required this.best,
    required this.combo,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _stat('SCORE', '$score', AppColors.textDark),
          _stat('BEST', '$best', AppColors.textSoft),
          _stat('COMBO', '$combo', AppColors.feverPink),
        ],
      ),
    );
  }

  Widget _stat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: color.withValues(alpha: 0.7))),
        Text(value,
            style: TextStyle(
                fontSize: 20, fontWeight: FontWeight.w900, color: color)),
      ],
    );
  }
}
