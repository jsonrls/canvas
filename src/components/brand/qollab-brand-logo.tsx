interface QollabBrandLogoProps {
  priority?: boolean;
  variant?: "lockup" | "mark";
}

export function QollabBrandLogo({
  priority = true,
  variant = "lockup",
}: QollabBrandLogoProps): React.ReactElement {
  void priority;

  return (
    <span className="brand-logo" data-variant={variant}>
      <span aria-hidden="true" className="brand-logo__image" />
      <span className="sr-only">Qollab</span>
    </span>
  );
}
