export const PROFILE_DISPLAY_NAME_MIN_LENGTH = 1;
export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 60;

export class ProfileDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileDomainError";
  }
}

export function normalizeProfileDisplayName(value: unknown): string {
  if (typeof value !== "string") {
    throw new ProfileDomainError("Enter a display name.");
  }

  const displayName = value.trim();

  if (displayName.length < PROFILE_DISPLAY_NAME_MIN_LENGTH) {
    throw new ProfileDomainError("Enter a display name.");
  }

  if (displayName.length > PROFILE_DISPLAY_NAME_MAX_LENGTH) {
    throw new ProfileDomainError(
      `Keep your display name to ${PROFILE_DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
    );
  }

  return displayName;
}
