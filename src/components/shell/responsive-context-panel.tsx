"use client";

import {
  BottomSheet,
  type BottomSheetProps,
} from "@astryxdesign/core/BottomSheet";
import { Dialog, type DialogProps } from "@astryxdesign/core/Dialog";
import { LayoutPanel } from "@astryxdesign/core/Layout";
import { VStack } from "@astryxdesign/core/VStack";
import { useFocusTrap, useMediaQuery } from "@astryxdesign/core/hooks";
import type { ReactElement, ReactNode } from "react";

export const QOLLAB_CONTEXT_PANEL_WIDTH = 360;
export const QOLLAB_CONTEXT_DIALOG_WIDTH = 400;

const TABLET_CONTEXT_QUERY = "(max-width: 1024px)";
const NARROW_CONTEXT_QUERY = "(max-width: 767px)";

export type ResponsiveContextPanelPresentation =
  "desktop" | "tablet" | "narrow";

export interface ResponsiveContextPanelProps {
  children: ReactNode;
  fillContent?: boolean;
  isOpen: boolean;
  label: string;
  onOpenChange: (isOpen: boolean) => void;
  presentation?: ResponsiveContextPanelPresentation;
  purpose?: NonNullable<DialogProps["purpose"] & BottomSheetProps["purpose"]>;
}

export function ResponsiveContextPanel({
  children,
  fillContent = false,
  isOpen,
  label,
  onOpenChange,
  presentation,
  purpose = "info",
}: ResponsiveContextPanelProps): ReactElement | null {
  const isTablet = useMediaQuery(TABLET_CONTEXT_QUERY);
  const isNarrow = useMediaQuery(NARROW_CONTEXT_QUERY);
  const resolvedPresentation =
    presentation ?? (isNarrow ? "narrow" : isTablet ? "tablet" : "desktop");
  // Native dialog traversal can pass through browser chrome at the boundary.
  // Keep mobile sheet Tab wrapping on its controls; BottomSheet owns Escape.
  const { containerRef } = useFocusTrap<HTMLDivElement>({
    isActive: isOpen && resolvedPresentation === "narrow",
  });

  if (resolvedPresentation === "desktop") {
    if (!isOpen) {
      return null;
    }

    return (
      <LayoutPanel
        hasDivider
        isScrollable={!fillContent}
        label={label}
        padding={0}
        role="complementary"
        width={QOLLAB_CONTEXT_PANEL_WIDTH}
      >
        {children}
      </LayoutPanel>
    );
  }

  if (resolvedPresentation === "tablet") {
    return (
      <Dialog
        aria-label={label}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        padding={0}
        purpose={purpose}
        width={QOLLAB_CONTEXT_DIALOG_WIDTH}
      >
        {fillContent ? (
          <VStack height="70dvh" className="min-h-0 overflow-hidden">
            {children}
          </VStack>
        ) : (
          children
        )}
      </Dialog>
    );
  }

  return (
    <BottomSheet
      ref={containerRef}
      height="tall"
      isOpen={isOpen}
      label={label}
      onOpenChange={onOpenChange}
      purpose={purpose}
    >
      {fillContent ? (
        <VStack height="100%" className="min-h-0 overflow-hidden">
          {children}
        </VStack>
      ) : (
        children
      )}
    </BottomSheet>
  );
}
