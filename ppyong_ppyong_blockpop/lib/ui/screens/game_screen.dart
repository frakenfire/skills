import 'package:flame/game.dart';
import 'package:flutter/material.dart';

import '../../app_state.dart';
import '../../core/game_engine.dart';
import '../../core/models/piece.dart';
import '../../domain/models/game_result.dart';
import '../data/character_meta.dart';
import '../feedback/app_feedback.dart';
import '../game/blockpop_game.dart';
import '../theme/app_colors.dart';
import '../theme/background_skins.dart';
import '../widgets/character_reaction_overlay.dart';
import '../widgets/control_buttons.dart';
import '../widgets/fever_gauge.dart';
import '../widgets/next_piece_panel.dart';
import '../widgets/score_panel.dart';
import 'result_screen.dart';

/// 게임 플레이 화면 (PRD §19.4)
class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late final BlockpopGame _game;
  final SessionStats _stats = SessionStats();
  ReactionEvent? _reaction;
  int _reactionCounter = 0;
  bool _paused = false;
  bool _ending = false;

  int get _best => AppState.instance.data.player.bestScore;

  @override
  void initState() {
    super.initState();
    _game = BlockpopGame(onLock: _onLock);
  }

  void _onLock(LockResult r) {
    // 세션 통계/도감 진행 (PRD §16.2)
    if (r.removedLines == 2) _stats.twoLineClears++;
    if (r.removedLines == 4) _stats.fourLineClears++;
    if (r.combo >= 2) _stats.combo2Events++;
    if (r.combo >= 3) _stats.combo3Events++;
    if (r.enteredFever) _stats.feverEnters++;

    // 사운드 (PRD §11.3, §22.2)
    if (r.enteredFever) AppFeedback.sfx(Sfx.feverStart);
    switch (r.removedLines) {
      case 1:
        AppFeedback.sfx(Sfx.clear1);
        break;
      case 2:
        AppFeedback.sfx(Sfx.clear2);
        break;
      case 3:
        AppFeedback.sfx(Sfx.clear3);
        break;
      case 4:
        AppFeedback.sfx(Sfx.clear4);
        AppFeedback.medium();
        break;
      default:
        AppFeedback.sfx(Sfx.lock);
    }

    // 캐릭터 리액션 (PRD §15)
    if (r.character != null) {
      _stats.addAppearance(CharacterMeta.of(r.character!).id);
      setState(() {
        _reaction = ReactionEvent(r.character!, ++_reactionCounter);
      });
    }

    if (r.gameOver) _handleGameOver();
  }

  Future<void> _handleGameOver() async {
    if (_ending) return;
    _ending = true;
    AppFeedback.sfx(Sfx.gameOver);
    final result = await AppState.instance.applyGameResult(
      score: _game.engine.score,
      level: _game.engine.level,
      totalLinesCleared: _game.engine.totalLinesCleared,
      maxCombo: _game.engine.maxCombo,
      stats: _stats,
    );
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => ResultScreen(result: result)),
    );
  }

  void _setPaused(bool value) {
    setState(() => _paused = value);
    _game.setPaused(value);
  }

  @override
  Widget build(BuildContext context) {
    final bg = BackgroundSkins.gradientOf(
        AppState.instance.data.skins.selectedBackground);
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: bg,
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              Column(
                children: [
                  _topBar(),
                  Expanded(child: _boardArea()),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
                    child: ControlButtons(
                      onLeft: _game.moveLeft,
                      onRight: _game.moveRight,
                      onRotate: _game.rotate,
                      onSoftDrop: _game.softDrop,
                      onHardDrop: _game.hardDrop,
                    ),
                  ),
                ],
              ),
              if (_paused) _pauseOverlay(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _topBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              children: [
                ValueListenableBuilder<int>(
                  valueListenable: _game.scoreVN,
                  builder: (_, score, __) => ValueListenableBuilder<int>(
                    valueListenable: _game.comboVN,
                    builder: (_, combo, __) => ScorePanel(
                        score: score, best: _best, combo: combo),
                  ),
                ),
                const SizedBox(height: 8),
                ValueListenableBuilder<double>(
                  valueListenable: _game.feverVN,
                  builder: (_, fever, __) => ValueListenableBuilder<bool>(
                    valueListenable: _game.isFeverVN,
                    builder: (_, isFever, __) =>
                        FeverGauge(value: fever, isFever: isFever),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            children: [
              ValueListenableBuilder<PieceType?>(
                valueListenable: _game.nextVN,
                builder: (_, next, __) => NextPiecePanel(next: next),
              ),
              const SizedBox(height: 6),
              _pauseButton(),
            ],
          ),
        ],
      ),
    );
  }

  Widget _pauseButton() {
    return Material(
      color: Colors.white.withValues(alpha: 0.85),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () => _setPaused(true),
        child: const SizedBox(
          width: 44,
          height: 44,
          child: Icon(Icons.pause, color: AppColors.textDark),
        ),
      ),
    );
  }

  Widget _boardArea() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: AspectRatio(
          aspectRatio: 10 / 20,
          child: Stack(
            children: [
              GameWidget(game: _game),
              Positioned.fill(
                child: CharacterReactionOverlay(event: _reaction),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _pauseOverlay() {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Container(
          width: 280,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.cream,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('잠깐!',
                  style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark)),
              const SizedBox(height: 20),
              _menuButton('계속하기', AppColors.green, () => _setPaused(false)),
              _menuButton('다시하기', AppColors.yellow, _restart),
              _menuButton('홈으로', AppColors.pink,
                  () => Navigator.of(context).popUntil((r) => r.isFirst)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _menuButton(String label, Color color, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: SizedBox(
        width: double.infinity,
        child: Material(
          color: color,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              AppFeedback.sfx(Sfx.button);
              onTap();
            },
            child: Container(
              height: 50,
              alignment: Alignment.center,
              child: Text(label,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800)),
            ),
          ),
        ),
      ),
    );
  }

  void _restart() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const GameScreen()),
    );
  }
}
