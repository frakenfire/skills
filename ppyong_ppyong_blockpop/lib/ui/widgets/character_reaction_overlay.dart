import 'package:flutter/material.dart';

import '../../core/systems/character_reaction_system.dart';
import '../data/character_meta.dart';
import '../theme/app_colors.dart';

/// 캐릭터 리액션 1회 이벤트. [id] 가 바뀔 때마다 새 리액션으로 간주한다.
class ReactionEvent {
  final ReactionCharacter character;
  final int id;
  const ReactionEvent(this.character, this.id);
}

/// 캐릭터 등장 오버레이 (PRD §15.6 등장→리액션→대기→퇴장, 총 1.5초).
/// 에셋 전까지 이모지 + 말풍선으로 표현한다.
class CharacterReactionOverlay extends StatefulWidget {
  final ReactionEvent? event;
  const CharacterReactionOverlay({super.key, required this.event});

  @override
  State<CharacterReactionOverlay> createState() =>
      _CharacterReactionOverlayState();
}

class _CharacterReactionOverlayState extends State<CharacterReactionOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1500),
  );
  ReactionEvent? _current;

  @override
  void didUpdateWidget(CharacterReactionOverlay old) {
    super.didUpdateWidget(old);
    final e = widget.event;
    if (e != null && e.id != _current?.id) {
      _current = e;
      _c.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final e = _current;
    if (e == null) return const SizedBox.shrink();
    final meta = CharacterMeta.of(e.character);

    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) {
          final t = _c.value;
          if (t == 0 || t >= 1) return const SizedBox.shrink();
          // 등장 0~0.17, 대기, 퇴장 0.83~1.0 (PRD §15.6)
          final opacity = t < 0.15
              ? t / 0.15
              : (t > 0.85 ? (1 - t) / 0.15 : 1.0);
          final scale = t < 0.2 ? 0.7 + (1.1 - 0.7) * (t / 0.2) : 1.0;
          return Center(
            child: Opacity(
              opacity: opacity.clamp(0.0, 1.0),
              child: Transform.scale(
                scale: scale,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _speechBubble(meta.speech),
                    const SizedBox(height: 4),
                    Text(meta.emoji, style: const TextStyle(fontSize: 72)),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _speechBubble(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.pink, width: 2),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w900,
          color: AppColors.feverPink,
        ),
      ),
    );
  }
}
