"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useState, useTransition } from "react";

import { signOut } from "@/app/login/actions";
import { clearOfflineDocumentsForUser } from "@/lib/collaboration/offline-document";

interface SignOutButtonProps {
  beforeSignOut?: () => Promise<void>;
  label?: string;
  showLabel?: boolean;
  userId: string;
  variant?: "danger" | "default" | "menu";
}

export function SignOutButton({
  beforeSignOut,
  label = "Sign out",
  showLabel = false,
  userId,
  variant = "default",
}: SignOutButtonProps): React.ReactElement {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const isDanger = variant === "danger";
  const isMenuItem = variant === "menu";
  const isLabeled = showLabel || isDanger || isMenuItem;
  const pendingLabel = isDanger || isMenuItem ? "Logging out…" : "Signing out…";

  const handleSignOut = (): void => {
    setError("");
    startTransition(async () => {
      try {
        await beforeSignOut?.();
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
    <div
      className={`sign-out-control${isLabeled ? " sign-out-control--labeled" : ""}${isMenuItem ? " sign-out-control--menu" : ""}${isDanger ? " sign-out-control--danger" : ""}`}
    >
      <button
        type="button"
        className={
          isMenuItem
            ? "sidebar-account-menu__item sidebar-account-menu__item--danger"
            : isDanger
              ? "account-danger-button"
              : "icon-button"
        }
        aria-label={isPending ? pendingLabel : label}
        aria-busy={isPending}
        disabled={isPending}
        onClick={handleSignOut}
        role={isMenuItem ? "menuitem" : undefined}
      >
        {isPending ? (
          <LoaderCircle className="spin" aria-hidden="true" size={17} />
        ) : (
          <LogOut aria-hidden="true" size={17} />
        )}
        {isLabeled ? <span>{isPending ? pendingLabel : label}</span> : null}
      </button>
      {error ? (
        <span className="sign-out-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
