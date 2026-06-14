import 'package:ppyong_ppyong_blockpop/core/systems/character_reaction_system.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('캐릭터 리액션 (PRD §15 / §31.8)', () {
    test('QA-CHAR-001: 1줄 제거 → 양', () {
      expect(
        CharacterReactionSystem.select(
            removedLines: 1, combo: 1, enteredFever: false),
        ReactionCharacter.sheep,
      );
    });

    test('QA-CHAR-002: 2줄 제거 → 팬더', () {
      expect(
        CharacterReactionSystem.select(
            removedLines: 2, combo: 1, enteredFever: false),
        ReactionCharacter.panda,
      );
    });

    test('QA-CHAR-003: 콤보 2 → 토끼', () {
      expect(
        CharacterReactionSystem.select(
            removedLines: 1, combo: 2, enteredFever: false),
        ReactionCharacter.rabbit,
      );
    });

    test('QA-CHAR-004: 콤보 3 → 강아지', () {
      expect(
        CharacterReactionSystem.select(
            removedLines: 1, combo: 3, enteredFever: false),
        ReactionCharacter.dog,
      );
    });

    test('QA-CHAR-005: 4줄 제거 → 카피바라', () {
      expect(
        CharacterReactionSystem.select(
            removedLines: 4, combo: 1, enteredFever: false),
        ReactionCharacter.capybara,
      );
    });

    test('QA-CHAR-006: 피버 진입 → 카피바라', () {
      expect(
        CharacterReactionSystem.select(
            removedLines: 1, combo: 1, enteredFever: true),
        ReactionCharacter.capybara,
      );
    });

    test('QA-CHAR-007: 2줄 + 콤보3 → 강아지 (콤보 우선)', () {
      expect(
        CharacterReactionSystem.select(
            removedLines: 2, combo: 3, enteredFever: false),
        ReactionCharacter.dog,
      );
    });

    test('QA-CHAR-008: 4줄 + 콤보3 → 카피바라 (4줄 우선)', () {
      expect(
        CharacterReactionSystem.select(
            removedLines: 4, combo: 3, enteredFever: false),
        ReactionCharacter.capybara,
      );
    });

    test('줄 제거 없음 → 없음', () {
      expect(
        CharacterReactionSystem.select(
            removedLines: 0, combo: 0, enteredFever: false),
        isNull,
      );
    });

    test('말풍선 문구 (PRD §20.2)', () {
      expect(ReactionCharacter.sheep.speech, '메에뿅~');
      expect(ReactionCharacter.capybara.speech, '풍~...');
    });
  });
}
