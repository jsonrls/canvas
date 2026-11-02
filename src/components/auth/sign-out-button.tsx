"use client";

import { ButtonControl } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { LogOut } from "@/components/ui/icons";
import { useState, useTransition } from "react";

import { signOut } from "@/app/login/actions";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
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
    <VStack
      gap={2}
      hAlign={isMenuItem ? "stretch" : "start"}
      className={`sign-out-control${isLabeled ? " sign-out-control--labeled" : ""}${isMenuItem ? " sign-out-control--menu" : ""}${isDanger ? " sign-out-control--danger" : ""}`}
    >
      {isDanger ? (
        <Button
          label={isPending ? pendingLabel : label}
          variant="destructive"
          className="min-h-11 bg-error! text-on-error!"
          aria-busy={isPending}
          isLoading={isPending}
          isDisabled={isPending}
          onClick={handleSignOut}
        />
      ) : (
        <ButtonControl
          variant="danger-ghost"
          type="button"
          className={
            isMenuItem
              ? "sidebar-account-menu__item sidebar-account-menu__item--danger"
              : "icon-button"
          }
          aria-label={isPending ? pendingLabel : label}
          aria-busy={isPending}
          disabled={isPending}
          onClick={handleSignOut}
          role={isMenuItem ? "menuitem" : undefined}
        >
          {isPending ? (
            <LoadingIndicator size="icon" />
          ) : (
            <LogOut aria-hidden="true" size={17} />
          )}
          {isLabeled ? (
            <Text type="inherit">{isPending ? pendingLabel : label}</Text>
          ) : null}
        </ButtonControl>
      )}
      {error ? (
        <Text
          className={isDanger ? "text-error wrap-anywhere" : "sign-out-error"}
          role="alert"
        >
          {error}
        </Text>
      ) : null}
    </VStack>
  );
}
