interface QollabBrandLogoProps {
  priority?: boolean;
  variant?: "lockup" | "mark";
  /** "sm" is the lockup at a smaller size, for a compact bar. */
  size?: "md" | "sm";
}

export function QollabBrandLogo({
  priority = true,
  variant = "lockup",
  size = "md",
}: QollabBrandLogoProps): React.ReactElement {
  void priority;

  return (
    <span className="brand-logo" data-variant={variant} data-size={size}>
      <span aria-hidden="true" className="brand-logo__image" />
      <span className="sr-only">Qollab</span>
    </span>
  );
}
