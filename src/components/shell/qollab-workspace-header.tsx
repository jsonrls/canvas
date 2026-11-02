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
      <Toolbar
        className="min-w-0 py-1! [&_[role=toolbar]>:first-child]:min-w-0 [&_[role=toolbar]>:last-child]:shrink-0"
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
