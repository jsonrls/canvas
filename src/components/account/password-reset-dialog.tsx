"use client";

import { Dialog } from "@astryxdesign/core/Dialog";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useId, useState } from "react";

import { requestPasswordReset } from "@/app/reset-password/actions";
import { Button } from "@/components/ui/button";
import { Mail } from "@/components/ui/icons";
import {
  INITIAL_PASSWORD_RESET_STATE,
  type PasswordResetActionState,
} from "@/lib/auth/password-reset";

const FAILED: PasswordResetActionState = {
  message: "The link could not be sent. Check your connection and try again.",
  status: "error",
};

/** Emails the signed-in person a link to choose a new password. */
export function PasswordResetDialog({
  email,
  isOpen,
  onClose,
}: {
  email: string;
  isOpen: boolean;
  onClose(): void;
}): React.ReactElement {
  const [state, setState] = useState(INITIAL_PASSWORD_RESET_STATE);
  const [isSending, setIsSending] = useState(false);
  const titleId = useId();
  const textId = useId();
  const isSent = state.status === "success";

  const send = async (): Promise<void> => {
    if (isSending) return;
    const form = new FormData();
    form.set("email", email);
    setIsSending(true);
    try {
      setState(await requestPasswordReset(INITIAL_PASSWORD_RESET_STATE, form));
    } catch {
      setState(FAILED);
    } finally {
      setIsSending(false);
    }
  };

  const close = (): void => {
    if (isSending) return;
    onClose();
    setState(INITIAL_PASSWORD_RESET_STATE);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      purpose="form"
      width={440}
      aria-labelledby={titleId}
      aria-describedby={textId}
    >
      <VStack gap={4} padding={4}>
        <Heading level={2} id={titleId}>
          {isSent ? "Check your email" : "Reset your password"}
        </Heading>
        <VStack gap={2} id={textId} role="status">
          <Text as="p" color="secondary" className="wrap-anywhere">
            {isSent ? "We sent a link to " : "We’ll email a link to "}
            <Text as="span" weight="semibold">
              {email}
            </Text>
            {isSent
              ? ". Open it in this browser to choose a new password. If it isn’t there in a few minutes, check your spam folder."
              : ". It opens a page where you choose a new password, and works for a limited time."}
          </Text>
          <Text as="p" color="secondary">
            After you save the new password, you sign in again with it.
          </Text>
        </VStack>
        {state.status === "error" ? (
          <Text
            as="p"
            role="alert"
            className="rounded-2xl bg-error-muted p-3 text-primary!"
          >
            {state.message}
          </Text>
        ) : null}
        <HStack gap={2} hAlign="end" wrap="wrap">
          {isSent ? (
            <>
              <Button
                label="Send again"
                variant="ghost"
                isLoading={isSending}
                onClick={() => void send()}
              />
              <Button label="Done" variant="primary" onClick={close} />
            </>
          ) : (
            <>
              <Button label="Cancel" variant="ghost" onClick={close} />
              <Button
                label="Send reset link"
                variant="primary"
                icon={<Mail aria-hidden="true" size={16} />}
                isLoading={isSending}
                onClick={() => void send()}
              />
            </>
          )}
        </HStack>
      </VStack>
    </Dialog>
  );
}
