import { LayoutHeader } from "@astryxdesign/core/Layout";
import { Toolbar, type ToolbarProps } from "@astryxdesign/core/Toolbar";
import type { ReactElement } from "react";

export const QOLLAB_WORKSPACE_HEADER_HEIGHT = 56;

export type QollabWorkspaceHeaderProps = Pick<
  ToolbarProps,
  "centerContent" | "endContent" | "label" | "startContent"
>;

export function QollabWorkspaceHeader({
  centerContent,
  endContent,
  label,
  startContent,
}: QollabWorkspaceHeaderProps): ReactElement {
  return (
    <LayoutHeader
      hasDivider
      height={QOLLAB_WORKSPACE_HEADER_HEIGHT}
      padding={0}
    >
      {/* The header is a fixed 56px. The toolbar's own block padding made its
          content taller than that, which pushed everything below the middle,
          so the padding is dropped and the content is centred in a 56px
          (min-h-14) row instead. */}
      <Toolbar
        className="flex min-h-14 min-w-0 items-center py-0! [&_.astryx-section]:w-full [&_.astryx-section]:py-0! [&_[role=toolbar]>:first-child]:min-w-0 [&_[role=toolbar]>:last-child]:shrink-0"
        centerContent={centerContent}
        endContent={endContent}
        gap={2}
        label={label}
        size="lg"
        startContent={startContent}
        variant="transparent"
      />
    </LayoutHeader>
  );
}
