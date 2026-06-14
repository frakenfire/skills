import 'package:flutter/material.dart';

import '../../core/constants/game_constants.dart';
import '../../core/models/piece.dart';
import '../theme/app_colors.dart';
import '../theme/block_skins.dart';

/// NEXT 블록 미리보기 (PRD §7.2, §19.4)
class NextPiecePanel extends StatelessWidget {
  final PieceType? next;

  const NextPiecePanel({super.key, required this.next});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: AppColors.boardNavy.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('NEXT',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          SizedBox(
            height: 48,
            width: 60,
            child: next == null
                ? const SizedBox.shrink()
                : CustomPaint(painter: _NextPainter(next!)),
          ),
        ],
      ),
    );
  }
}

class _NextPainter extends CustomPainter {
  final PieceType type;
  _NextPainter(this.type);

  @override
  void paint(Canvas canvas, Size size) {
    final cells = GameConstants.pieceCells[type]!;
    final xs = cells.map((c) => c[0]);
    final ys = cells.map((c) => c[1]);
    final minX = xs.reduce((a, b) => a < b ? a : b);
    final maxX = xs.reduce((a, b) => a > b ? a : b);
    final minY = ys.reduce((a, b) => a < b ? a : b);
    final maxY = ys.reduce((a, b) => a > b ? a : b);
    final w = (maxX - minX + 1);
    final h = (maxY - minY + 1);
    final cell = (size.width / w).clamp(0.0, size.height / h);
    final ox = (size.width - cell * w) / 2;
    final oy = (size.height - cell * h) / 2;
    final color = BlockSkins.colorOf(type);

    for (final c in cells) {
      final rect = Rect.fromLTWH(
        ox + (c[0] - minX) * cell + 1,
        oy + (c[1] - minY) * cell + 1,
        cell - 2,
        cell - 2,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, Radius.circular(cell * 0.22)),
        Paint()..color = color,
      );
    }
  }

  @override
  bool shouldRepaint(_NextPainter old) => old.type != type;
}
