"use client";

import { AppIcon, KeyRound } from "@/components/ui/icons";
import { Eye as EyeData, EyeOff as EyeOffData } from "lucide";
import { useActionState, useState } from "react";

import { updatePassword } from "@/app/reset-password/actions";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { Field } from "@astryxdesign/core/Field";
import { ButtonControl } from "@/components/ui/button";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { useSuccessToast } from "@/components/ui/toast";
import {
  INITIAL_PASSWORD_RESET_STATE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth/password-reset";

export function UpdatePasswordForm(): React.ReactElement {
  const [state, action, pending] = useActionState(
    updatePassword,
    INITIAL_PASSWORD_RESET_STATE,
  );
  useSuccessToast(state);
  const [showPasswords, setShowPasswords] = useState(false);
  const inputType = showPasswords ? "text" : "password";

  return (
    <form action={action}>
      <FormLayout className="gap-5">
        <Field inputID="new-password" label="New password" isLabelHidden>
          <HStack gap={0} vAlign="center" className="relative w-full">
            <input
              className="min-h-10 w-full min-w-0 rounded-full border border-border-strong bg-surface px-4 pr-12! text-primary text-lg"
              id="new-password"
              name="password"
              type={inputType}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              aria-describedby="new-password-help"
              placeholder="New password"
              required
            />
            <ButtonControl
              variant="custom"
              className="absolute inset-y-0 right-1 flex min-w-10 cursor-pointer items-center justify-center rounded-full text-secondary! hover:text-primary! aria-pressed:text-accent!"
              aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              aria-controls="new-password new-password-confirmation"
              aria-pressed={showPasswords}
              onClick={() => setShowPasswords((visible) => !visible)}
            >
              <AppIcon
                iconData={showPasswords ? EyeOffData : EyeData}
                aria-hidden="true"
                size={18}
              />
            </ButtonControl>
          </HStack>
        </Field>
        <Text as="p" color="secondary" id="new-password-help">
          Use {PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH} characters and choose
          a password you do not use elsewhere.
        </Text>

        <Field
          inputID="new-password-confirmation"
          label="Confirm new password"
          isLabelHidden
        >
          <input
            className="min-h-10 w-full min-w-0 rounded-full border border-border-strong bg-surface px-4 text-primary text-lg"
            id="new-password-confirmation"
            name="passwordConfirmation"
            type={inputType}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            placeholder="Confirm new password"
            required
          />
        </Field>

        {state.status === "error" && state.message ? (
          <Text
            as="p"
            role="alert"
            className="text-primary! bg-error-muted p-3 rounded-2xl"
          >
            {state.message}
          </Text>
        ) : null}

        <AuthSubmit isDisabled={pending}>
          <KeyRound aria-hidden="true" size={17} />
          {pending ? "Securing your account…" : "Set new password"}
        </AuthSubmit>
      </FormLayout>
    </form>
  );
}
