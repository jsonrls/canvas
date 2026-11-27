"use client";

import { useEffect } from "react";

/** The moods the sign-in drawing knows; styled by `.auth-*` in landing.css. */
type Mood = "idle" | "email" | "invalid" | "valid" | "password" | "peek";

/** How long the visitor must pause before a half-typed email counts as wrong. */
const SETTLE_MS = 700;

/**
 * Stricter than the browser's own check, which accepts `name@gmailcom`: the
 * domain needs a dot and an ending of two or more characters.
 */
const EMAIL_FORMAT = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

function isPasswordField(input: HTMLInputElement): boolean {
  return input.autocomplete.includes("password");
}

/**
 * Watches the form inside the auth card and names its mood in `data-mood` on
 * the card, so the drawing beside it can react: eyes follow typing, a wrong
 * email format gets a gasp, and a password field gets covered eyes. It checks
 * the email's format and the password field's type; it never reads the
 * password, keeps nothing and renders nothing.
 */
export function AuthMood(): null {
  useEffect(() => {
    const card = document.querySelector<HTMLElement>("[data-mood]");
    if (!card) return;
    let settleTimer = 0;

    const set = (mood: Mood): void => {
      card.dataset.mood = mood;
    };
    const emailMood = (input: HTMLInputElement): Mood => {
      if (input.value === "") return "email";
      return EMAIL_FORMAT.test(input.value.trim()) ? "valid" : "invalid";
    };
    /** The password field a show/hide button controls, if `target` is one. */
    const controlledField = (
      target: EventTarget | null,
    ): HTMLInputElement | null => {
      // The click can land on the button's icon, which is an SVG element.
      if (!(target instanceof Element)) return null;
      const id = target
        .closest("[aria-controls]")
        ?.getAttribute("aria-controls");
      const field = id ? document.getElementById(id) : null;
      return field instanceof HTMLInputElement ? field : null;
    };
    const passwordMood = (input: HTMLInputElement): Mood =>
      input.type === "password" ? "password" : "peek";

    const attend = (target: EventTarget | null, isTyping: boolean): void => {
      window.clearTimeout(settleTimer);
      const toggled = controlledField(target);
      if (toggled) return set(passwordMood(toggled));
      if (!(target instanceof HTMLInputElement) || target.type === "hidden") {
        return;
      }
      if (isPasswordField(target)) return set(passwordMood(target));
      if (target.type !== "email") return set("email");
      if (!isTyping) return set(emailMood(target));
      // Every email is the wrong format until it is finished, so wait for a pause.
      set("email");
      settleTimer = window.setTimeout(() => set(emailMood(target)), SETTLE_MS);
    };

    const onFocusIn = (event: FocusEvent): void => attend(event.target, false);
    const onInput = (event: Event): void => attend(event.target, true);
    const onFocusOut = (event: FocusEvent): void => {
      if (
        event.relatedTarget instanceof Node &&
        card.contains(event.relatedTarget)
      ) {
        return;
      }
      window.clearTimeout(settleTimer);
      // A wrong email stays flagged after leaving the field, until it is fixed.
      const email = card.querySelector<HTMLInputElement>('input[type="email"]');
      set(email && emailMood(email) === "invalid" ? "invalid" : "idle");
    };
    // The show/hide button changes the field's type after React re-renders.
    const onClick = (event: MouseEvent): void => {
      const toggled = controlledField(event.target);
      if (toggled) requestAnimationFrame(() => set(passwordMood(toggled)));
    };

    card.addEventListener("focusin", onFocusIn);
    card.addEventListener("focusout", onFocusOut);
    card.addEventListener("input", onInput);
    card.addEventListener("click", onClick);
    return () => {
      window.clearTimeout(settleTimer);
      card.removeEventListener("focusin", onFocusIn);
      card.removeEventListener("focusout", onFocusOut);
      card.removeEventListener("input", onInput);
      card.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
