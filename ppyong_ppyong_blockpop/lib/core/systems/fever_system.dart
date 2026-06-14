import '../constants/fever_constants.dart';

/// 피버 갱신 결과 스냅샷.
class FeverResult {
  final int feverGauge;
  final bool isFever;
  final int feverPiecesLeft;

  /// 이번 이벤트로 피버에 "막 진입"했는지 (카피바라 등장/연출 트리거용).
  final bool justEntered;

  const FeverResult({
    required this.feverGauge,
    required this.isFever,
    required this.feverPiecesLeft,
    required this.justEntered,
  });
}

/// 피버 시스템 (PRD §14)
class FeverSystem {
  FeverSystem._();

  /// 줄 제거 이벤트로 게이지/진입을 갱신한다 (PRD §14.2~§14.4, §25.12).
  ///
  /// - removedLines == 0 이면 변화 없음.
  /// - feverGain = removedLines*25 + combo*5
  /// - 게이지 100 도달 또는 4줄 제거 시 진입(게이지 0, 잔여 8개).
  static FeverResult update({
    required int feverGauge,
    required bool isFever,
    required int feverPiecesLeft,
    required int removedLines,
    required int combo,
  }) {
    if (removedLines == 0) {
      return FeverResult(
        feverGauge: feverGauge,
        isFever: isFever,
        feverPiecesLeft: feverPiecesLeft,
        justEntered: false,
      );
    }

    final gain = removedLines * FeverConstants.gainPerLine +
        combo * FeverConstants.gainPerCombo;
    final entered =
        (feverGauge + gain >= FeverConstants.maxGauge) || removedLines == 4;

    if (entered) {
      return const FeverResult(
        feverGauge: 0,
        isFever: true,
        feverPiecesLeft: FeverConstants.feverPieces,
        justEntered: true,
      );
    }

    return FeverResult(
      feverGauge: feverGauge + gain,
      isFever: isFever,
      feverPiecesLeft: feverPiecesLeft,
      justEntered: false,
    );
  }

  /// 피버 중 블록 1개가 고정될 때 호출 (PRD §14.5).
  /// 잔여 블록 수를 1 감소시키고, 0 이하가 되면 피버를 종료한다.
  static FeverResult onPieceLocked({
    required bool isFever,
    required int feverPiecesLeft,
    required int feverGauge,
  }) {
    if (!isFever) {
      return FeverResult(
        feverGauge: feverGauge,
        isFever: false,
        feverPiecesLeft: feverPiecesLeft,
        justEntered: false,
      );
    }
    final left = feverPiecesLeft - 1;
    return FeverResult(
      feverGauge: feverGauge,
      isFever: left > 0,
      feverPiecesLeft: left < 0 ? 0 : left,
      justEntered: false,
    );
  }
}
