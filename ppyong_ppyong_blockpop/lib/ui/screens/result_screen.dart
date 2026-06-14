import 'package:flutter/material.dart';

import '../../app_state.dart';
import '../../domain/models/game_result.dart';
import '../theme/app_colors.dart';
import '../widgets/rounded_button.dart';
import 'game_screen.dart';

/// 결과 화면 (PRD §19.6)
class ResultScreen extends StatefulWidget {
  final GameResult result;
  const ResultScreen({super.key, required this.result});

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  bool _doubled = false;

  @override
  Widget build(BuildContext context) {
    final r = widget.result;
    return Scaffold(
      backgroundColor: AppColors.cream,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  r.isNewBest ? '최고 기록 달성!' : '게임 오버',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    color: r.isNewBest ? AppColors.feverPink : AppColors.textDark,
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    children: [
                      _bigScore(r.score),
                      const Divider(height: 24),
                      _row('최고 기록', '${r.bestScore}'),
                      _row('제거 줄 수', '${r.totalLinesCleared}'),
                      _row('최대 콤보', '${r.maxCombo}'),
                      _row('레벨', '${r.level}'),
                      _row('획득 코인',
                          '${_doubled ? r.earnedCoins * 2 : r.earnedCoins}'),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                if (!_doubled)
                  RoundedButton(
                    label: '광고 보고 코인 2배',
                    icon: Icons.play_circle_fill,
                    color: AppColors.blue,
                    onTap: _doubleCoins,
                  ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    RoundedButton(
                      label: '다시하기',
                      color: AppColors.green,
                      onTap: () => Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const GameScreen()),
                      ),
                    ),
                    const SizedBox(width: 12),
                    RoundedButton(
                      label: '홈으로',
                      color: AppColors.pink,
                      onTap: () =>
                          Navigator.of(context).popUntil((r) => r.isFirst),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _doubleCoins() async {
    // 광고 Mock (PRD §18.4): 결과 코인 2배, 판당 1회
    await AppState.instance.doubleCoins(widget.result.earnedCoins);
    if (mounted) setState(() => _doubled = true);
  }

  Widget _bigScore(int score) {
    return Column(
      children: [
        const Text('SCORE',
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textSoft)),
        Text('$score',
            style: const TextStyle(
                fontSize: 44,
                fontWeight: FontWeight.w900,
                color: AppColors.textDark)),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 15, color: AppColors.textSoft)),
          Text(value,
              style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textDark)),
        ],
      ),
    );
  }
}
