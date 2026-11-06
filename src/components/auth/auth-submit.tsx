import { ButtonControl } from "@/components/ui/button";

interface AuthSubmitProps {
  children: React.ReactNode;
  isDisabled: boolean;
}

/** The pill submit action on auth forms. Callers change the label while busy. */
export function AuthSubmit({
  children,
  isDisabled,
}: AuthSubmitProps): React.ReactElement {
  return (
    <ButtonControl
      type="submit"
      variant="custom"
      disabled={isDisabled}
      aria-busy={isDisabled}
      className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 landing-cta rounded-full px-5 font-medium text-surface! disabled:cursor-progress disabled:opacity-70"
    >
      {children}
    </ButtonControl>
  );
}
