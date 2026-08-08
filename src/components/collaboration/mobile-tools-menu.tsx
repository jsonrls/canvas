"use client";

import { MoreHorizontal, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface MobileToolsMenuProps {
  active?: boolean;
  children: (close: () => void) => ReactNode;
  description: string;
  title: string;
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function MobileToolsMenu({
  active = false,
  children,
  description,
  title,
}: MobileToolsMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((): void => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
          [],
      );
      const first = focusable.at(0);
      const last = focusable.at(-1);

      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const closeAtDesktopWidth = (event: MediaQueryListEvent): void => {
      if (!event.matches) close();
    };

    document.addEventListener("keydown", handleKeyDown);
    mobileQuery.addEventListener("change", closeAtDesktopWidth);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      mobileQuery.removeEventListener("change", closeAtDesktopWidth);
      window.requestAnimationFrame(() => trigger?.focus());
    };
  }, [close, open]);

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="mobile-tools-dialog__backdrop"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
            role="presentation"
          >
            <div
              aria-describedby={descriptionId}
              aria-labelledby={titleId}
              aria-modal="true"
              className="mobile-tools-dialog"
              id={dialogId}
              ref={dialogRef}
              role="dialog"
            >
              <header className="mobile-tools-dialog__header">
                <div>
                  <h2 id={titleId}>{title}</h2>
                  <p id={descriptionId}>{description}</p>
                </div>
                <button
                  aria-label={`Close ${title}`}
                  className="mobile-tools-dialog__close"
                  onClick={close}
                  ref={closeButtonRef}
                  type="button"
                >
                  <X aria-hidden="true" size={20} />
                </button>
              </header>
              <div className="mobile-tools-dialog__body">{children(close)}</div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        aria-controls={dialogId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Open ${title}`}
        className={`mobile-tools-menu__trigger${active ? " is-active" : ""}`}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        title={title}
        type="button"
      >
        <MoreHorizontal aria-hidden="true" size={19} />
        <span>More</span>
      </button>
      {dialog}
    </>
  );
}
