import 'package:flutter/material.dart';

import '../../app_state.dart';
import '../data/character_meta.dart';
import '../theme/app_colors.dart';

/// 도감 화면 (PRD §16, §19.9)
class CollectionScreen extends StatelessWidget {
  const CollectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final collection = AppState.instance.data.collection;
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        title: const Text('도감'),
        backgroundColor: AppColors.cream,
        foregroundColor: AppColors.textDark,
        elevation: 0,
      ),
      body: GridView.count(
        crossAxisCount: 2,
        padding: const EdgeInsets.all(16),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.82,
        children: CharacterMeta.all.map((meta) {
          final entry = collection.entry(meta.id);
          final unlocked = entry.unlocked;
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(unlocked ? meta.emoji : '❔',
                    style: const TextStyle(fontSize: 48)),
                const SizedBox(height: 6),
                Text(unlocked ? meta.koreanName : '???',
                    style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        color: AppColors.textDark)),
                const SizedBox(height: 2),
                Text(
                  unlocked ? meta.speech : meta.unlockCondition,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSoft),
                ),
                const SizedBox(height: 4),
                Text('등장 ${entry.appearCount}회',
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.feverPink)),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
