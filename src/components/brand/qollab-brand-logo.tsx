interface QollabBrandLogoProps {
  priority?: boolean;
}

export function QollabBrandLogo({
  priority = true,
}: QollabBrandLogoProps): React.ReactElement {
  void priority;

  return (
    <span className="brand-logo">
      <span aria-hidden="true" className="brand-logo__image" />
      <span className="sr-only">Qollab</span>
    </span>
  );
}
