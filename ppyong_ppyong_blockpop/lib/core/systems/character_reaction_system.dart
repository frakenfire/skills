/// 리액션 캐릭터 (PRD §15.1)
enum ReactionCharacter { sheep, panda, rabbit, dog, capybara }

extension ReactionCharacterInfo on ReactionCharacter {
  /// 캐릭터 말풍선 문구 (PRD §15.1, §20.2)
  String get speech {
    switch (this) {
      case ReactionCharacter.sheep:
        return '메에뿅~';
      case ReactionCharacter.panda:
        return '뿅!';
      case ReactionCharacter.rabbit:
        return '폴짝뿅!';
      case ReactionCharacter.dog:
        return '멍뿅뿅!';
      case ReactionCharacter.capybara:
        return '풍~...';
    }
  }
}

/// 캐릭터 리액션 결정 (PRD §15.3, §15.4)
class CharacterReactionSystem {
  CharacterReactionSystem._();

  /// 한 줄 제거 이벤트에 대해 등장할 캐릭터를 우선순위에 따라 결정한다.
  ///
  /// 우선순위 (PRD §15.4):
  /// 피버 진입 > 4줄 > 콤보3+ > 콤보2+ > 2줄 > 1줄 > 없음.
  static ReactionCharacter? select({
    required int removedLines,
    required int combo,
    required bool enteredFever,
  }) {
    if (enteredFever) return ReactionCharacter.capybara;
    if (removedLines == 4) return ReactionCharacter.capybara;
    if (combo >= 3) return ReactionCharacter.dog;
    if (combo >= 2) return ReactionCharacter.rabbit;
    if (removedLines == 2) return ReactionCharacter.panda;
    if (removedLines == 1) return ReactionCharacter.sheep;
    return null;
  }
}
