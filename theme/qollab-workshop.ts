/**
 * Qollab Workshop
 *
 * A study commons: warm outer surfaces, compact reading typography,
 * flat controls, and Qollab Blue for actions and selection.
 *
 * This is the editable source. Rebuild the committed SSR artifacts after each
 * change with `npm run theme:build`.
 */

import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

const buttonTokens: Record<string, string | [string, string]> = {
  "--qollab-button-radius": "6px",
  "--qollab-button-edge-primary": ["#1744A2", "#507EAF"],
  "--qollab-button-edge-secondary": ["#828691", "#9696A3"],
  "--qollab-button-edge-destructive": ["#792722", "#A14B43"],
  "--qollab-button-secondary": ["#FFFFFF", "#34343F"],
  "--qollab-button-height-sm": "36px",
  "--qollab-button-height-md": "44px",
  "--qollab-button-height-lg": "48px",
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
      family: "var(--font-qollab-body)",
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
      weight: "semibold",
    },
    code: {
      family: "var(--font-qollab-code)",
      fallbacks: "ui-monospace, monospace",
    },
  },

  radius: { base: 3, multiplier: 1 },

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

    "--color-background-body": ["#F3F2EF", "#111116"],
    "--color-background-surface": ["#FFFFFF", "#19191F"],
    "--color-background-card": ["#FFFFFF", "#1F1F25"],
    "--color-background-popover": ["#FFFFFF", "#27272D"],
    "--color-background-muted": ["#F5F5F7", "#222228"],
    "--color-background-inverted": ["#0F0F14", "#F3F2F7"],

    "--color-text-primary": ["#0F0F14", "#F3F2F7"],
    "--color-text-secondary": ["#4A4A56", "#BCBBC4"],
    "--color-text-disabled": ["#747480", "#7D7C87"],
    "--color-icon-primary": ["#0F0F14", "#F3F2F7"],
    "--color-icon-secondary": ["#4A4A56", "#BCBBC4"],
    "--color-icon-accent": ["#2563EB", "#93C5FD"],

    "--color-border": ["#ECEBEF", "#34323C"],
    "--color-border-emphasized": ["#828691", "#9696A3"],
    "--color-neutral": ["#2563EB14", "#93C5FD24"],
    "--color-overlay-hover": ["#0F0F1408", "#FFFFFF0A"],
    "--color-overlay-pressed": ["#2563EB14", "#93C5FD20"],
    "--color-skeleton": ["#E5E4E9", "#3B3944"],
    "--color-track": ["#D8D6DE", "#4B4954"],

    "--color-success": ["#207A55", "#8FD9B0"],
    "--color-success-muted": ["#E7F6EE", "#2B6A4A4D"],
    "--color-warning": ["#9A6A1A", "#EAB85B"],
    "--color-warning-muted": ["#FFF8E6", "#D6923440"],
    "--color-error": ["#B53C36", "#FF9B90"],
    "--color-error-muted": ["#F4D9D4", "#B94A414D"],

    // The base radius scale generates 6px controls and 9px containers. Keep
    // shell and chat surfaces at the approved 12px cap rather than 21px.
    "--radius-page": "12px",
    "--radius-chat": "12px",
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
        color: "var(--color-on-accent) !important",
        ":hover": {
          backgroundColor:
            "color-mix(in srgb, var(--color-accent), var(--qollab-button-edge-primary) 12%) !important",
        },
      },
      "variant:secondary": {
        "--qollab-button-edge": "var(--qollab-button-edge-secondary)",
        backgroundColor: "var(--qollab-button-secondary) !important",
        color: "var(--color-text-primary) !important",
        ":hover": {
          backgroundColor:
            "color-mix(in srgb, var(--qollab-button-secondary), var(--qollab-button-edge-secondary) 12%) !important",
        },
      },
      "variant:destructive": {
        "--qollab-button-edge": "var(--qollab-button-edge-destructive)",
        backgroundColor: "var(--color-error) !important",
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
    "text-input": {
      base: {
        borderRadius: "var(--radius-element)",
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border-emphasized)",
      },
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
