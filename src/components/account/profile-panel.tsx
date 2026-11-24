"use client";

import { ButtonControl } from "@/components/ui/button";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Field } from "@astryxdesign/core/Field";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useActionState, useState } from "react";

import { INITIAL_PROFILE_ACTION_STATE } from "@/app/profile/action-state";
import { updateProfileAction } from "@/app/profile/actions";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import {
  PANEL_ACCENT,
  PANEL_HEADING,
  PANEL_MUTED,
  PANEL_ROW,
} from "@/components/ui/panel";
import { useSuccessToast } from "@/components/ui/toast";
import {
  normalizeProfileDisplayName,
  PROFILE_DISPLAY_NAME_MAX_LENGTH,
  ProfileDomainError,
} from "@/lib/profiles/model";

interface ProfilePanelProps {
  displayName: string;
  email: string | null;
}

export function ProfilePanel({
  displayName,
  email,
}: ProfilePanelProps): React.ReactElement {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    INITIAL_PROFILE_ACTION_STATE,
  );
  useSuccessToast(state);
  const [draftName, setDraftName] = useState(displayName);
  const [fieldError, setFieldError] = useState("");
  const previewName = draftName.trim() || displayName;
  const initial = previewName.charAt(0).toUpperCase() || "Q";

  const validateDisplayName = (): boolean => {
    try {
      normalizeProfileDisplayName(draftName);
      setFieldError("");
      return true;
    } catch (error) {
      setFieldError(
        error instanceof ProfileDomainError
          ? error.message
          : "Enter a valid display name.",
      );
      return false;
    }
  };

  return (
    <>
      <VStack
        as="section"
        gap={4}
        className={PANEL_MUTED}
        aria-labelledby="profile-summary-title"
      >
        <Heading level={2} id="profile-summary-title" className={PANEL_HEADING}>
          How you appear in rooms
        </Heading>
        <HStack gap={4} vAlign="center" className={PANEL_ROW}>
          <Avatar name={initial} size="lg" tooltip={false} aria-hidden="true" />
          <VStack gap={1} className="min-w-0 flex-1">
            <Text weight="semibold" className="wrap-anywhere text-lg!">
              {previewName}
            </Text>
            <Text color="secondary" className="wrap-anywhere">
              {email ?? "Email unavailable"}
            </Text>
          </VStack>
        </HStack>
      </VStack>

      <VStack
        as="section"
        gap={4}
        className={PANEL_MUTED}
        aria-labelledby="display-name-title"
      >
        <Heading level={2} id="display-name-title" className={PANEL_HEADING}>
          Your name in rooms
        </Heading>
        <form
          action={action}
          onSubmit={(event) => {
            if (!validateDisplayName()) {
              event.preventDefault();
            }
          }}
        >
          <FormLayout className="gap-4">
            <Field inputID="profile-display-name" label="Display name">
              <input
                className="min-h-10 w-full min-w-0 rounded-full border border-border-strong bg-surface px-4 text-primary text-lg"
                aria-describedby={`profile-display-name-help${fieldError ? " profile-display-name-error" : ""}`}
                aria-invalid={fieldError ? true : undefined}
                autoComplete="name"
                id="profile-display-name"
                maxLength={PROFILE_DISPLAY_NAME_MAX_LENGTH}
                name="displayName"
                onBlur={validateDisplayName}
                onChange={(event) => {
                  setDraftName(event.target.value);
                  if (fieldError) setFieldError("");
                }}
                required
                type="text"
                value={draftName}
              />
            </Field>
            <HStack gap={4} vAlign="start" hAlign="between">
              <Text
                color="secondary"
                id="profile-display-name-help"
                className="min-w-0 flex-1"
              >
                This name appears beside your notes, cursors, questions, and
                room membership.
              </Text>
              <Text color="secondary" aria-hidden="true" className="shrink-0">
                {draftName.trim().length}/{PROFILE_DISPLAY_NAME_MAX_LENGTH}
              </Text>
            </HStack>
            {fieldError ? (
              <Text
                className="text-error"
                id="profile-display-name-error"
                role="alert"
              >
                {fieldError}
              </Text>
            ) : null}

            {state.status === "error" && state.message ? (
              <Text className="bg-error-muted p-3 rounded-md" role="alert">
                {state.message}
              </Text>
            ) : null}

            <ButtonControl
              variant="primary"
              className="self-start"
              aria-busy={pending}
              disabled={pending}
              type="submit"
            >
              {pending ? <LoadingIndicator size="icon" /> : null}
              {pending ? "Saving profile…" : "Save profile"}
            </ButtonControl>
          </FormLayout>
        </form>
      </VStack>

      <VStack
        as="aside"
        gap={2}
        className={PANEL_ACCENT}
        aria-label="Profile privacy note"
      >
        <Heading level={2} className={PANEL_HEADING}>
          What collaborators can see
        </Heading>
        <Text color="secondary">
          People who share a room with you can see your display name. Your
          sign-in email stays private.
        </Text>
      </VStack>
    </>
  );
}
