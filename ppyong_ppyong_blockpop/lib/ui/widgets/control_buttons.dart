import 'package:flutter/material.dart';

import '../feedback/app_feedback.dart';
import '../theme/app_colors.dart';

/// 하단 조작 버튼 5개 (PRD §8.1, 아트 가이드 하단 UI)
class ControlButtons extends StatelessWidget {
  final VoidCallback onLeft;
  final VoidCallback onRight;
  final VoidCallback onRotate;
  final VoidCallback onSoftDrop;
  final VoidCallback onHardDrop;

  const ControlButtons({
    super.key,
    required this.onLeft,
    required this.onRight,
    required this.onRotate,
    required this.onSoftDrop,
    required this.onHardDrop,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _CtrlButton(
            icon: Icons.chevron_left, color: AppColors.yellow, onTap: onLeft),
        _CtrlButton(
            icon: Icons.chevron_right, color: AppColors.yellow, onTap: onRight),
        _CtrlButton(
            icon: Icons.refresh, color: AppColors.pink, onTap: onRotate),
        _CtrlButton(
            icon: Icons.keyboard_arrow_down,
            color: AppColors.blue,
            onTap: onSoftDrop),
        _CtrlButton(
            icon: Icons.keyboard_double_arrow_down,
            color: AppColors.green,
            onTap: onHardDrop),
      ],
    );
  }
}

class _CtrlButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _CtrlButton(
      {required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      shape: const CircleBorder(),
      elevation: 3,
      shadowColor: Colors.black26,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () {
          AppFeedback.lightTap();
          onTap();
        },
        child: SizedBox(
          width: 62,
          height: 62,
          child: Icon(icon, color: Colors.white, size: 34),
        ),
      ),
    );
  }
}
