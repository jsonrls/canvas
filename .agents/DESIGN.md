---
version: alpha
name: BoardPrep-design-system
description: A vibrant, modern educational platform featuring a color system derived from the BoardPrep logo. The system uses brand blue as the primary color with golden yellow, red-orange, and supporting blue tones to create an energetic and engaging learning environment. The design balances modern aesthetics with educational functionality, using the brand palette for CTAs and highlights while maintaining readability with supporting neutral tones.

colors:
  brand-blue: "#3871C2"
  golden-yellow: "#FEBD59"
  red-orange: "#F04623"
  light-blue: "#86CEE7"
  medium-blue: "#69ABDF"
  soft-pink: "#EFC2BC"
  tan: "#CC9E8F"
  brown: "#9C614F"
  charcoal: "#393536"
  white: "#FFFFFF"
  success: "#10B981"
  warning: "#F59E0B"
  error: "#EF4444"
  info: "#3871C2"

typography:
  display-xl:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  display-lg:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  display-md:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  display-sm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-lg:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-md:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  title-sm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  caption:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0.1em
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  button:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.medium-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
  button-accent:
    backgroundColor: "{colors.golden-yellow}"
    textColor: "{colors.charcoal}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-accent-hover:
    backgroundColor: "{colors.red-orange}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
    border: "1px solid #E2E8F0"
  button-secondary-on-dark:
    backgroundColor: "rgba(255,255,255,0.1)"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-text-link:
    backgroundColor: transparent
    textColor: "{colors.brand-blue}"
    typography: "{typography.button}"
  button-icon-circular:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.full}"
    size: 36px
    border: "1px solid #E2E8F0"
  text-link:
    backgroundColor: transparent
    textColor: "{colors.brand-blue}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    typography: "{typography.nav-link}"
    height: 64px
    border: "1px solid #E2E8F0"
  hero-band:
    backgroundColor: "brand-gradient"
    textColor: "#ffffff"
    typography: "{typography.display-xl}"
    padding: 96px
  hero-illustration-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.xl}"
    border: "1px solid #E2E8F0"
  feature-card:
    backgroundColor: "#ffffff"
    textColor: "{colors.charcoal}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
    border: "1px solid #E2E8F0"
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  product-mockup-card-dark:
    backgroundColor: "{colors.charcoal}"
    textColor: "#ffffff"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  code-window-card:
    backgroundColor: "{colors.charcoal}"
    textColor: "#ffffff"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: 24px
  model-comparison-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
    border: "1px solid #E2E8F0"
  pricing-tier-card:
    backgroundColor: "#ffffff"
    textColor: "{colors.charcoal}"
    typography: "{typography.title-lg}"
    rounded: "{rounded.lg}"
    padding: 32px
    border: "1px solid #E2E8F0"
  pricing-tier-card-featured:
    backgroundColor: "{colors.brand-blue}"
    textColor: "#ffffff"
    typography: "{typography.title-lg}"
    rounded: "{rounded.lg}"
    padding: 32px
  callout-card-brand:
    backgroundColor: "{colors.brand-blue}"
    textColor: "#ffffff"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  callout-card-accent:
    backgroundColor: "{colors.golden-yellow}"
    textColor: "{colors.charcoal}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  connector-tile:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 20px
    border: "1px solid #E2E8F0"
  text-input:
    backgroundColor: "#ffffff"
    textColor: "{colors.charcoal}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    height: 40px
    border: "1px solid #E2E8F0"
  text-input-focused:
    backgroundColor: "#ffffff"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.md}"
    border: "2px solid {colors.brand-blue}"
  cookie-consent-card:
    backgroundColor: "{colors.charcoal}"
    textColor: "#ffffff"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 24px
  category-tab:
    backgroundColor: transparent
    textColor: "{colors.medium-blue}"
    typography: "{typography.nav-link}"
    padding: 8px 14px
    rounded: "{rounded.md}"
  category-tab-active:
    backgroundColor: "{colors.soft-pink}"
    textColor: "{colors.brand-blue}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.md}"
  badge-pill:
    backgroundColor: "{colors.soft-pink}"
    textColor: "{colors.charcoal}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  badge-brand:
    backgroundColor: "{colors.brand-blue}"
    textColor: "#ffffff"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  badge-accent:
    backgroundColor: "{colors.golden-yellow}"
    textColor: "{colors.charcoal}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  cta-band-brand:
    backgroundColor: "{colors.brand-blue}"
    textColor: "#ffffff"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 64px
  cta-band-gradient:
    backgroundColor: "brand-gradient"
    textColor: "#ffffff"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 64px
  cta-band-dark:
    backgroundColor: "{colors.charcoal}"
    textColor: "#ffffff"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 64px
  footer:
    backgroundColor: "{colors.charcoal}"
    textColor: "#ffffff"
    typography: "{typography.body-sm}"
    padding: 64px
---

## Technology Stack

This design system is implemented using **shadcn/ui** components built on **Tailwind CSS**. The design tokens and component specifications are mapped to Tailwind utility classes and shadcn component variants.

### Tailwind CSS Configuration
The design system colors, typography, spacing, and border radius tokens are configured in the Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-blue': '#3871C2',
        'golden-yellow': '#FEBD59',
        'red-orange': '#F04623',
        'light-blue': '#86CEE7',
        'medium-blue': '#69ABDF',
        'soft-pink': '#EFC2BC',
        tan: '#CC9E8F',
        brown: '#9C614F',
        charcoal: '#393536',
        white: '#FFFFFF',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3871C2',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '96px',
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        pill: '9999px',
        full: '9999px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3871C2, #69ABDF, #86CEE7, #FEBD59, #F04623)',
        'brand-gradient-subtle': 'linear-gradient(135deg, rgba(56,113,194,0.1), rgba(105,171,223,0.1), rgba(134,206,231,0.1))',
      },
    },
  },
}
```

### shadcn/ui Integration
The design system components are implemented using shadcn/ui primitives with custom styling:

- **Buttons**: Extended shadcn Button component with coral primary variant
- **Cards**: Custom Card components with cream/dark surface variants
- **Inputs**: Textarea and Input components with hairline borders
- **Navigation**: Custom navigation components using shadcn primitives
- **Badges**: Badge components with pill and coral variants
- **Tabs**: Tab components with category-tab styling

### Component Mapping

| Design Token | Tailwind Class | shadcn Component |
|-------------|---------------|------------------|
| `{colors.brand-blue}` | `bg-brand-blue` | Button variant |
| `brand-gradient` | `bg-brand-gradient` | Primary buttons, hero sections |
| `{colors.white}` | `bg-white` | Card background |
| `{colors.charcoal}` | `bg-charcoal` | Dark card variant |
| `{rounded.md}` | `rounded-md` | Button, Input |
| `{rounded.lg}` | `rounded-lg` | Card components |
| `{spacing.xl}` | `p-8` | Card padding |
| `{spacing.section}` | `py-24` | Section spacing |

### Utility Class Patterns

**Background Colors:**
- White background: `bg-white`
- Charcoal background: `bg-charcoal`
- Soft pink accent: `bg-soft-pink`
- Brand blue: `bg-brand-blue`
- Golden yellow accent: `bg-golden-yellow`
- Brand gradient: `bg-brand-gradient`
- Subtle gradient: `bg-brand-gradient-subtle`

**Text Colors:**
- Charcoal text: `text-charcoal`
- Brand blue text: `text-brand-blue`
- Golden yellow text: `text-golden-yellow`
- White on dark: `text-white`

**Typography:**
- Display xl: `text-6xl font-bold tracking-tight`
- Display lg: `text-5xl font-bold tracking-tight`
- Title md: `text-lg font-semibold`
- Body md: `text-base font-normal`

### Custom shadcn Variants

Extended shadcn components with design system variants:

```javascript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-brand-blue text-white hover:bg-medium-blue",
        secondary: "bg-white text-charcoal border border-gray-200 hover:bg-soft-pink",
        "secondary-on-dark": "bg-white/10 text-white hover:bg-white/20",
        ghost: "text-brand-blue hover:bg-brand-gradient-subtle",
        accent: "bg-golden-yellow text-charcoal hover:bg-red-orange",
      },
    },
  }
)
```

## Overview

BoardPrep is a vibrant, modern educational platform featuring a color system derived from the official BoardPrep logo. The base atmosphere uses a **white background** (`{colors.white}` — #FFFFFF) with **brand blue** as the primary color and supporting golden yellow, red-orange, and blue tones for accents. Headlines use **Inter** at weight 600-700 for a clean, modern feel that appeals to students and educators. The combination creates an energetic and engaging learning environment.

Brand voltage comes from the **brand blue** (`{colors.brand-blue}` — #3871C2) as the primary color, complemented by **golden yellow** (`{colors.golden-yellow}` — #FEBD59) for warmth and **red-orange** (`{colors.red-orange}` — #F04623) for energy. Supporting colors include light blue, medium blue, soft pink, tan, brown, and charcoal for depth and variety. These colors are used on primary CTAs, hero sections, featured cards, and accent elements while maintaining excellent readability.

The system has three surface modes that alternate page-by-page:
1. **White background** (`{colors.white}`) — default body floor
2. **Soft pink accents** (`{colors.soft-pink}`) — section dividers and highlights
3. **Charcoal surfaces** (`{colors.charcoal}`) — code editor mockups, featured sections, footer

The charcoal surfaces provide contrast and depth, making the brand blue and golden yellow accents pop while maintaining excellent readability for educational content.

**Key Characteristics:**
- White background (`{colors.white}` — #FFFFFF) with charcoal text (`{colors.charcoal}` — #393536). Clean, modern base.
- Brand blue primary CTA (`{colors.brand-blue}` — #3871C2) featuring the logo's main color. Used for primary buttons, links, and key interactive elements.
- Golden yellow accents (`{colors.golden-yellow}` — #FEBD59) for warmth and highlights. Red-orange (`{colors.red-orange}` — #F04623) for energetic CTAs.
- Inter sans-serif headlines at weight 600-700 for a modern, approachable feel. Pairs with Inter body for consistency.
- Charcoal mockup cards (`{colors.charcoal}` — #393536) carrying code blocks, terminal panels, and collaboration interfaces — excellent contrast for brand blue accents.
- White feature cards with subtle borders — clean, professional appearance for educational content.
- Soft pink and tan accents provide warmth and variety without overwhelming the brand blue primary.
- Border radius is hierarchical: `{rounded.md}` (8px) for buttons + inputs, `{rounded.lg}` (12px) for content + product cards, `{rounded.xl}` (16px) for hero containers, `{rounded.pill}` for badges.
- Section rhythm `{spacing.section}` (96px) — modern-SaaS standard. Internal card padding stays generous at `{spacing.xl}` (32px).

## Colors

### Brand & Accent
- **Brand Blue** (`{colors.brand-blue}` — #3871C2): Main brand color from the logo. Used for primary buttons, links, and key interactive elements.
- **Golden Yellow** (`{colors.golden-yellow}` — #FEBD59): Warm accent from the logo. Used for highlights, featured elements, and warmth.
- **Red-Orange** (`{colors.red-orange}` — #F04623): Energetic accent from the logo. Used for attention-grabbing CTAs and energy.
- **Light Blue** (`{colors.light-blue}` — #86CEE7): Soft accent from the logo. Used for secondary highlights and variety.
- **Medium Blue** (`{colors.medium-blue}` — #69ABDF): Supporting blue from the logo. Used for secondary UI elements and depth.
- **Brand Gradient**: Linear gradient (135deg) combining brand blue, medium blue, light blue, golden yellow, and red-orange. Used for hero sections and featured elements.

### Surface
- **White** (`{colors.white}` — #FFFFFF): The default page floor. Pure white for maximum contrast and professional appearance.
- **Soft Pink** (`{colors.soft-pink}` — #EFC2BC): Section dividers, subtle highlights, and warm accents.
- **Charcoal** (`{colors.charcoal}` — #393536): Code editor mockups, featured sections, footer. The dominant dark surface.
- **Tan** (`{colors.tan}` — #CC9E8F): Earth tone accent for variety and warmth.
- **Brown** (`{colors.brown}` — #9C614F): Deep accent for emphasis and hierarchy.

### Text
- **Charcoal** (`{colors.charcoal}` — #393536): All headlines and primary text. Deep charcoal for excellent readability on white backgrounds.
- **White** (`{colors.white}` — #FFFFFF): Text on dark surfaces and brand blue backgrounds. Maximum contrast for readability.

### Semantic
- **Success** (`{colors.success}` — #10B981): Green status dots, "available" indicators, success states.
- **Warning** (`{colors.warning}` — #F59E0B): Warning callouts, caution states.
- **Error** (`{colors.error}` — #EF4444): Validation errors, danger states.
- **Info** (`{colors.info}` — #3871C2): Informational states, info messages (uses brand blue).

## Typography

### Font Family
The system uses **Inter** as the primary typeface for headlines, body, navigation, and UI labels. **JetBrains Mono** handles code blocks. The fallback stack uses `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` for maximum compatibility.

The typography system is modern and consistent:
- Inter (weight 600-700 for display, 400-600 for body) → h1, h2, h3, body, navigation, buttons
- JetBrains Mono → all code blocks and terminal text

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 64px | 400 | 1.05 | -1.5px | Homepage h1 ("Meet your thinking partner") — Copernicus serif |
| `{typography.display-lg}` | 48px | 400 | 1.1 | -1px | Section heads — Copernicus |
| `{typography.display-md}` | 36px | 400 | 1.15 | -0.5px | Sub-section heads, model names — Copernicus |
| `{typography.display-sm}` | 28px | 400 | 1.2 | -0.3px | Pricing tier names, callout headlines — Copernicus |
| `{typography.title-lg}` | 22px | 500 | 1.3 | 0 | Pricing plan size labels — StyreneB |
| `{typography.title-md}` | 18px | 500 | 1.4 | 0 | Feature card titles, intro paragraphs |
| `{typography.title-sm}` | 16px | 500 | 1.4 | 0 | Connector tile titles, list labels |
| `{typography.body-md}` | 16px | 400 | 1.55 | 0 | Default running-text — StyreneB |
| `{typography.body-sm}` | 14px | 400 | 1.55 | 0 | Footer body, fine-print |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | Badge labels, captions |
| `{typography.caption-uppercase}` | 12px | 500 | 1.4 | 1.5px | Category tags, "NEW" badges |
| `{typography.code}` | 14px | 400 | 1.6 | 0 | Code blocks — JetBrains Mono |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | Standard button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu items |

### Principles
Display sizes use weight 400 (regular), never bold. Negative letter-spacing (-0.3 to -1.5px) is essential — Copernicus without it reads as off-brand. The serif character is what gives Anthropic its literary, considered voice; switching to a sans-serif display would make Claude feel like every other AI tool.

Body type stays at weight 400 for paragraphs, weight 500 for labels and emphasized phrases. The sans body is humanist (StyreneB) — never geometric. Inter is an acceptable substitute because of its similar humanist proportions; Helvetica or Arial would be too neutral and break the warm-editorial feel.

### Note on Font Substitutes
If Copernicus / Tiempos Headline is unavailable, **Cormorant Garamond** at weight 500 with -0.02em letter-spacing is the closest open-source approximation. **EB Garamond** is a fallback. For StyreneB, **Inter** is the closest match — both are humanist sans designed for screen reading. **Söhne** is another close alternative if licensed.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px) — modern-SaaS rhythm.
- **Card internal padding:** `{spacing.xl}` (32px) for feature cards, pricing tier cards, model comparison cards; `{spacing.lg}` (24px) for code-window cards and connector tiles.
- **Callout / CTA bands:** `{spacing.xxl}` (48px) inside coral callout cards; 64px inside the larger dark CTA band.

### Grid & Container
- **Max content width:** ~1200px centered.
- **Editorial body:** Single 12-column grid; hero often uses 6/6 split (h1 left, illustration right).
- **Feature card grids:** 3-up at desktop, 2-up at tablet, 1-up at mobile.
- **Connector tile grids:** 4-up or 6-up at desktop, 2-up at tablet, 1-up at mobile.
- **Pricing grid:** 3-up at desktop (Free / Pro / Team / Enterprise often), 1-up at mobile.

### Whitespace Philosophy
The cream canvas + serif display + generous internal padding create an editorial pacing — Claude reads like a long-form magazine column rather than a marketing template. Whitespace between bands stays uniform at 96px; whitespace inside cards is generous (32px), letting type breathe.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, top nav, hero bands |
| Soft hairline | 1px `{colors.hairline}` border | Inputs, sub-nav, occasionally on cards |
| Cream card | `{colors.surface-card}` background — no shadow | Feature cards, content cards |
| Dark surface card | `{colors.surface-dark}` background — no shadow | Code editor mockups, model showcase cards |
| Subtle drop shadow | Faint shadow at low alpha | Hover-elevated states (the system uses `0 1px 3px rgba(20,20,19,0.08)` rarely) |

The elevation philosophy is **color-block first, shadow rare**. Most depth comes from the cream-vs-dark surface contrast. Shadows are minimal. The dark surface mockups have their own internal product chrome (code editor scrollbars, line numbers, syntax highlighting) which adds detail without needing external shadows.

### Decorative Depth
- The Anthropic spike-mark glyph (4-spoke radial asterisk) appears as a small black mark in the brand wordmark and inline as a content marker.
- Code editor mockups carry their own internal depth: syntax-highlighted text in muted blues / oranges / grays, line numbers in `{colors.muted-soft}`, status bars at the bottom in `{colors.surface-dark-elevated}`.
- Some hero illustrations use simple line-art with coral and dark-navy strokes on cream — minimal, hand-drawn-feeling, never photorealistic.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Reserved for badge accents and tiny dropdowns |
| `{rounded.sm}` | 6px | Small inline buttons, dropdown items |
| `{rounded.md}` | 8px | Standard CTA buttons, text inputs, category tabs |
| `{rounded.lg}` | 12px | Content cards (feature, pricing, code-window, model-comparison) |
| `{rounded.xl}` | 16px | Hero illustration container, the larger marquee components |
| `{rounded.pill}` | 9999px | Badge pills, "NEW" tags |
| `{rounded.full}` | 9999px / 50% | Avatar substitutes, icon buttons |

### Photography & Illustrations
Claude's hero rarely uses photography. Instead it uses:
- Simple line-art illustrations with coral + dark-navy strokes on the cream canvas
- Code editor mockups (the dominant "hero" treatment on developer-focused pages)
- Terminal output mockups with monospace text on dark
- Model comparison cards (Opus / Sonnet / Haiku) with abstract geometric thumbnails

When photography is used (rare — mostly testimonials), avatars crop to perfect circles at 40px diameter.

## Components

### Top Navigation

**`top-nav`** — Cream nav bar pinned to the top of every page. 64px tall, `{colors.canvas}` background. Carries the Anthropic spike-mark + "Claude" wordmark at left, primary horizontal menu (Product, Solutions, Use Cases, Pricing, Research, Company) center-left, right-side cluster with "Sign in" text-link, "Try Claude" `{component.button-primary}` (coral). Menu items in `{typography.nav-link}` (StyreneB 14px / 500).

### Buttons

**`button-primary`** — The signature coral CTA. Background `{colors.primary}` (#cc785c), text `{colors.on-primary}` (white), type `{typography.button}` (StyreneB 14px / 500), padding 12px × 20px, height 40px, rounded `{rounded.md}` (8px). Active state `button-primary-active` darkens to `{colors.primary-active}` (#a9583e).

**`button-secondary`** — Cream button with hairline outline. Background `{colors.canvas}`, text `{colors.ink}`, 1px hairline border, same padding + height + radius as primary.

**`button-secondary-on-dark`** — Used over `{colors.surface-dark}` cards. Background `{colors.surface-dark-elevated}` (#252320), text `{colors.on-dark}`. Stays dark — the system never inverts to a light secondary on dark surfaces.

**`button-text-link`** — Inline text button, no background. Used for "Sign in" in the top nav and inline CTA links.

**`button-icon-circular`** — 36px circular icon button. Background `{colors.canvas}`, hairline border, ink-color icon. Used for carousel arrows, share, "view more".

**`text-link`** — Inline body links in `{colors.primary}` (the coral). Underlined on press; the coral inline link is one of the system's most distinctive small details.

### Cards & Containers

**`hero-band`** — Cream-canvas hero with a 6-6 grid: h1 + sub-headline + button row on the left, hero illustration card or product mockup card on the right. Vertical padding `{spacing.section}` (96px).

**`hero-illustration-card`** — A larger card holding the hero's right-side artifact — sometimes a coral-stroke line illustration on cream background, sometimes a dark code editor mockup. Background `{colors.canvas}` or `{colors.surface-dark}` depending on context, rounded `{rounded.xl}` (16px).

**`feature-card`** — Used in 3-up feature grids. Background `{colors.surface-card}` (#efe9de — slightly darker cream), rounded `{rounded.lg}` (12px), internal padding `{spacing.xl}` (32px). Carries a small icon at top, an `{typography.title-md}` headline, and a body description in `{typography.body-md}`.

**`product-mockup-card-dark`** — Dark navy card showing actual Claude product chrome (chat interface, code editor, agent controls). Background `{colors.surface-dark}`, rounded `{rounded.lg}`, internal padding `{spacing.xl}` (32px). Carries text labels in `{colors.on-dark}` and product UI fragments below.

**`code-window-card`** — A specialized dark card showing a code editor with line numbers, syntax-highlighted code in `{typography.code}` (JetBrains Mono), and sometimes a "Run" button or terminal output panel below. Background `{colors.surface-dark}` with `{colors.surface-dark-soft}` for the inner code block, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px). The signature visual element of Claude Code product pages.

**`model-comparison-card`** — Used on the homepage's "Which problem are you up against?" section comparing Opus / Sonnet / Haiku. Background `{colors.canvas}` with hairline border, rounded `{rounded.lg}`, internal padding `{spacing.xl}` (32px). Carries the model name, a short capability blurb, and a `{component.text-link}` to learn more.

**`pricing-tier-card`** — Standard tier card. Background `{colors.canvas}` with hairline border, rounded `{rounded.lg}`, padding `{spacing.xl}` (32px). Carries the plan name in `{typography.title-lg}` (StyreneB), price in `{typography.display-sm}` (Copernicus serif!), feature checklist in `{typography.body-md}`, and a `{component.button-primary}` at the bottom.

**`pricing-tier-card-featured`** — The featured tier (typically "Pro" or "Team"). Background flips to `{colors.surface-dark}`, text inverts to `{colors.on-dark}`. The dark surface IS the featured-tier signal.

**`callout-card-coral`** — A full-bleed coral card carrying a major call-to-action. Background `{colors.primary}` (#cc785c), text `{colors.on-primary}` (white), rounded `{rounded.lg}`, padding `{spacing.xxl}` (48px). The coral surface IS the voltage; the CTA inside uses an inverted button style (cream/canvas button on coral).

**`connector-tile`** — Used on the connectors page's integration grid. Background `{colors.canvas}` with hairline border, rounded `{rounded.lg}`, padding 20px. Each tile carries a logo at top, a `{typography.title-sm}` connector name, and a short description.

### Inputs & Forms

**`text-input`** — Standard text input. Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.md}` (8px), padding 10px × 14px, height 40px. 1px hairline border in `{colors.hairline}`.

**`text-input-focused`** — Focus state. Border thickens or shifts to `{colors.primary}` (coral) for emphasis. Carries a 3px coral-at-15%-alpha outer ring.

**`cookie-consent-card`** — Bottom-right floating dark cookie banner. Background `{colors.surface-dark}`, text `{colors.on-dark}`, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px). One of the few places dark surface appears at small scale on cream pages.

### Tags / Badges

**`badge-pill`** — Small pill label used for category tags. Background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.caption}` (13px / 500), rounded `{rounded.pill}`, padding 4px × 12px.

**`badge-coral`** — Coral-fill badge for "NEW", "BETA", featured highlights. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.caption-uppercase}` (12px / 500 / 1.5px tracking), rounded `{rounded.pill}`, padding 4px × 12px.

### Tab / Filter

**`category-tab`** + **`category-tab-active`** — Used in sub-nav rows on solutions / connectors pages. Inactive: transparent background, `{colors.muted}` text. Active: `{colors.surface-card}` background, `{colors.ink}` text. Padding 8px × 14px, rounded `{rounded.md}`.

### CTA / Footer

**`cta-band-coral`** — A pre-footer "Try Claude" CTA card. Full-width coral fill, white type, rounded `{rounded.lg}`, padding 64px. Carries an h2 in `{typography.display-sm}` (still serif!), a sub-line, and a cream-button CTA.

**`cta-band-dark`** — Alternative pre-footer band on developer-focused pages. Background `{colors.surface-dark}`, text `{colors.on-dark}`, rounded `{rounded.lg}`, padding 64px. Often pairs with a code-window card.

**`footer`** — Dark navy footer that closes every page. Background `{colors.surface-dark}` (#181715), text `{colors.on-dark-soft}`. 4-column link list at desktop covering Product / Company / Resources / Legal. Vertical padding 64px. The Anthropic spike-mark + "Anthropic" wordmark sits at the top in `{colors.on-dark}`. The footer never inverts.

## Do's and Don'ts

### Do
- Anchor every page on the cream canvas. Pure white reads as "any other AI tool"; the warm tint is the brand differentiator.
- Use Copernicus serif for every display headline. Pair with StyreneB sans body. Negative letter-spacing on display sizes is non-negotiable.
- Reserve `{colors.primary}` (coral) for primary CTAs and full-bleed `{component.callout-card-coral}` moments. Don't paint accent moments coral elsewhere.
- Use `{component.product-mockup-card-dark}` and `{component.code-window-card}` to show actual Claude product chrome. Don't paint marketing illustrations of code when you can show real code.
- Pair `{component.feature-card}` (cream) with `{component.product-mockup-card-dark}` (navy) in alternating bands. The cream-to-dark rhythm is the brand's pacing mechanism.
- Use the Anthropic spike-mark glyph as the brand wordmark prefix. Never invert the mark to white-on-dark within the wordmark itself.
- Apply `{spacing.section}` (96px) between major bands.

### Don't
- Don't use cool grays or pure white for canvas. Cream is the brand.
- Don't bold serif display weight. Copernicus at 700 reads as bombastic; the system stays at 400.
- Don't use cool blue or saturated cyan as a brand accent. The coral is the brand voltage.
- Don't put coral everywhere. The coral is scarce on individual elements and generous only on full-bleed coral callout cards.
- Don't use Inter for display headlines. The serif character is the brand voice.
- Don't repeat the same surface mode in two consecutive bands. The pacing alternates: cream → cream-card → dark-mockup → cream → coral-callout → dark-footer.
- Don't add hover state styling beyond what the system already encodes — primary darkens on press; nothing else changes.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 64→32px; hero-illustration-card stacks below content; feature grids 1-up; connector tiles 2-up; pricing 1-up; footer 4 cols → 1 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens; feature cards 2-up; connector tiles 3-up; pricing 2-up |
| Desktop | 1024–1440px | Full top-nav with all menu items; 3-up feature cards; 4-up or 6-up connector tiles; 3-up pricing tiers |
| Wide | > 1440px | Same as desktop with more outer breathing room; max content width caps at 1200px |

### Touch Targets
- `{component.button-primary}` at minimum 40 × 40px.
- `{component.button-icon-circular}` at exactly 36 × 36 — slightly under WCAG 44 but visually centered.
- `{component.text-input}` height is 40px.
- Connector tile entire card area is tappable; effective tap area >> 44px.

### Collapsing Strategy
- Top nav collapses to hamburger at < 768px; menu opens as a full-screen cream sheet.
- Hero band's 6-6 grid collapses to single-column on mobile — h1 + sub-head + buttons first, then the illustration / mockup card below.
- Feature grids reduce columns rather than scaling cards down.
- Pricing tier cards collapse 4 → 2 → 1; featured-tier dark surface stays visually distinct at every breakpoint.
- Code-window cards retain code legibility at every breakpoint by allowing horizontal scroll within the card rather than wrapping code lines.

### Image Behavior
- Code blocks inside dark mockups stay at fixed font-size; horizontal scroll on mobile rather than wrapping.
- Hero illustrations scale proportionally; line-art strokes thin slightly on mobile.
- Avatar photos in testimonials crop to circles at every breakpoint.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key (`{component.feature-card}`, `{component.code-window-card}`).
2. Variants of an existing component (`-active`, `-disabled`, `-focused`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover. Default and Active/Pressed states only.
5. Display headlines stay Copernicus serif 400 with negative tracking. Body stays StyreneB / Inter 400. The split is unbreakable.
6. Cream + coral + dark navy is the trinity. Don't introduce a fourth surface tone (no purple cards, no green sections).
7. When in doubt about emphasis: bigger Copernicus serif before bolder weight.
8. **Implementation**: Use Tailwind utility classes that map to design tokens. Extend shadcn/ui components with custom variants for this design system.
9. **Component Development**: Start with shadcn/ui primitives and customize with Tailwind classes to match design specifications.
10. **Responsive Design**: Use Tailwind's responsive prefixes (`md:`, `lg:`, `xl:`) to implement breakpoint-specific behaviors.

## Known Gaps

- Copernicus and StyreneB are licensed Anthropic typefaces and not available as public web fonts. Substitutes (Tiempos Headline / Cormorant Garamond / EB Garamond for serif; Inter / Söhne for sans) are documented in the typography section.
- The Anthropic radial-spike-mark is a brand glyph rendered as inline SVG; it's not formalized as a system token here. Treat it as a logo asset.
- Animation and transition timings (chat message reveal, code block typewriter effect on the homepage, agentic-flow diagram animations) are not in scope.
- Form validation states beyond `{component.text-input-focused}` are not extracted — error / success states would need a sign-up or feedback flow to confirm.
- The actual Claude product surface (claude.ai chat interface) shares some tokens with the marketing site but adds many product-specific components (chat bubbles, message tools, file upload chips, conversation history sidebar) that are out of scope for this marketing-surface document.
- The "agent" / "computer use" demo cards on certain pages display animated Claude controlling a browser — the static screenshot doesn't fully capture the animation chrome.
