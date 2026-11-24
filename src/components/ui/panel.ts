/**
 * Surfaces shared by the room directory, account and settings screens: a tonal
 * rounded panel that groups a section, and the white row that sits inside one.
 * Apply them through `className` on an Astryx stack.
 */
const PANEL = "w-full min-w-0 rounded-3xl p-4 md:p-5";

/** Neutral group. */
export const PANEL_MUTED = `${PANEL} bg-muted`;
/** Soft Blue group, for content that is informational or not yet the user's. */
export const PANEL_ACCENT = `${PANEL} bg-accent-muted`;
/** A record or control row inside a panel. */
export const PANEL_ROW = "w-full min-w-0 rounded-2xl bg-surface p-4";
/** Panel headings sit at body size; the page title is the only large type. */
export const PANEL_HEADING = "text-base!";
