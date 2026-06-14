import 'dart:math';

import 'constants/game_constants.dart';
import 'models/board.dart';
import 'models/piece.dart';
import 'states/game_state.dart';
import 'systems/bag_randomizer.dart';
import 'systems/character_reaction_system.dart';
import 'systems/collision_system.dart';
import 'systems/combo_system.dart';
import 'systems/fever_system.dart';
import 'systems/line_clear_system.dart';
import 'systems/rotation_system.dart';
import 'systems/scoring_system.dart';

/// 한 번의 블록 고정(lock) 결과 요약 — UI 연출/사운드/캐릭터 트리거에 사용.
class LockResult {
  final int removedLines;
  final int scoreGain;
  final int combo;
  final bool enteredFever;
  final ReactionCharacter? character;
  final bool gameOver;

  const LockResult({
    required this.removedLines,
    required this.scoreGain,
    required this.combo,
    required this.enteredFever,
    required this.character,
    required this.gameOver,
  });
}

/// 헤드리스 게임 코어 오케스트레이터 (PRD §5.1, §25).
///
/// 순수 게임 로직만 담당하며 렌더링/입력/사운드에 의존하지 않는다.
/// Flutter + Flame UI 레이어는 이 엔진의 상태를 읽어 그리고, 입력을 메서드로 전달한다.
class GameEngine {
  late Board board;
  late BagRandomizer _bag;
  late Piece current;
  late PieceType nextType;

  int score = 0;
  int totalLinesCleared = 0;
  int combo = 0;
  int maxCombo = 0;
  int feverGauge = 0;
  bool isFever = false;
  int feverPiecesLeft = 0;
  GameState state = GameState.init;

  int _hardDropBonus = 0;
  int _softDropBonus = 0;

  int get level => GameConstants.levelForLines(totalLinesCleared);
  int get dropIntervalMs => GameConstants.dropIntervalMs(level);

  /// 게임 초기화 (PRD §25.1). [seed] 로 결정적 테스트 가능.
  void init({int? seed}) {
    board = Board.empty();
    _bag = BagRandomizer(seed: seed);
    score = 0;
    totalLinesCleared = 0;
    combo = 0;
    maxCombo = 0;
    feverGauge = 0;
    isFever = false;
    feverPiecesLeft = 0;
    _hardDropBonus = 0;
    _softDropBonus = 0;
    nextType = _bag.next();
    _spawn();
  }

  /// 새 블록 생성 (PRD §25.2). 생성 직후 충돌이면 게임 오버.
  void _spawn() {
    final type = nextType;
    nextType = _bag.next();
    current = Piece.spawn(type);
    _hardDropBonus = 0;
    _softDropBonus = 0;
    if (CollisionSystem.collides(board, current.absoluteCells())) {
      state = GameState.gameOver;
    } else {
      state = GameState.falling;
    }
  }

  /// 좌우 이동 (PRD §25.3). 성공하면 true.
  bool move(int dx) {
    if (state != GameState.falling && state != GameState.lockDelay) return false;
    final abs = current.absoluteCells(atX: current.x + dx);
    if (CollisionSystem.collides(board, abs)) return false;
    current = current.copyWith(x: current.x + dx);
    return true;
  }

  /// 시계방향 회전 (PRD §25.4). 성공하면 true.
  bool rotate() {
    if (state != GameState.falling && state != GameState.lockDelay) return false;
    final r = RotationSystem.rotate(board, current);
    if (r == null) return false;
    current = r;
    return true;
  }

  bool canMoveDown() {
    return !CollisionSystem.collides(
      board,
      current.absoluteCells(atY: current.y + 1),
    );
  }

  /// 소프트 드롭 (PRD §25.5). 한 칸 내려가면 true.
  bool softDrop() {
    if (!canMoveDown()) return false;
    current = current.copyWith(y: current.y + 1);
    _softDropBonus += 1;
    return true;
  }

  /// 하드 드롭 (PRD §25.6, §10.5). 충돌 직전까지 내린 뒤 즉시 고정.
  LockResult hardDrop() {
    int dist = 0;
    while (canMoveDown()) {
      current = current.copyWith(y: current.y + 1);
      dist += 1;
    }
    _hardDropBonus = dist * 2;
    return _lock();
  }

  /// 자동 낙하 1틱 (PRD §10.1). 내려갈 수 있으면 내리고 null,
  /// 바닥이면 고정 후 LockResult 반환.
  LockResult? tick() {
    if (state != GameState.falling) return null;
    if (canMoveDown()) {
      current = current.copyWith(y: current.y + 1);
      return null;
    }
    return _lock();
  }

  /// 블록 고정 처리 (PRD §25.7, §11.2).
  LockResult _lock() {
    state = GameState.lineClear;

    // 1) 보드에 기록 (y>=0 만). y<0 셀이 남으면 게임 오버 (PRD §7.7).
    bool overflow = false;
    for (final c in current.absoluteCells()) {
      final x = c[0];
      final y = c[1];
      if (y < 0) {
        overflow = true;
        continue;
      }
      board.grid[y][x] = current.type;
    }

    // 2) 줄 제거
    final lines = LineClearSystem.findCompletedLines(board);
    final removed = lines.length;
    if (removed > 0) {
      board = LineClearSystem.clearLines(board, lines);
      totalLinesCleared += removed;
    }

    // 3) 콤보
    combo = ComboSystem.updateCombo(combo, removed);
    maxCombo = max(maxCombo, combo);

    // 4) 피버 게이지/진입
    final fr = FeverSystem.update(
      feverGauge: feverGauge,
      isFever: isFever,
      feverPiecesLeft: feverPiecesLeft,
      removedLines: removed,
      combo: combo,
    );
    final enteredFever = fr.justEntered;
    feverGauge = fr.feverGauge;
    isFever = fr.isFever;
    feverPiecesLeft = fr.feverPiecesLeft;

    // 5) 점수 (현재 피버 상태 기준 배율 적용)
    final gain = ScoringSystem.calculateScore(
      removedLines: removed,
      combo: combo,
      level: level,
      hardDropBonus: _hardDropBonus,
      softDropBonus: _softDropBonus,
      isFever: isFever,
    );
    score += gain;

    // 6) 피버 지속: 이번에 고정된 블록 1개 소비 (진입 턴은 소비하지 않음).
    if (isFever && !enteredFever) {
      final lk = FeverSystem.onPieceLocked(
        isFever: isFever,
        feverPiecesLeft: feverPiecesLeft,
        feverGauge: feverGauge,
      );
      isFever = lk.isFever;
      feverPiecesLeft = lk.feverPiecesLeft;
    }

    // 7) 캐릭터 결정
    final character = CharacterReactionSystem.select(
      removedLines: removed,
      combo: combo,
      enteredFever: enteredFever,
    );

    // 8) 게임 오버 판정 또는 다음 블록 생성
    if (overflow) {
      state = GameState.gameOver;
    } else {
      _spawn();
    }

    return LockResult(
      removedLines: removed,
      scoreGain: gain,
      combo: combo,
      enteredFever: enteredFever,
      character: character,
      gameOver: state == GameState.gameOver,
    );
  }
}
