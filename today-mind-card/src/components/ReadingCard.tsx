import type { ReactNode } from 'react';

type Section = {
  label: string;
  text: string;
};

type Props = {
  hero?: ReactNode;
  sections: Section[];
};

// PRD §8.7 — 상세 결과 섹션 카드
export function ReadingCard({ hero, sections }: Props) {
  return (
    <div className="reading fade-in">
      {hero ? <div className="reading__hero">{hero}</div> : null}
      {sections.map((s) => (
        <div className="reading__section" key={s.label}>
          <p className="reading__label">{s.label}</p>
          <p className="reading__text">{s.text}</p>
        </div>
      ))}
    </div>
  );
}
