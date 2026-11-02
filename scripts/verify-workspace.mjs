import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";

// Generated copies are usually introduced by a filesystem sync/copy operation.
// Report them rather than silently deleting files or masking compiler errors.
const generatedDirectories = [
  ".next/types",
  ".next/dev/types",
  "theme/generated",
];
const duplicates = [];

for (const directory of generatedDirectories) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    },
  );
  for (const entry of entries) {
    if (entry.isFile() && / \d+\.(?:ts|js|css)$/.test(entry.name)) {
      duplicates.push(`${directory}/${entry.name}`);
    }
  }
}

assert.deepEqual(
  duplicates,
  [],
  `Duplicate generated files found. Preserve any needed copies outside the project, then regenerate the canonical outputs:\n${duplicates.join("\n")}`,
);

const privatePaths = [
  "capacity-results/browser-account.json",
  "capacity-results/test-state.json",
  "supabase/.temp/cli-latest",
  ".env.production",
];
const ignored = execFileSync("git", ["check-ignore", "--", ...privatePaths], {
  encoding: "utf8",
})
  .trim()
  .split("\n");
assert.deepEqual(ignored, privatePaths, "Local runtime data must be ignored.");

const tracked = execFileSync(
  "git",
  ["ls-files", "--", "capacity-results/", "supabase/.temp/"],
  { encoding: "utf8" },
).trim();
assert.equal(
  tracked,
  "",
  "Local test credentials and CLI state must not be tracked.",
);

console.log(
  "Workspace hygiene verified: canonical generated files and private local artifacts.",
);
