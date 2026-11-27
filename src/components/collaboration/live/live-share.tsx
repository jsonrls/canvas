"use client";

import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Code } from "@astryxdesign/core/Code";
import { VStack } from "@astryxdesign/core/Layout";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { useMemo, useSyncExternalStore } from "react";
import { encode } from "uqr";

import type { LiveActivitiesState } from "@/components/collaboration/live/use-live-activities";
import { Button } from "@/components/ui/button";
import { Copy } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";

/** The page's own origin, so preview deploys share preview links. */
function useOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

/** Dark modules on a light square in both themes: scanners expect that. */
function QrImage({ text }: { text: string }): React.ReactElement {
  const { data, size } = useMemo(() => encode(text, { ecc: "M" }), [text]);
  const path = data
    .flatMap((row, y) =>
      row.flatMap((isDark, x) => (isDark ? [`M${x} ${y}h1v1h-1z`] : [])),
    )
    .join("");
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="QR code for the guest link"
      shapeRendering="crispEdges"
      className="aspect-square w-full max-w-72 rounded-lg bg-on-dark p-3"
    >
      <path d={path} className="fill-on-light" />
    </svg>
  );
}

export function LiveShareDialog({
  guestCode,
  isBusy,
  isOpen,
  onAct,
  onOpenChange,
}: {
  guestCode: string | null;
  isBusy: boolean;
  isOpen: boolean;
  onAct: LiveActivitiesState["act"];
  onOpenChange(open: boolean): void;
}): React.ReactElement {
  const origin = useOrigin();
  const { success } = useToast();
  const link = guestCode ? `${origin}/live/${guestCode}` : null;

  const copy = async (): Promise<void> => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      success("Guest link copied.");
    } catch {
      // The link stays on screen to copy by hand.
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="form"
      width={440}
      maxHeight="90dvh"
    >
      <DialogHeader title="Invite guests" onOpenChange={onOpenChange} />
      <VStack gap={4} padding={6} hAlign="stretch">
        <Switch
          label="Anyone with the link can answer"
          description="Guests type a name and answer without an account. Turning this off stops the link; turning it on again makes a new one."
          value={guestCode !== null}
          isLoading={isBusy}
          onChange={(value) =>
            void onAct({ action: "set_guest_access", value })
          }
        />
        {link ? (
          <VStack gap={3} hAlign="center">
            <QrImage text={link} />
            <Code className="break-all text-center">{link}</Code>
            <Button
              label="Copy link"
              variant="secondary"
              icon={<Copy aria-hidden="true" size={16} />}
              onClick={() => void copy()}
            />
            <Text type="supporting" className="text-center">
              Guests see the presented question and can answer, ask and vote.
              They can’t see your notes, files or other rooms.
            </Text>
          </VStack>
        ) : null}
      </VStack>
    </Dialog>
  );
}
