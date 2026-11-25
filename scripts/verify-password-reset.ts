import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildRecoveryRedirectUrl,
  normalizeResetEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  readNewPassword,
} from "../src/lib/auth/password-reset";
import { buildConfirmUrl, safeNextPath } from "../src/lib/auth/redirects";

assert.equal(normalizeResetEmail(null), null);
assert.equal(normalizeResetEmail("not-an-email"), null);
assert.equal(
  normalizeResetEmail("  Study.Partner@Example.COM "),
  "study.partner@example.com",
);

assert.deepEqual(readNewPassword("short", "short"), {
  error: `Use between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters for your new password.`,
  password: null,
});
assert.deepEqual(readNewPassword("a-secure-password", "different-password"), {
  error: "The password confirmation does not match.",
  password: null,
});
assert.deepEqual(readNewPassword("a-secure-password", "a-secure-password"), {
  error: null,
  password: "a-secure-password",
});

const redirectUrl = new URL(
  buildRecoveryRedirectUrl("https://canvas.example.com/ignored?unsafe=true"),
);
assert.equal(redirectUrl.origin, "https://canvas.example.com");
assert.equal(redirectUrl.pathname, "/auth/confirm");
assert.equal(redirectUrl.searchParams.get("next"), "/reset-password/update");
assert.equal(redirectUrl.searchParams.size, 1);
assert.throws(() => buildRecoveryRedirectUrl("javascript:alert(1)"));

assert.equal(
  buildConfirmUrl("https://canvas.example.com/", "/rooms/a?tool=pdf"),
  "https://canvas.example.com/auth/confirm?next=%2Frooms%2Fa%3Ftool%3Dpdf",
);
assert.equal(safeNextPath("/rooms/a?tool=pdf"), "/rooms/a?tool=pdf");
for (const unsafe of [
  null,
  "",
  "rooms",
  "//evil.example",
  "/\\evil.example",
  "/\t/evil.example",
  "https://evil.example",
]) {
  assert.equal(safeNextPath(unsafe), "/rooms");
}

// A token hash works in any browser; a PKCE code only works where it was requested.
for (const [template, type] of [
  ["confirmation", "email"],
  ["recovery", "recovery"],
]) {
  const html = readFileSync(
    new URL(`../supabase/templates/${template}.html`, import.meta.url),
    "utf8",
  );
  assert.ok(
    html.includes(
      `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=${type}"`,
    ),
  );
  assert.doesNotMatch(html, /ConfirmationURL/);
}

const actions = readFileSync(
  new URL("../src/app/reset-password/actions.ts", import.meta.url),
  "utf8",
);
const requestForm = readFileSync(
  new URL("../src/app/reset-password/reset-password-form.tsx", import.meta.url),
  "utf8",
);
const updateForm = readFileSync(
  new URL(
    "../src/app/reset-password/update/update-password-form.tsx",
    import.meta.url,
  ),
  "utf8",
);
const callbackRoute = readFileSync(
  new URL("../src/app/auth/confirm/route.ts", import.meta.url),
  "utf8",
);
const loginForm = readFileSync(
  new URL("../src/app/login/login-form.tsx", import.meta.url),
  "utf8",
);

assert.match(actions, /^"use server";/);
assert.doesNotMatch(actions, /^export\s+(?:const|let|var|class|interface)\s/m);
assert.ok(
  actions.indexOf("auth.getClaims()") < actions.indexOf("auth.updateUser"),
);
assert.match(actions, /If a Qollab account uses that email/);
assert.match(requestForm, /autoComplete="email"/);
assert.match(requestForm, /role="alert"/);
assert.match(requestForm, /useSuccessToast\(state\)/);
assert.match(updateForm, /autoComplete="new-password"/);
assert.match(updateForm, /aria-pressed=\{showPasswords\}/);
assert.match(updateForm, /(?:disabled|isDisabled)=\{pending\}/);
assert.match(callbackRoute, /type === "recovery"/);
assert.match(callbackRoute, /error=invalid_or_expired/);
assert.match(loginForm, /href="\/reset-password"/);
const settingsDialog = readFileSync(
  new URL(
    "../src/components/account/password-reset-dialog.tsx",
    import.meta.url,
  ),
  "utf8",
);
assert.match(settingsDialog, /requestPasswordReset\(/);
assert.match(settingsDialog, /role="alert"/);

process.stdout.write(
  "Password-reset verification passed: validation, safe callback construction, trusted update ordering, accessible form contracts, recovery failure routing, and login entry.\n",
);
