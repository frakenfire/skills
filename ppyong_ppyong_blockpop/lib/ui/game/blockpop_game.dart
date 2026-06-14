import 'package:flame/game.dart';
import 'package:flutter/material.dart';

import '../../core/constants/fever_constants.dart';
import '../../core/constants/game_constants.dart';
import '../../core/game_engine.dart';
import '../../core/models/piece.dart';
import '../../core/states/game_state.dart';
import '../../core/systems/collision_system.dart';
import '../theme/app_colors.dart';
import '../theme/block_skins.dart';

/// Flame 게임 — [GameEngine] 의 상태를 렌더링하고 자동 낙하를 구동한다.
/// 입력(이동/회전/드롭)은 UI 버튼에서 메서드로 전달된다 (PRD §8).
class BlockpopGame extends FlameGame {
  final int? seed;
  final void Function(LockResult result) onLock;

  final GameEngine engine = GameEngine();

  // HUD 바인딩용 노티파이어
  final ValueNotifier<int> scoreVN = ValueNotifier(0);
  final ValueNotifier<int> comboVN = ValueNotifier(0);
  final ValueNotifier<int> levelVN = ValueNotifier(1);
  final ValueNotifier<double> feverVN = ValueNotifier(0); // 0..1
  final ValueNotifier<bool> isFeverVN = ValueNotifier(false);
  final ValueNotifier<PieceType?> nextVN = ValueNotifier(null);

  double _acc = 0;
  bool _paused = false;

  BlockpopGame({required this.onLock, this.seed});

  @override
  Color backgroundColor() => const Color(0x00000000);

  @override
  Future<void> onLoad() async {
    engine.init(seed: seed);
    _syncHud();
  }

  void setPaused(bool value) => _paused = value;
  bool get isGameOver => engine.state == GameState.gameOver;

  void _syncHud() {
    scoreVN.value = engine.score;
    comboVN.value = engine.combo;
    levelVN.value = engine.level;
    feverVN.value =
        (engine.feverGauge / FeverConstants.maxGauge).clamp(0.0, 1.0);
    isFeverVN.value = engine.isFever;
    nextVN.value = engine.nextType;
  }

  void _afterLock(LockResult r) {
    _syncHud();
    onLock(r);
  }

  // ---- 입력 (PRD §8.1) ----
  void moveLeft() => engine.move(-1);
  void moveRight() => engine.move(1);
  void rotate() => engine.rotate();

  void softDrop() {
    if (engine.softDrop()) _syncHud();
  }

  void hardDrop() {
    if (engine.state != GameState.falling) return;
    final r = engine.hardDrop();
    _acc = 0;
    _afterLock(r);
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (_paused || isGameOver) return;

    _acc += dt * 1000;
    final interval = engine.dropIntervalMs.toDouble();
    while (_acc >= interval && engine.state == GameState.falling) {
      _acc -= interval;
      final r = engine.tick();
      if (r != null) {
        _afterLock(r);
        if (r.gameOver) break;
      }
    }
  }

  // ---- 렌더링 (PRD §19.4) ----
  @override
  void render(Canvas canvas) {
    super.render(canvas);
    if (size.x <= 0 || size.y <= 0) return;

    final cell = size.x / GameConstants.boardWidth;

    // 보드 배경 (짙은 남색, PRD §21.2)
    final boardRect = Offset.zero & Size(size.x, size.y);
    canvas.drawRRect(
      RRect.fromRectAndRadius(boardRect, const Radius.circular(14)),
      Paint()..color = AppColors.boardNavy,
    );
    _drawGrid(canvas, cell);

    // 고정 블록
    for (int y = 0; y < GameConstants.boardHeight; y++) {
      for (int x = 0; x < GameConstants.boardWidth; x++) {
        final t = engine.board.grid[y][x];
        if (t != null) _drawCell(canvas, x, y, cell, BlockSkins.colorOf(t));
      }
    }

    // 고스트(낙하 예상 위치)
    for (final c in _ghostCells()) {
      _drawCell(canvas, c[0], c[1], cell, Colors.white.withValues(alpha: 0.16),
          highlight: false);
    }

    // 현재 블록 (y<0 셀은 렌더링 안 함, PRD §6.3)
    final color = BlockSkins.colorOf(engine.current.type);
    for (final c in engine.current.absoluteCells()) {
      if (c[1] < 0) continue;
      _drawCell(canvas, c[0], c[1], cell, color);
    }
  }

  void _drawGrid(Canvas canvas, double cell) {
    final paint = Paint()
      ..color = AppColors.boardGrid
      ..strokeWidth = 1;
    for (int x = 1; x < GameConstants.boardWidth; x++) {
      canvas.drawLine(
          Offset(x * cell, 0), Offset(x * cell, size.y), paint);
    }
    for (int y = 1; y < GameConstants.boardHeight; y++) {
      canvas.drawLine(
          Offset(0, y * cell), Offset(size.x, y * cell), paint);
    }
  }

  List<List<int>> _ghostCells() {
    if (isGameOver) return const [];
    int gy = engine.current.y;
    while (!CollisionSystem.collides(
        engine.board, engine.current.absoluteCells(atY: gy + 1))) {
      gy++;
    }
    return engine.current
        .absoluteCells(atY: gy)
        .where((c) => c[1] >= 0)
        .toList();
  }

  void _drawCell(Canvas canvas, int x, int y, double cell, Color color,
      {bool highlight = true}) {
    final rect = Rect.fromLTWH(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    final rr = RRect.fromRectAndRadius(rect, Radius.circular(cell * 0.22));
    canvas.drawRRect(rr, Paint()..color = color);
    if (highlight) {
      // 젤리 광택 하이라이트 (PRD §21.3)
      final hl = Rect.fromLTWH(
          x * cell + cell * 0.18, y * cell + cell * 0.14, cell * 0.64, cell * 0.2);
      canvas.drawRRect(
        RRect.fromRectAndRadius(hl, Radius.circular(cell * 0.1)),
        Paint()..color = Colors.white.withValues(alpha: 0.35),
      );
    }
  }

  @override
  void onRemove() {
    scoreVN.dispose();
    comboVN.dispose();
    levelVN.dispose();
    feverVN.dispose();
    isFeverVN.dispose();
    nextVN.dispose();
    super.onRemove();
  }
}
