/**
 * Qollab Workshop
 *
 * A sibling of MyBoardPrep with its own voice: Qollab Blue for actions, navy
 * ink, Bricolage Grotesque headings over Inter, and highlighter yellow for the
 * marks a study group leaves on its work.
 *
 * This is the editable source. Rebuild the committed SSR artifacts after each
 * change with `npm run theme:build`.
 */

import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

const buttonTokens: Record<string, string | [string, string]> = {
  "--qollab-button-radius": "12px",
  "--qollab-button-edge-primary": ["#1744A2", "#507EAF"],
  // The primary action is a gradient pill: lighter at the top, a darker rim,
  // and a soft glow beneath. The landing page's `.landing-cta` reuses these.
  "--qollab-button-gradient-primary":
    "linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 84%, var(--color-background-surface)), var(--color-text-accent))",
  "--qollab-button-glow-primary":
    "inset 0 1px 0 color-mix(in srgb, var(--color-background-surface) 28%, transparent), 0 8px 20px color-mix(in srgb, var(--color-accent) 28%, transparent)",
  "--qollab-button-edge-secondary": ["#C5D2E4", "#9696A3"],
  "--qollab-button-edge-destructive": ["#792722", "#A14B43"],
  "--qollab-button-secondary": ["#FFFFFF", "#34343F"],
  "--qollab-button-height-sm": "36px",
  "--qollab-button-height-md": "44px",
  "--qollab-button-height-lg": "48px",
  "--qollab-highlight": ["#FFE45C", "#E8C93A"],
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
    "--color-accent": ["#2563EB", "#93C5FD"],
    "--color-accent-muted": ["#EAF2FF", "#172D50"],
    "--color-on-accent": ["#FFFFFF", "#171717"],
    "--color-text-accent": ["#1D4ED8", "#BFDBFE"],

    "--color-background-body": ["#F7F8FC", "#111116"],
    "--color-background-surface": ["#FFFFFF", "#19191F"],
    "--color-background-card": ["#FFFFFF", "#1F1F25"],
    "--color-background-popover": ["#FFFFFF", "#27272D"],
    "--color-background-muted": ["#F3F5FA", "#222228"],
    "--color-background-inverted": ["#0F1B3D", "#F3F2F7"],

    "--color-text-primary": ["#0F1B3D", "#F3F2F7"],
    "--color-text-secondary": ["#536079", "#BCBBC4"],
    "--color-text-disabled": ["#7A869C", "#7D7C87"],
    "--color-icon-primary": ["#0F1B3D", "#F3F2F7"],
    "--color-icon-secondary": ["#536079", "#BCBBC4"],
    "--color-icon-accent": ["#2563EB", "#93C5FD"],

    "--color-border": ["#DFE7F2", "#34323C"],
    "--color-border-emphasized": ["#8291A8", "#9696A3"],
    "--color-neutral": ["#2563EB14", "#93C5FD24"],
    "--color-overlay-hover": ["#0F1B3D08", "#FFFFFF0A"],
    "--color-overlay-pressed": ["#2563EB14", "#93C5FD20"],
    "--color-skeleton": ["#E6ECF5", "#3B3944"],
    "--color-track": ["#D5DEEC", "#4B4954"],

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
            "calc(var(--spacing-1) * 0.5) solid var(--color-text-primary) !important",
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
        "--qollab-button-edge": "var(--qollab-button-edge-primary)",
        backgroundColor: "var(--color-accent) !important",
        backgroundImage: "var(--qollab-button-gradient-primary) !important",
        boxShadow: "var(--qollab-button-glow-primary) !important",
        borderRadius: "var(--radius-full) !important",
        paddingInline: "var(--spacing-4)",
        color: "var(--color-on-accent) !important",
        ":hover": {
          filter: "brightness(1.08)",
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
        backgroundColor: "transparent !important",
        color: "var(--color-error) !important",
        boxShadow: "none !important",
        ":hover": {
          backgroundColor: "var(--color-error-muted) !important",
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
      },
    },
    "number-input": {
      base: {
        borderRadius: "var(--radius-full)",
        "--astryx-number-input-padding-inline": "var(--spacing-3)",
      },
    },
    selector: {
      base: { borderRadius: "var(--radius-full)" },
    },
    "side-nav": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderInlineEndColor: "var(--color-border)",
        borderInlineEndStyle: "solid",
        borderInlineEndWidth: "var(--border-width)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-family-body)",
      },
    },
    "side-nav-item": {
      selected: {
        backgroundColor: "var(--color-accent-muted)",
        boxShadow: "inset 2px 0 0 var(--color-accent)",
        color: "var(--color-text-primary)",
        fontWeight: "var(--font-weight-medium)",
      },
    },
  },
});
