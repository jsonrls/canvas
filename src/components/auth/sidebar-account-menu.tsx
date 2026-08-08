"use client";

import { ChevronDown, ChevronUp, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";

interface SidebarAccountMenuProps {
  appearance?: "header" | "sidebar";
  beforeSignOut: () => Promise<void>;
  displayName: string;
  profileHref?: string;
  role?: string;
  settingsHref?: string;
  userColor?: string;
  userId: string;
}

type FocusTarget = "first" | "last";

export function SidebarAccountMenu({
  appearance = "sidebar",
  beforeSignOut,
  displayName,
  profileHref = "/profile",
  role = "member",
  settingsHref = "/settings",
  userColor,
  userId,
}: SidebarAccountMenuProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const focusTargetRef = useRef<FocusTarget>("first");
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const isHeaderMenu = appearance === "header";
  const Chevron = isHeaderMenu ? ChevronDown : ChevronUp;

  useEffect(() => {
    if (!isOpen) return;

    const animationFrame = window.requestAnimationFrame(() => {
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not(:disabled)',
        ) ?? [],
      );
      const target =
        focusTargetRef.current === "last" ? items.at(-1) : items.at(0);

      target?.focus();
    });

    const handlePointerDown = (event: PointerEvent): void => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const openMenu = (focusTarget: FocusTarget): void => {
    focusTargetRef.current = focusTarget;
    setIsOpen(true);
  };

  const handleMenuKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ): void => {
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? [],
    );

    if (items.length === 0) return;

    event.preventDefault();
    const currentIndex = items.findIndex(
      (item) => item === document.activeElement,
    );

    if (event.key === "Home") {
      items[0]?.focus();
      return;
    }

    if (event.key === "End") {
      items.at(-1)?.focus();
      return;
    }

    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      currentIndex < 0
        ? direction > 0
          ? 0
          : items.length - 1
        : (currentIndex + direction + items.length) % items.length;

    items[nextIndex]?.focus();
  };

  return (
    <div
      className={`sidebar-account-menu sidebar-account-menu--${appearance}`}
      ref={rootRef}
    >
      <button
        aria-label={`${isOpen ? "Close" : "Open"} account menu for ${displayName}`}
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="current-user sidebar-account-menu__trigger"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openMenu("first");
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(event.key === "ArrowUp" ? "last" : "first");
          }
        }}
        ref={triggerRef}
        style={
          {
            "--user-color": userColor,
          } as React.CSSProperties
        }
        type="button"
      >
        <span className="current-user__avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="current-user__copy">
          {isHeaderMenu ? <small>Signed in as</small> : null}
          <strong>{displayName}</strong>
          {!isHeaderMenu ? <small>You · {role}</small> : null}
        </span>
        <Chevron
          className="sidebar-account-menu__chevron"
          aria-hidden="true"
          size={15}
        />
      </button>

      {isOpen ? (
        <div
          aria-label="Account menu"
          className="sidebar-account-menu__popover"
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
          <Link
            className="sidebar-account-menu__item"
            href={profileHref}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <UserRound aria-hidden="true" size={16} />
            Profile
          </Link>
          <Link
            className="sidebar-account-menu__item"
            href={settingsHref}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <Settings aria-hidden="true" size={16} />
            Settings
          </Link>
          <span className="sidebar-account-menu__divider" role="separator" />
          <SignOutButton
            beforeSignOut={beforeSignOut}
            label="Logout"
            userId={userId}
            variant="menu"
          />
        </div>
      ) : null}
    </div>
  );
}
