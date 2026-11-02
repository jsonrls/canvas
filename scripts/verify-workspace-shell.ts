import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Y from "yjs";
import { QollabAppShell } from "../src/components/shell/qollab-app-shell";
import { QollabWorkspaceHeader } from "../src/components/shell/qollab-workspace-header";
import { QollabSideNavigation } from "../src/components/shell/qollab-side-navigation";
import { ResponsiveContextPanel } from "../src/components/shell/responsive-context-panel";
import { BreakoutQaPanel } from "../src/components/collaboration/breakout-qa-panel";

const panel = (isOpen: boolean) =>
  h(ResponsiveContextPanel, {
    presentation: "desktop",
    isOpen,
    onOpenChange: () => {},
    label: "Questions",
    children: "Question content",
    fillContent: true,
  });
const shell = renderToStaticMarkup(
  h(QollabAppShell, {
    isContentScrollable: false,
    header: h(QollabWorkspaceHeader, {
      label: "Workspace controls",
      startContent: "Room",
      endContent: "Actions",
    }),
    sideNavigation: h(QollabSideNavigation, {
      header: "Qollab",
      sections: [
        {
          id: "tools",
          title: "Workspace",
          items: [
            {
              id: "notes",
              label: "Shared notes",
              href: "/notes",
              isSelected: true,
            },
            { id: "parent", label: "Main room", href: "/rooms/example" },
          ],
        },
      ],
    }),
    contextPanel: panel(true),
    children: "Study tool",
  }),
);
assert.equal(
  (shell.match(/<main\b|role="main"/g) ?? []).length,
  1,
  "Shared shell owns exactly one main landmark",
);
assert.match(shell, /aria-label="Workspace controls"/);
assert.match(shell, /href="\/rooms\/example"/);
assert.match(shell, /role="complementary"/);
assert.match(shell, /360px/);
assert.match(shell, /56px/);
assert.equal(
  renderToStaticMarkup(panel(false)),
  "",
  "Closed desktop context reserves no rail",
);

const document = new Y.Doc();
const draft = "Keep this question across presenter remounts";
const renderDraft = (canAsk: boolean) =>
  renderToStaticMarkup(
    h(BreakoutQaPanel, {
      activeTool: "notes",
      canAsk,
      document,
      draft,
      onDraftChange: () => {},
      onClose: () => {},
      participantCount: 2,
      user: { id: "author", name: "Author", color: "blue" },
    }),
  );
const editable = renderDraft(true);
assert.match(editable, new RegExp(draft));
assert.match(editable, /aria-label="Close Q and A"/);
assert.match(editable, /type="submit"/);
assert.match(editable, /aria-live="polite"/);
assert.doesNotMatch(editable, /<main\b/);
const readonly = renderDraft(false);
assert.match(readonly, new RegExp(draft));
assert.match(readonly, /disabled=""/);
assert.match(readonly, /disabled viewer collaboration/);
document.destroy();
console.log(
  "Workspace shell SSR verified: one main, navigation, header and rail budgets, closed rail, controlled Q&A draft and read-only affordances. Browser resize, focus and scrolling require browser verification.",
);
