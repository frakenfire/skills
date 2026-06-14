/// 캐릭터 도감 1종 진행 (PRD §16.4)
class CollectionEntry {
  bool unlocked;
  int appearCount;
  int conditionProgress;

  CollectionEntry({
    this.unlocked = false,
    this.appearCount = 0,
    this.conditionProgress = 0,
  });

  Map<String, dynamic> toJson() => {
        'unlocked': unlocked,
        'appearCount': appearCount,
        'conditionProgress': conditionProgress,
      };

  factory CollectionEntry.fromJson(Map<String, dynamic> j) => CollectionEntry(
        unlocked: j['unlocked'] as bool? ?? false,
        appearCount: j['appearCount'] as int? ?? 0,
        conditionProgress: j['conditionProgress'] as int? ?? 0,
      );
}

/// 도감 전체 (PRD §16, §23.1 collection)
class CollectionData {
  final Map<String, CollectionEntry> entries;

  CollectionData(this.entries);

  factory CollectionData.initial() => CollectionData({
        'sheep': CollectionEntry(unlocked: true),
        'panda': CollectionEntry(),
        'rabbit': CollectionEntry(),
        'dog': CollectionEntry(),
        'capybara': CollectionEntry(),
      });

  CollectionEntry entry(String id) =>
      entries[id] ??= CollectionEntry();

  Map<String, dynamic> toJson() =>
      entries.map((k, v) => MapEntry(k, v.toJson()));

  factory CollectionData.fromJson(Map<String, dynamic> j) {
    final base = CollectionData.initial();
    j.forEach((k, v) {
      base.entries[k] = CollectionEntry.fromJson(v as Map<String, dynamic>);
    });
    return base;
  }
}
