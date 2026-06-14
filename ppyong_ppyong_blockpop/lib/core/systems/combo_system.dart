/// 콤보 시스템 (PRD §13)
class ComboSystem {
  ComboSystem._();

  /// 줄 제거 결과로 콤보를 갱신한다 (PRD §25.11).
  /// 줄 제거 발생 시 +1, 없으면 0으로 초기화.
  static int updateCombo(int combo, int removedLines) {
    return removedLines > 0 ? combo + 1 : 0;
  }
}
