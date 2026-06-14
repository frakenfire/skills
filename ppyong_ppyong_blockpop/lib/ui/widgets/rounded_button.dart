import 'package:flutter/material.dart';

import '../feedback/app_feedback.dart';
import '../theme/app_colors.dart';

/// 캡슐형 둥근 버튼 (PRD §21.3)
class RoundedButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final Color color;
  final IconData? icon;
  final double height;
  final bool enabled;

  const RoundedButton({
    super.key,
    required this.label,
    required this.onTap,
    this.color = AppColors.yellow,
    this.icon,
    this.height = 56,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: Material(
        color: color,
        borderRadius: BorderRadius.circular(height / 2),
        elevation: 2,
        shadowColor: Colors.black26,
        child: InkWell(
          borderRadius: BorderRadius.circular(height / 2),
          onTap: enabled
              ? () {
                  AppFeedback.sfx(Sfx.button);
                  AppFeedback.lightTap();
                  onTap();
                }
              : null,
          child: Container(
            height: height,
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 22),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, color: Colors.white, size: 22),
                  const SizedBox(width: 8),
                ],
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
