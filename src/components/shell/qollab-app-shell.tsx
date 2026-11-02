import { AppShell, type MobileNavConfig } from "@astryxdesign/core/AppShell";
import {
  Layout,
  LayoutContent,
  type LayoutContentProps,
} from "@astryxdesign/core/Layout";
import type { ReactElement, ReactNode } from "react";

export type QollabMobileNavigationConfig = Pick<
  MobileNavConfig,
  "defaultIsMobile" | "hasToggle" | "isOpen" | "onOpenChange"
>;

export interface QollabAppShellProps {
  banner?: ReactNode;
  children: ReactNode;
  contentPadding?: LayoutContentProps["padding"];
  contextPanel?: ReactNode;
  header: ReactNode;
  isContentScrollable?: boolean;
  mobileNavigation?: QollabMobileNavigationConfig;
  sideNavigation: ReactNode;
}

export function QollabAppShell({
  banner,
  children,
  contentPadding = 0,
  contextPanel,
  header,
  isContentScrollable = true,
  mobileNavigation,
  sideNavigation,
}: QollabAppShellProps): ReactElement {
  const mobileNav: MobileNavConfig = {
    ...mobileNavigation,
    breakpoint: "md",
  };

  return (
    <AppShell
      banner={banner}
      contentPadding={0}
      height="fill"
      mobileNav={mobileNav}
      sideNav={sideNavigation}
      variant="section"
    >
      <Layout
        content={
          <LayoutContent
            isScrollable={isContentScrollable}
            padding={contentPadding}
          >
            {children}
          </LayoutContent>
        }
        end={contextPanel}
        header={header}
        height="fill"
        padding={0}
      />
    </AppShell>
  );
}
