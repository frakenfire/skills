type Section = {
  label: string;
  text: string;
};

type Props = {
  emoji?: string;
  sections: Section[];
};

// PRD §8.7 — 상세 결과 섹션 카드
export function ReadingCard({ emoji, sections }: Props) {
  return (
    <div className="reading fade-in">
      {emoji ? (
        <div className="reading__hero-emoji" aria-hidden>
          {emoji}
        </div>
      ) : null}
      {sections.map((s) => (
        <div className="reading__section" key={s.label}>
          <p className="reading__label">{s.label}</p>
          <p className="reading__text">{s.text}</p>
        </div>
      ))}
    </div>
  );
}
