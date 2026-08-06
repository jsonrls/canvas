import Image from "next/image";

interface QollabBrandLogoProps {
  priority?: boolean;
}

export function QollabBrandLogo({
  priority = true,
}: QollabBrandLogoProps): React.ReactElement {
  return (
    <span className="brand-logo">
      <Image
        alt=""
        aria-hidden="true"
        className="brand-logo__image"
        height={49}
        priority={priority}
        sizes="160px"
        src="/brand/qollab-logo-lockup.png"
        width={160}
      />
      <span className="sr-only">Qollab</span>
    </span>
  );
}
