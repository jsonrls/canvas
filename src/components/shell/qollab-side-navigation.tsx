import {
  SideNav,
  SideNavCollapseButton,
  SideNavItem,
  SideNavSection,
  type SideNavItemProps,
} from "@astryxdesign/core/SideNav";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { useContainerReveal } from "@astryxdesign/core/hooks";
import type { ReactElement, ReactNode } from "react";

import { PanelLeft } from "@/components/ui/icons";

export const QOLLAB_PRIMARY_NAVIGATION_WIDTH = 256;
export const QOLLAB_PRIMARY_NAVIGATION_MIN_WIDTH = 240;
export const QOLLAB_PRIMARY_NAVIGATION_MAX_WIDTH = 320;
export const QOLLAB_PRIMARY_NAVIGATION_AUTOSAVE_ID =
  "qollab-primary-navigation";

export interface QollabNavigationItem {
  as?: SideNavItemProps["as"];
  collapsible?: SideNavItemProps["collapsible"];
  endContent?: ReactNode;
  href?: string;
  icon?: SideNavItemProps["icon"];
  id: string;
  isDisabled?: boolean;
  isSelected?: boolean;
  items?: readonly QollabNavigationItem[];
  label: string;
  onClick?: SideNavItemProps["onClick"];
  selectedIcon?: SideNavItemProps["selectedIcon"];
  size?: SideNavItemProps["size"];
}

export interface QollabNavigationSection {
  endContent?: ReactNode;
  id: string;
  isHeaderHidden?: boolean;
  items: readonly QollabNavigationItem[];
  subtitle?: string;
  title: string;
}

export interface QollabNavigationSectionsProps {
  linkComponent?: SideNavItemProps["as"];
  sections: readonly QollabNavigationSection[];
}

export interface QollabSideNavigationProps extends QollabNavigationSectionsProps {
  collapseButtonLabel?: string;
  collapsedHeader?: ReactNode;
  defaultIsCollapsed?: boolean;
  footer?: ReactNode;
  footerIcons?: ReactNode;
  header: ReactNode;
  isCollapsed?: boolean;
  label?: string;
  onCollapsedChange?: (isCollapsed: boolean) => void;
  onWidthChange?: (width: number) => void;
  topContent?: ReactNode;
}

function mergeClassNames(
  firstClassName: string,
  secondClassName?: string,
): string {
  return secondClassName
    ? `${firstClassName} ${secondClassName}`
    : firstClassName;
}

function QollabSideNavigationHeader({
  collapsedHeader,
  header,
  isCollapsed,
}: {
  collapsedHeader: ReactNode;
  header: ReactNode;
  isCollapsed: boolean;
}): ReactElement {
  const { getContainerProps, getContentRevealProps } = useContainerReveal({
    isEnabled: isCollapsed,
  });
  const containerProps = getContainerProps({ hoverDelay: 100 });
  const logoProps = getContentRevealProps({
    isLayoutPreserved: true,
    isRevealInverted: true,
  });
  const collapseButtonProps = getContentRevealProps({
    isLayoutPreserved: true,
  });

  if (!isCollapsed) {
    return (
      <HStack
        className="min-h-14"
        hAlign="between"
        paddingInlineEnd={2}
        vAlign="center"
        width="100%"
      >
        {header}
        <SideNavCollapseButton className="min-h-11 min-w-11" size="lg">
          <PanelLeft aria-hidden="true" size={18} />
        </SideNavCollapseButton>
      </HStack>
    );
  }

  return (
    <HStack hAlign="center" minHeight={56} vAlign="center" width="100%">
      <HStack
        {...containerProps}
        as="span"
        className={mergeClassNames(
          "relative h-11 w-11",
          containerProps.className,
        )}
        hAlign="center"
        vAlign="center"
      >
        <HStack
          {...logoProps}
          as="span"
          className={mergeClassNames(
            "pointer-events-none absolute inset-0",
            logoProps.className,
          )}
          hAlign="center"
          vAlign="center"
        >
          {collapsedHeader}
        </HStack>
        <HStack
          {...collapseButtonProps}
          as="span"
          className={mergeClassNames(
            "absolute inset-0",
            collapseButtonProps.className,
          )}
          hAlign="center"
          vAlign="center"
        >
          <SideNavCollapseButton className="min-h-11 min-w-11" size="lg">
            <PanelLeft aria-hidden="true" size={18} />
          </SideNavCollapseButton>
        </HStack>
      </HStack>
    </HStack>
  );
}

function NavigationItem({
  item,
  linkComponent,
}: {
  item: QollabNavigationItem;
  linkComponent?: SideNavItemProps["as"];
}): ReactElement {
  const nestedItems = item.items?.map((nestedItem) => (
    <NavigationItem
      item={nestedItem}
      key={nestedItem.id}
      linkComponent={linkComponent}
    />
  ));
  const hasNestedItems = nestedItems != null && nestedItems.length > 0;

  return (
    <SideNavItem
      as={item.as ?? linkComponent}
      collapsible={hasNestedItems ? (item.collapsible ?? true) : undefined}
      endContent={item.endContent}
      href={item.href}
      icon={item.icon}
      isDisabled={item.isDisabled}
      isSelected={item.isSelected}
      label={item.label}
      onClick={item.onClick}
      selectedIcon={item.selectedIcon}
      size={item.size}
    >
      {nestedItems}
    </SideNavItem>
  );
}

export function QollabNavigationSections({
  linkComponent,
  sections,
}: QollabNavigationSectionsProps): ReactElement {
  return (
    <VStack gap={0} className="[&_.astryx-side-nav-item]:min-h-11!">
      {sections.map((section) => (
        <SideNavSection
          endContent={section.endContent}
          isHeaderHidden={section.isHeaderHidden}
          key={section.id}
          subtitle={section.subtitle}
          title={section.title}
        >
          {section.items.map((item) => (
            <NavigationItem
              item={item}
              key={item.id}
              linkComponent={linkComponent}
            />
          ))}
        </SideNavSection>
      ))}
    </VStack>
  );
}

export function QollabSideNavigation({
  collapseButtonLabel,
  collapsedHeader,
  defaultIsCollapsed,
  footer,
  footerIcons,
  header,
  isCollapsed,
  label = "Qollab workspace navigation",
  linkComponent,
  onCollapsedChange,
  onWidthChange,
  sections,
  topContent,
}: QollabSideNavigationProps): ReactElement {
  const hasHeaderCollapseButton =
    collapsedHeader != null &&
    typeof isCollapsed === "boolean" &&
    onCollapsedChange != null;

  return (
    <SideNav
      aria-label={label}
      collapsible={{
        buttonLabel: collapseButtonLabel,
        defaultIsCollapsed,
        hasButton: !hasHeaderCollapseButton,
        isCollapsed,
        onCollapsedChange,
      }}
      footer={footer}
      footerIcons={footerIcons}
      header={
        hasHeaderCollapseButton ? (
          <QollabSideNavigationHeader
            collapsedHeader={collapsedHeader}
            header={header}
            isCollapsed={isCollapsed}
          />
        ) : (
          header
        )
      }
      resizable={{
        autoSaveId: QOLLAB_PRIMARY_NAVIGATION_AUTOSAVE_ID,
        defaultWidth: QOLLAB_PRIMARY_NAVIGATION_WIDTH,
        maxWidth: QOLLAB_PRIMARY_NAVIGATION_MAX_WIDTH,
        minWidth: QOLLAB_PRIMARY_NAVIGATION_MIN_WIDTH,
        onWidthChange,
      }}
      topContent={topContent}
    >
      <QollabNavigationSections
        linkComponent={linkComponent}
        sections={sections}
      />
    </SideNav>
  );
}
