import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  normalizeProfileDisplayName,
  PROFILE_DISPLAY_NAME_MAX_LENGTH,
  ProfileDomainError,
} from "../src/lib/profiles/model";

assert.equal(normalizeProfileDisplayName("  Maya Santos  "), "Maya Santos");
assert.equal(
  normalizeProfileDisplayName("A".repeat(PROFILE_DISPLAY_NAME_MAX_LENGTH)),
  "A".repeat(PROFILE_DISPLAY_NAME_MAX_LENGTH),
);
assert.throws(() => normalizeProfileDisplayName(null), ProfileDomainError);
assert.throws(() => normalizeProfileDisplayName("   "), ProfileDomainError);
assert.throws(
  () =>
    normalizeProfileDisplayName(
      "A".repeat(PROFILE_DISPLAY_NAME_MAX_LENGTH + 1),
    ),
  ProfileDomainError,
);

const actions = readFileSync(
  new URL("../src/app/profile/actions.ts", import.meta.url),
  "utf8",
);
const profilePage = readFileSync(
  new URL("../src/app/profile/page.tsx", import.meta.url),
  "utf8",
);
const settingsPage = readFileSync(
  new URL("../src/app/settings/page.tsx", import.meta.url),
  "utf8",
);
const profilePanel = readFileSync(
  new URL("../src/components/account/profile-panel.tsx", import.meta.url),
  "utf8",
);
const proxy = readFileSync(
  new URL("../src/lib/supabase/proxy.ts", import.meta.url),
  "utf8",
);

assert.match(actions, /^"use server";/);
assert.ok(
  actions.indexOf("const context = await getAuthenticatedContext") <
    actions.indexOf("await updateProfileDisplayName"),
  "the mutation must authenticate before updating a profile",
);
assert.match(profilePage, /redirect\("\/login\?next=%2Fprofile"\)/);
assert.match(settingsPage, /redirect\("\/login\?next=%2Fsettings"\)/);
assert.match(profilePanel, /aria-describedby=/);
assert.match(profilePanel, /disabled=\{pending\}/);
assert.match(
  profilePanel,
  /role=\{state\.status === "error" \? "alert" : "status"\}/,
);
assert.match(proxy, /"\/profile"/);
assert.match(proxy, /"\/settings"/);

process.stdout.write(
  "Account-profile verification passed: normalization boundaries, authenticated mutation ordering, protected routes, and accessible feedback contracts.\n",
);
