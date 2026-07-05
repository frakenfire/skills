type Props = {
  label: string;
  selected?: boolean;
  onClick: () => void;
};

// PRD §6.4 — 선택 상태는 SIGNATURE GREEN (choice--selected)
export function ChoiceButton({ label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      className={selected ? 'choice choice--selected' : 'choice'}
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
