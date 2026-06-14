import '../../core/systems/character_reaction_system.dart';

/// 캐릭터 UI 메타데이터 (PRD §15.1, §16, 아트 가이드 이미지).
/// 에셋 전까지 [emoji] 로 캐릭터를 대체 표현한다.
class CharacterMeta {
  final String id;
  final String koreanName;
  final String speech;
  final String emoji;
  final String unlockCondition;
  final String intro;

  const CharacterMeta({
    required this.id,
    required this.koreanName,
    required this.speech,
    required this.emoji,
    required this.unlockCondition,
    required this.intro,
  });

  static const Map<ReactionCharacter, CharacterMeta> _map = {
    ReactionCharacter.sheep: CharacterMeta(
      id: 'sheep',
      koreanName: '양',
      speech: '메에뿅~',
      emoji: '🐑',
      unlockCondition: '기본 해금',
      intro: '말랑하고 순한 양',
    ),
    ReactionCharacter.panda: CharacterMeta(
      id: 'panda',
      koreanName: '팬더',
      speech: '뿅!',
      emoji: '🐼',
      unlockCondition: '2줄 제거 5회',
      intro: '느긋하고 귀여운 팬더',
    ),
    ReactionCharacter.rabbit: CharacterMeta(
      id: 'rabbit',
      koreanName: '토끼',
      speech: '폴짝뿅!',
      emoji: '🐰',
      unlockCondition: '콤보 2 이상 5회',
      intro: '발랄한 토끼',
    ),
    ReactionCharacter.dog: CharacterMeta(
      id: 'dog',
      koreanName: '강아지',
      speech: '멍뿅뿅!',
      emoji: '🐶',
      unlockCondition: '콤보 3 이상 3회',
      intro: '신난 강아지',
    ),
    ReactionCharacter.capybara: CharacterMeta(
      id: 'capybara',
      koreanName: '카피바라',
      speech: '풍~...',
      emoji: '🦫',
      unlockCondition: '4줄 제거 1회 또는 피버 1회',
      intro: '느긋한 최고 보상, 카피바라',
    ),
  };

  static CharacterMeta of(ReactionCharacter c) => _map[c]!;
  static List<CharacterMeta> get all =>
      ReactionCharacter.values.map((c) => _map[c]!).toList();
  static CharacterMeta byId(String id) =>
      _map.values.firstWhere((m) => m.id == id);
}
