"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useState, useTransition } from "react";

import { signOut } from "@/app/login/actions";
import { clearOfflineDocumentsForUser } from "@/lib/collaboration/offline-document";

interface SignOutButtonProps {
  beforeSignOut: () => Promise<void>;
  userId: string;
}

export function SignOutButton({
  beforeSignOut,
  userId,
}: SignOutButtonProps): React.ReactElement {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSignOut = (): void => {
    setError("");
    startTransition(async () => {
      try {
        await beforeSignOut();
        const cleanup = await clearOfflineDocumentsForUser(userId);

        if (cleanup.failed > 0) {
          setError("Offline notes could not be cleared. Retry sign out.");
          return;
        }

        await signOut();
      } catch {
        setError("Sign out could not finish safely. Retry sign out.");
      }
    });
  };

  return (
    <div className="sign-out-control">
      <button
        type="button"
        className="icon-button"
        aria-label={isPending ? "Signing out" : "Sign out"}
        aria-busy={isPending}
        disabled={isPending}
        onClick={handleSignOut}
      >
        {isPending ? (
          <LoaderCircle className="spin" aria-hidden="true" size={17} />
        ) : (
          <LogOut aria-hidden="true" size={17} />
        )}
      </button>
      {error ? (
        <span className="sign-out-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
