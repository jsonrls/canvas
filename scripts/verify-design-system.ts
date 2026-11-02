import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import postcss from "postcss";
import ts from "typescript";

// Bounded policy for the newly composed frame. Legacy renderer declarations
// are checked for selector containment, not retroactively certified as token-only.
const sources = [
  ...readdirSync("src/components/shell")
    .filter((name) => name.endsWith(".tsx"))
    .map((name) => `src/components/shell/${name}`),
  "src/components/collaboration/breakout-room-workspace.tsx",
  "src/components/collaboration/breakout-qa-panel.tsx",
];
for (const path of sources) {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      assert.ok(
        !["div", "span", "main"].includes(node.tagName.getText(source)),
        `${path}: use Astryx frame/layout primitives`,
      );
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) continue;
        const name = attribute.name.getText(source);
        assert.notEqual(
          name,
          "style",
          `${path}: new shell layout must use props/tokens`,
        );
        if (name === "className" && attribute.initializer) {
          assert.doesNotMatch(
            attribute.initializer.getText(source),
            /\[[^\]]*(?:#[0-9a-f]{3,8}|\d+(?:px|rem|vh|vw))[^\]]*\]/i,
            `${path}: arbitrary layout values`,
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const globalsPath = resolve("src/app/globals.css");
const globals = postcss.parse(readFileSync(globalsPath, "utf8"));
const features: string[] = [];
globals.walkAtRules("import", (rule) => {
  const path = rule.params.match(/^"([^"]+)"/)?.[1];
  if (path?.startsWith(".") && !path.includes("theme/generated"))
    features.push(resolve(dirname(globalsPath), path));
});
assert.ok(
  features.length > 0,
  "Feature compatibility styles must be explicit imports",
);
globals.walkRules((rule) => {
  for (const selector of postcss.list.comma(rule.selector)) {
    assert.ok(
      !/\.[a-zA-Z_-]/.test(selector) ||
        [".sr-only", ".visually-hidden"].includes(selector),
      `Feature selector leaked into globals: ${selector}`,
    );
  }
});
for (const path of features) {
  const css = postcss.parse(readFileSync(path, "utf8"));
  css.walkRules((rule) => {
    if (
      rule.parent?.type === "atrule" &&
      rule.parent.name.endsWith("keyframes")
    )
      return;
    for (const selector of postcss.list.comma(rule.selector)) {
      assert.match(
        selector,
        /\.[a-zA-Z_][\w-]*/,
        `${path}: compatibility selector must target a feature class`,
      );
      assert.doesNotMatch(
        selector,
        /^:root\b/,
        `${path}: theme values belong in the theme`,
      );
    }
  });
}
console.log(
  `Design policy verified for ${sources.length} new frame components and ${features.length} feature stylesheets. This is a structural check, not global design or browser accessibility certification.`,
);
