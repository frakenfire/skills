import 'dart:math';

import 'package:flutter/foundation.dart';

import 'core/systems/economy_system.dart';
import 'data/save/save_repository.dart';
import 'domain/models/game_result.dart';
import 'domain/models/save_data.dart';

/// 앱 전역 상태 (저장 데이터 + 진행도 반영).
///
/// 단순 싱글턴 + ValueNotifier. UI는 [AppState.instance] 로 접근한다.
class AppState {
  AppState._();
  static final AppState instance = AppState._();

  final SaveRepository _repo = SaveRepository();
  late SaveData data;

  /// 코인/도감 등 변경을 화면에 알리는 노티파이어.
  final ValueNotifier<int> revision = ValueNotifier<int>(0);

  Future<void> init() async {
    data = await _repo.load();
  }

  Future<void> persist() async {
    await _repo.save(data);
    revision.value++;
  }

  /// 도감 해금 임계값 (PRD §16.2)
  static const Map<String, int> _unlockThreshold = {
    'panda': 5,
    'rabbit': 5,
    'dog': 3,
    'capybara': 1,
  };

  /// 한 판 종료 시 결과를 저장 데이터에 반영하고 GameResult 를 반환한다.
  Future<GameResult> applyGameResult({
    required int score,
    required int level,
    required int totalLinesCleared,
    required int maxCombo,
    required SessionStats stats,
  }) async {
    final p = data.player;
    final coins = EconomySystem.earnedCoins(
      score: score,
      totalLinesCleared: totalLinesCleared,
      maxCombo: maxCombo,
    );

    final isNewBest = score > p.bestScore;
    if (isNewBest) p.bestScore = score;
    p.totalCoins += coins;
    p.totalLinesCleared += totalLinesCleared;
    p.maxComboAllTime = max(p.maxComboAllTime, maxCombo);
    p.playedCount += 1;
    p.feverCount += stats.feverEnters;
    p.fourLineClearCount += stats.fourLineClears;

    // 도감 진행/해금 (PRD §16.2)
    _progress('panda', stats.twoLineClears);
    _progress('rabbit', stats.combo2Events);
    _progress('dog', stats.combo3Events);
    _progress('capybara', stats.fourLineClears + stats.feverEnters);
    stats.appearCounts.forEach((id, n) {
      data.collection.entry(id).appearCount += n;
    });

    await persist();

    return GameResult(
      score: score,
      level: level,
      totalLinesCleared: totalLinesCleared,
      maxCombo: maxCombo,
      earnedCoins: coins,
      isNewBest: isNewBest,
      bestScore: p.bestScore,
    );
  }

  void _progress(String id, int delta) {
    if (delta <= 0) return;
    final e = data.collection.entry(id);
    e.conditionProgress += delta;
    final threshold = _unlockThreshold[id];
    if (threshold != null && e.conditionProgress >= threshold) {
      e.unlocked = true;
    }
  }

  /// 결과 화면 광고 코인 2배 (PRD §18.4 Mock).
  Future<void> doubleCoins(int earned) async {
    data.player.totalCoins += earned;
    await persist();
  }
}
