/**
 * Qollab Workshop
 *
 * A sibling of MyBoardPrep with its own voice: ink for actions, cobalt for
 * where attention is, Lexend headings over Figtree, and highlighter yellow for
 * the marks a study group leaves on its work.
 *
 * This is the editable source. Rebuild the committed SSR artifacts after each
 * change with `npm run theme:build`.
 */

import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

const buttonTokens: Record<string, string | [string, string]> = {
  "--qollab-button-radius": "12px",
  // The primary action is a flat ink pill; cobalt only marks focus, links and
  // selection. The landing page's `.landing-cta` reuses these.
  "--qollab-button-primary": ["#0E1024", "#F2F3FA"],
  "--qollab-button-primary-hover": ["#2A2D47", "#D5D8EA"],
  "--qollab-button-on-primary": ["#FFFFFF", "#0E1024"],
  "--qollab-button-edge-secondary": ["#7F839E", "#8A8EA8"],
  "--qollab-button-edge-destructive": ["#792722", "#A14B43"],
  "--qollab-button-secondary": ["#FFFFFF", "#34343F"],
  // A focused field: the accent border plus one more pixel, a solid 2px ring.
  // Shared by the theme's fields and the raw inputs in globals.css.
  "--qollab-field-focus-ring": "0 0 0 1px var(--color-accent)",
  // Menus and lists that float, then dialogs.
  "--qollab-popup-radius": "16px",
  "--qollab-option-radius": "8px",
  "--qollab-dialog-radius": "24px",
  "--qollab-popup-shadow":
    "0 1px 2px color-mix(in srgb, var(--color-text-primary) 8%, transparent), 0 12px 32px color-mix(in srgb, var(--color-text-primary) 14%, transparent)",
  "--qollab-dialog-shadow":
    "0 2px 4px color-mix(in srgb, var(--color-text-primary) 8%, transparent), 0 24px 64px color-mix(in srgb, var(--color-text-primary) 22%, transparent)",
  "--qollab-button-height-sm": "32px",
  "--qollab-button-height-md": "36px",
  "--qollab-button-height-lg": "40px",
  "--qollab-highlight": ["#FFE45C", "#E8C93A"],
  // Live answers, in this order. Chosen so neighbours stay apart for red-green
  // colour blindness at every count; see plan/feature-live-visuals-1.md.
  "--qollab-answer-1": "#2563EB",
  "--qollab-answer-2": "#0F9488",
  "--qollab-answer-3": "#D97706",
  "--qollab-answer-4": "#DB2777",
  "--qollab-answer-5": "#6B21A8",
  "--qollab-answer-6": "#4D7C0F",
};

export const qollabTheme = defineTheme({
  name: "qollab-workshop",
  extends: neutralTheme,

  typography: {
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: "var(--font-qollab-body)",
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
    },
    heading: {
      family: "var(--font-qollab-heading)",
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
      weight: "semibold",
    },
    code: {
      family: "var(--font-qollab-code)",
      fallbacks: "ui-monospace, monospace",
    },
  },

  radius: { base: 4, multiplier: 1 },

  motion: {
    fast: 110,
    medium: 220,
    slow: 520,
    ratio: 0.72,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  },

  tokens: {
    "--color-accent": ["#2B4BFF", "#8098FF"],
    "--color-accent-muted": ["#E8ECFF", "#1A2052"],
    "--color-on-accent": ["#FFFFFF", "#0E1024"],
    // Deeper than the accent so small text still reads on a hovered tint.
    "--color-text-accent": ["#1F3BE0", "#A9B8FF"],

    "--color-background-body": ["#FFFFFF", "#0B0D1E"],
    "--color-background-surface": ["#FFFFFF", "#0B0D1E"],
    "--color-background-card": ["#FFFFFF", "#15182E"],
    "--color-background-popover": ["#FFFFFF", "#1C2040"],
    "--color-background-muted": ["#F2F3FA", "#15182E"],
    "--color-background-inverted": ["#0E1024", "#F2F3FA"],

    "--color-text-primary": ["#0E1024", "#F2F3FA"],
    "--color-text-secondary": ["#4B4F6B", "#B3B7CF"],
    "--color-text-disabled": ["#7F839E", "#8A8EA8"],
    "--color-icon-primary": ["#0E1024", "#F2F3FA"],
    "--color-icon-secondary": ["#4B4F6B", "#B3B7CF"],
    "--color-icon-accent": ["#2B4BFF", "#8098FF"],

    "--color-border": ["#DFE1EE", "#2A2E4A"],
    "--color-border-emphasized": ["#7F839E", "#8A8EA8"],
    "--color-neutral": ["#2B4BFF14", "#8098FF24"],
    "--color-overlay-hover": ["#0E102408", "#FFFFFF0A"],
    "--color-overlay-pressed": ["#2B4BFF14", "#8098FF20"],
    "--color-skeleton": ["#E6E8F3", "#2A2E4A"],
    "--color-track": ["#D5D8E8", "#3A3F5E"],

    "--color-success": ["#207A55", "#8FD9B0"],
    "--color-success-muted": ["#E7F6EE", "#2B6A4A4D"],
    "--color-warning": ["#9A6A1A", "#EAB85B"],
    "--color-warning-muted": ["#FFF8E6", "#D6923440"],
    "--color-error": ["#B53C36", "#FF9B90"],
    "--color-error-muted": ["#F4D9D4", "#B94A414D"],

    // The base radius scale generates 8px controls and 12px containers. Keep
    // shell and chat surfaces at 16px rather than the scale's larger step.
    "--radius-page": "16px",
    "--radius-chat": "16px",
    ...buttonTokens,
  },

  components: {
    button: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--spacing-2)",
        paddingInline: "var(--spacing-3)",
        paddingBlock: "var(--spacing-2)",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--text-label-size)",
        lineHeight: "var(--text-label-leading)",
        fontWeight: "var(--font-weight-semibold) !important",
        borderRadius: "var(--qollab-button-radius) !important",
        border:
          "var(--border-width) solid var(--qollab-button-edge) !important",
        boxShadow: "none !important",
        backgroundImage: "none !important",
        transform: "none !important",
        cursor: "pointer",
        textDecoration: "none !important",
        ":active:not(:disabled):not([aria-disabled='true'])": {
          transform: "none !important",
          backgroundImage: "none !important",
          boxShadow: "none !important",
        },
        ":focus-visible": {
          outline:
            "calc(var(--spacing-1) * 0.5) solid var(--color-accent) !important",
          outlineOffset: "calc(var(--spacing-1) * 0.75) !important",
        },
        ":is(:disabled,[aria-disabled='true'])": {
          boxShadow: "none !important",
          transform: "none !important",
          opacity: "0.5 !important",
          cursor: "default",
        },
        ":is([aria-pressed='true'],[aria-selected='true'],[aria-current='page'],.is-active,.sidebar-link--active)":
          {
            backgroundColor: "var(--color-accent-muted) !important",
            color: "var(--color-text-accent) !important",
            borderColor: "var(--color-accent) !important",
          },
      },
      "size:sm": {
        minHeight: "var(--qollab-button-height-sm) !important",
        height: "auto",
      },
      "size:md": {
        minHeight: "var(--qollab-button-height-md) !important",
        height: "auto",
      },
      "size:lg": {
        minHeight: "var(--qollab-button-height-lg) !important",
        height: "auto",
      },
      "variant:primary": {
        "--qollab-button-edge": "var(--qollab-button-primary)",
        backgroundColor: "var(--qollab-button-primary) !important",
        borderRadius: "var(--radius-full) !important",
        paddingInline: "var(--spacing-4)",
        color: "var(--qollab-button-on-primary) !important",
        ":hover": {
          backgroundColor: "var(--qollab-button-primary-hover) !important",
        },
      },
      "variant:secondary": {
        "--qollab-button-edge": "var(--qollab-button-edge-secondary)",
        backgroundColor: "var(--qollab-button-secondary) !important",
        borderRadius: "var(--radius-full) !important",
        paddingInline: "var(--spacing-4)",
        color: "var(--color-text-primary) !important",
        ":hover": {
          backgroundColor:
            "color-mix(in srgb, var(--qollab-button-secondary), var(--qollab-button-edge-secondary) 12%) !important",
        },
      },
      "variant:destructive": {
        "--qollab-button-edge": "var(--qollab-button-edge-destructive)",
        backgroundColor: "var(--color-error) !important",
        borderRadius: "var(--radius-full) !important",
        paddingInline: "var(--spacing-4)",
        color: "var(--color-on-error) !important",
        ":hover": {
          backgroundColor:
            "color-mix(in srgb, var(--color-error), var(--qollab-button-edge-destructive) 12%) !important",
        },
      },
      "variant:ghost": {
        "--qollab-button-edge": "transparent",
        borderRadius: "var(--radius-full) !important",
        backgroundColor: "transparent !important",
        color: "var(--color-text-primary) !important",
        boxShadow: "none !important",
        ":hover": {
          backgroundColor: "var(--color-overlay-hover) !important",
        },
        ":is([aria-pressed='true'],[aria-selected='true'],[aria-current='page'],.is-active,.sidebar-link--active)":
          {
            backgroundColor: "var(--color-accent-muted) !important",
            color: "var(--color-text-accent) !important",
            borderColor: "var(--color-accent) !important",
          },
        ":active": {
          transform: "none !important",
          boxShadow: "none !important",
        },
      },
      "variant:danger-ghost": {
        "--qollab-button-edge": "transparent",
        borderRadius: "var(--radius-full) !important",
        backgroundColor: "transparent !important",
        color: "var(--color-error) !important",
        boxShadow: "none !important",
        ":hover": {
          backgroundColor: "var(--color-error-muted) !important",
        },
      },
      // A tinted fill: quieter than a solid button, easier to spot than a ghost.
      "variant:accent-soft": {
        "--qollab-button-edge": "transparent",
        backgroundColor: "var(--color-accent-muted) !important",
        borderRadius: "var(--radius-full) !important",
        paddingInline: "var(--spacing-4)",
        color: "var(--color-text-accent) !important",
        ":hover": {
          backgroundColor:
            "color-mix(in srgb, var(--color-accent-muted), var(--color-accent) 12%) !important",
        },
      },
      "variant:link": {
        "--qollab-button-edge": "transparent",
        backgroundColor: "transparent !important",
        color: "var(--color-text-accent) !important",
        boxShadow: "none !important",
        ":hover": {
          backgroundColor: "var(--color-accent-muted) !important",
        },
      },
    },
    card: {
      base: {
        borderRadius: "var(--radius-container)",
        borderColor: "var(--color-border)",
        borderStyle: "solid",
        borderWidth: "var(--border-width)",
        boxShadow: "none",
      },
    },
    // Single-line fields share the buttons' pill shape. Text areas keep
    // their corners: a pill cannot hold several lines.
    "text-input": {
      base: {
        borderRadius: "var(--radius-full)",
        paddingInline: "var(--spacing-4)",
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border-emphasized)",
        ":focus-within": {
          boxShadow: "var(--qollab-field-focus-ring)",
        },
        // A field showing a warning or error keeps its status colour.
        ":focus-within:not([data-status])": {
          borderColor: "var(--color-accent)",
        },
      },
    },
    "number-input": {
      base: {
        borderRadius: "var(--radius-full)",
        "--astryx-number-input-padding-inline": "var(--spacing-4)",
        ":focus-within": {
          boxShadow: "var(--qollab-field-focus-ring)",
        },
        // A field showing a warning or error keeps its status colour.
        ":focus-within:not([data-status])": {
          borderColor: "var(--color-accent)",
        },
      },
    },
    selector: {
      base: {
        borderRadius: "var(--radius-full)",
        paddingInline: "var(--spacing-4)",
        ":focus-within": {
          boxShadow: "var(--qollab-field-focus-ring)",
        },
        // A field showing a warning or error keeps its status colour.
        ":focus-within:not([data-status])": {
          borderColor: "var(--color-accent)",
        },
      },
    },
    textarea: {
      base: {
        borderRadius: "var(--radius-page)",
        paddingInline: "var(--spacing-4)",
        borderColor: "var(--color-border-emphasized)",
        ":focus-within": {
          boxShadow: "var(--qollab-field-focus-ring)",
        },
        // A field showing a warning or error keeps its status colour.
        ":focus-within:not([data-status])": {
          borderColor: "var(--color-accent)",
        },
      },
    },
    "date-input": {
      base: {
        borderRadius: "var(--radius-full)",
        paddingInline: "var(--spacing-4)",
        ":focus-within": {
          boxShadow: "var(--qollab-field-focus-ring)",
        },
        ":focus-within:not([data-status])": {
          borderColor: "var(--color-accent)",
        },
      },
    },
    "file-input": {
      base: {
        borderRadius: "var(--radius-full)",
        paddingInline: "var(--spacing-4)",
      },
    },
    // The default tucks a tinted box under the field, which breaks the pill.
    // A plain line under the field reads the same on every shape.
    "field-status": {
      "variant:attached": {
        marginTop: "var(--spacing-1)",
        paddingBlock: "0",
        paddingInline: "var(--spacing-4)",
        backgroundColor: "transparent",
      },
      "type:error": { color: "var(--color-error)" },
      "type:warning": { color: "var(--color-warning)" },
      "type:success": { color: "var(--color-success)" },
    },
    "field-label": {
      base: {
        fontWeight: "var(--font-weight-medium)",
      },
    },
    // Lists and menus that float: one rounded sheet of rounded rows. The
    // chosen row is tinted as well as ticked.
    "selector-popup": {
      base: {
        borderRadius: "var(--qollab-popup-radius)",
        boxShadow: "var(--qollab-popup-shadow)",
      },
    },
    "selector-option-row": {
      base: {
        borderRadius: "var(--qollab-option-radius)",
      },
      selected: {
        backgroundColor: "var(--color-accent-muted)",
        fontWeight: "var(--font-weight-medium)",
      },
    },
    "selector-check": {
      base: {
        color: "var(--color-accent)",
      },
    },
    "dropdown-menu": {
      base: {
        borderRadius: "var(--qollab-popup-radius)",
        boxShadow: "var(--qollab-popup-shadow)",
      },
    },
    "dropdown-menu-item": {
      base: {
        borderRadius: "var(--qollab-option-radius)",
      },
    },
    "popover-surface": {
      base: {
        borderRadius: "var(--qollab-popup-radius)",
        boxShadow: "var(--qollab-popup-shadow)",
      },
    },
    calendar: {
      base: {
        borderRadius: "var(--qollab-popup-radius)",
      },
    },
    "calendar-day": {
      base: {
        borderRadius: "var(--radius-full)",
      },
      selected: {
        color: "var(--color-on-accent) !important",
      },
    },
    dialog: {
      "variant:standard": {
        borderRadius: "var(--qollab-dialog-radius)",
        boxShadow: "var(--qollab-dialog-shadow)",
      },
    },
    "bottom-sheet": {
      base: {
        borderStartStartRadius: "var(--qollab-dialog-radius)",
        borderStartEndRadius: "var(--qollab-dialog-radius)",
      },
    },
    "segmented-control": {
      base: {
        borderRadius: "var(--radius-full)",
      },
    },
    "segmented-control-item": {
      base: {
        borderRadius: "var(--radius-full)",
      },
      selected: {
        boxShadow: "inset 0 0 0 1px var(--color-border-emphasized)",
      },
    },
    banner: {
      base: {
        borderRadius: "var(--qollab-popup-radius)",
      },
    },
    token: {
      base: {
        borderRadius: "var(--radius-full)",
      },
    },
    // Framed sheet: the sidebar sits on the tinted frame; the workspace is the white sheet beside it.
    "side-nav": {
      base: {
        backgroundColor: "var(--color-background-muted)",
        borderInlineEndWidth: "0",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-family-body)",
      },
    },
    "side-nav-item": {
      selected: {
        backgroundColor: "var(--color-background-surface)",
        boxShadow: "none",
        color: "var(--color-text-primary)",
        fontWeight: "var(--font-weight-medium)",
      },
    },
    // Astryx's SideNav resize handle overhangs the panel by half a pixel; clip it so the panel never scrolls sideways.
    "app-shell-sidenav": {
      base: {
        overflowX: "clip",
      },
    },
  },
});
