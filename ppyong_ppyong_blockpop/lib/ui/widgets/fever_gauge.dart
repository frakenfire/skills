import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// FEVER 게이지 (PRD §14, §19.4)
class FeverGauge extends StatelessWidget {
  final double value; // 0..1
  final bool isFever;

  const FeverGauge({super.key, required this.value, required this.isFever});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 22,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(11),
      ),
      child: Stack(
        children: [
          FractionallySizedBox(
            widthFactor: isFever ? 1.0 : value.clamp(0.0, 1.0),
            child: Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.feverGold, AppColors.feverPink],
                ),
                borderRadius: BorderRadius.circular(11),
              ),
            ),
          ),
          Center(
            child: Text(
              isFever ? '피버 타임!' : 'FEVER',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
