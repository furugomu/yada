interface Props {
  onClick: () => void;
}

export function YadaButton({ onClick }: Props) {
  return (
    <button className="yada-button" onClick={onClick} type="button">
      やだ！
    </button>
  );
}
