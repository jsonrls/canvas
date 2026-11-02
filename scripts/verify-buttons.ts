import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import { Button, ButtonControl, IconButton } from "../src/components/ui/button";

const anchor = renderToStaticMarkup(
  createElement(Button, { label: "Rooms", href: "/rooms" }),
);
assert.match(anchor, /^<a /);
assert.match(anchor, /href="\/rooms"/);
assert.match(anchor, /data-qollab-button=""/);

const submit = renderToStaticMarkup(
  createElement(Button, { label: "Save", type: "submit", disabled: true }),
);
assert.match(submit, /type="submit"/);
assert.match(submit, /disabled=""/);
assert.doesNotMatch(submit, /aria-busy="true"|astryx-spinner/);

const loading = renderToStaticMarkup(
  createElement(Button, { label: "Save", isLoading: true }),
);
assert.match(loading, /aria-busy="true"/);
assert.match(loading, /disabled=""/);
assert.equal(loading.match(/astryx-spinner/g)?.length, 1);

const icon = renderToStaticMarkup(
  createElement(IconButton, {
    label: "Close panel",
    icon: createElement("svg", { "aria-hidden": true }),
  }),
);
assert.match(icon, /aria-label="Close panel"/);

const native = renderToStaticMarkup(
  createElement(
    ButtonControl,
    {
      "aria-busy": true,
      "aria-pressed": true,
      disabled: false,
      type: "submit",
      form: "editor",
      formAction: "/save",
      name: "action",
      value: "save",
      size: "compact",
    },
    "Save changes",
  ),
);
for (const attribute of [
  'aria-busy="true"',
  'aria-pressed="true"',
  'type="submit"',
  'form="editor"',
  'formAction="/save"',
  'name="action"',
  'value="save"',
  'data-size="sm"',
]) {
  assert.ok(
    native.includes(attribute),
    `Missing native attribute ${attribute}`,
  );
}
assert.doesNotMatch(native, /disabled=|aria-label=|astryx-spinner/);
assert.match(native, /class="astryx-button secondary sm /);
assert.match(native, />Save changes<\/button>$/);

const custom = renderToStaticMarkup(
  createElement(
    ButtonControl,
    { variant: "custom", disabled: true, className: "answer-card" },
    createElement("strong", null, "Answer"),
  ),
);
assert.match(custom, /disabled=""/);
assert.match(custom, /answer-card/);
assert.match(custom, /<strong>Answer<\/strong>/);
assert.doesNotMatch(custom, /astryx-button|aria-label=|aria-busy=/);

const sourceRoot = join(process.cwd(), "src");
const violations: string[] = [];
let auditedFiles = 0;
function audit(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      audit(path);
      continue;
    }
    if (!/\.tsx?$/.test(entry.name)) continue;
    const name = relative(sourceRoot, path);
    if (name === "components/ui/button.tsx") continue;
    auditedFiles++;
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    function visit(node: ts.Node) {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        node.tagName.getText(source) === "button"
      ) {
        violations.push(`${name}: native button bypasses shared component`);
      }
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const importPath = node.moduleSpecifier.text;
        const bindings = node.importClause?.namedBindings;
        if (
          /^@astryxdesign\/core\/(Button|IconButton)(\/|$)/.test(importPath) ||
          (importPath === "@astryxdesign/core" &&
            bindings &&
            ts.isNamedImports(bindings) &&
            bindings.elements.some((binding) =>
              ["Button", "IconButton"].includes(
                (binding.propertyName ?? binding.name).text,
              ),
            ))
        ) {
          violations.push(`${name}: direct Astryx button import`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
audit(sourceRoot);
assert.deepEqual(violations, [], violations.join("\n"));
console.log(`Button semantics passed; ${auditedFiles} source files audited.`);
