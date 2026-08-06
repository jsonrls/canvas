"use client";

import { Mark, mergeAttributes } from "@tiptap/core";
import type { Editor, JSONContent } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment, forwardRef, useEffect, useImperativeHandle } from "react";
import type { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import type { EditorDraft } from "@/lib/collaboration/conflict-review";
import type { EditorSnapshot } from "@/lib/version-history/types";

interface StudyUser {
  clientId: number;
  color: string;
  name: string;
}

interface RichTextEditorProps {
  document: Y.Doc;
  editable: boolean;
  provider: WebsocketProvider;
  syncLabel?: string;
  syncStatus?: string;
  user: StudyUser;
}

export interface RichTextEditorHandle {
  captureDraft: () => EditorDraft | null;
  captureSnapshot: () => EditorSnapshot | null;
  isFocused: () => boolean;
  restoreContent: (content: Record<string, unknown>) => boolean;
}

interface ToolbarAction {
  icon: LucideIcon;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
  label: string;
  run: (editor: Editor) => void;
}

const FontSize = Mark.create({
  name: "fontSize",
  inclusive: true,
  addAttributes() {
    return {
      size: {
        default: "11px",
        parseHTML: (element: HTMLElement) => element.style.fontSize || "11px",
        renderHTML: (attributes: { size?: string }) => ({
          style: `font-size: ${attributes.size ?? "11px"}`,
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*=font-size]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

const TOOLBAR_GROUPS: readonly (readonly ToolbarAction[])[] = [
  [
    {
      label: "Undo",
      icon: Undo2,
      run: (editor) => editor.chain().focus().undo().run(),
      isDisabled: (editor) => !editor.can().undo(),
    },
    {
      label: "Redo",
      icon: Redo2,
      run: (editor) => editor.chain().focus().redo().run(),
      isDisabled: (editor) => !editor.can().redo(),
    },
  ],
  [
    {
      label: "Bold",
      icon: Bold,
      run: (editor) => editor.chain().focus().toggleBold().run(),
      isActive: (editor) => editor.isActive("bold"),
    },
    {
      label: "Italic",
      icon: Italic,
      run: (editor) => editor.chain().focus().toggleItalic().run(),
      isActive: (editor) => editor.isActive("italic"),
    },
    {
      label: "Strike",
      icon: Strikethrough,
      run: (editor) => editor.chain().focus().toggleStrike().run(),
      isActive: (editor) => editor.isActive("strike"),
    },
    {
      label: "Inline code",
      icon: Code2,
      run: (editor) => editor.chain().focus().toggleCode().run(),
      isActive: (editor) => editor.isActive("code"),
    },
  ],
  [
    {
      label: "Heading",
      icon: Heading2,
      run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Bullet list",
      icon: List,
      run: (editor) => editor.chain().focus().toggleBulletList().run(),
      isActive: (editor) => editor.isActive("bulletList"),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      run: (editor) => editor.chain().focus().toggleOrderedList().run(),
      isActive: (editor) => editor.isActive("orderedList"),
    },
    {
      label: "Quote",
      icon: Quote,
      run: (editor) => editor.chain().focus().toggleBlockquote().run(),
      isActive: (editor) => editor.isActive("blockquote"),
    },
  ],
  [
    {
      label: "Clear formatting",
      icon: RemoveFormatting,
      run: (editor) =>
        editor.chain().focus().unsetAllMarks().clearNodes().run(),
    },
  ],
];

function FontSizeControl({
  editable,
  fontSize,
  applyFontSize,
}: {
  editable: boolean;
  fontSize: number;
  applyFontSize: (nextSize: number) => void;
}): React.ReactElement {
  return (
    <div className="toolbar-group toolbar-font-size" aria-label="Font size">
      <button
        type="button"
        className="toolbar-button toolbar-font-size__step"
        aria-label="Decrease font size"
        title="Decrease font size"
        onClick={() => applyFontSize(fontSize - 1)}
        disabled={!editable}
      >
        −
      </button>
      <input
        className="toolbar-font-size__value"
        aria-label="Font size in pixels"
        inputMode="numeric"
        type="number"
        min={8}
        max={72}
        value={fontSize}
        onChange={(event) => applyFontSize(Number(event.target.value) || 11)}
        onBlur={() => applyFontSize(fontSize)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        disabled={!editable}
      />
      <button
        type="button"
        className="toolbar-button toolbar-font-size__step"
        aria-label="Increase font size"
        title="Increase font size"
        onClick={() => applyFontSize(fontSize + 1)}
        disabled={!editable}
      >
        +
      </button>
    </div>
  );
}

function EditorToolbar({
  editor,
  editable,
  syncLabel,
  syncStatus,
}: {
  editor: Editor;
  editable: boolean;
  syncLabel?: string;
  syncStatus?: string;
}): React.ReactElement {
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      documentSize: currentEditor.state.doc.content.size,
      wordCount: currentEditor.getText().trim()
        ? currentEditor.getText().trim().split(/\s+/u).length
        : 0,
      fontSize: Number.parseInt(
        currentEditor.getAttributes("fontSize").size ?? "11",
        10,
      ),
    }),
  });

  const fontSize = Number.isFinite(toolbarState.fontSize)
    ? toolbarState.fontSize
    : 11;

  const applyFontSize = (nextSize: number) => {
    const clampedSize = Math.min(72, Math.max(8, nextSize));
    editor
      .chain()
      .focus()
      .setMark("fontSize", { size: `${clampedSize}px` })
      .run();
  };

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
      <div className="toolbar-actions">
        {TOOLBAR_GROUPS.map((group, groupIndex) => (
          <Fragment key={groupIndex}>
            {groupIndex === 1 ? (
              <FontSizeControl
                editable={editable}
                fontSize={fontSize}
                applyFontSize={applyFontSize}
              />
            ) : null}
            <div className="toolbar-group">
              {group.map((action) => {
                const Icon = action.icon;
                const isActive = action.isActive?.(editor) ?? false;
                const isDisabled = action.isDisabled?.(editor) ?? false;

                return (
                  <button
                    type="button"
                    className={`toolbar-button${isActive ? " toolbar-button--active" : ""}`}
                    key={action.label}
                    aria-label={action.label}
                    aria-pressed={action.isActive ? isActive : undefined}
                    disabled={isDisabled}
                    onClick={() => action.run(editor)}
                    title={action.label}
                  >
                    <Icon aria-hidden="true" size={17} strokeWidth={1.9} />
                  </button>
                );
              })}
            </div>
          </Fragment>
        ))}
      </div>
      {syncLabel ? (
        <span
          className={`editor-toolbar__sync connection-badge connection-badge--${syncStatus ?? "synced"}`}
          role="status"
        >
          <span className="connection-dot" aria-hidden="true" />
          {syncLabel}
        </span>
      ) : null}
      <span className="word-count">{toolbarState.wordCount} words</span>
    </div>
  );
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 32_768;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }

  return window.btoa(binary);
}

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor(
  { document, editable, provider, syncLabel, syncStatus, user },
  ref,
): React.ReactElement {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ undoRedo: false }),
        FontSize,
        Placeholder.configure({
          placeholder:
            "Start with the mechanism, then add the exam clues your group never wants to miss…",
        }),
        Collaboration.configure({ document }),
        CollaborationCaret.configure({
          provider,
          user: {
            name: user.name,
            color: user.color,
          },
        }),
      ],
      editorProps: {
        attributes: {
          "aria-label": editable
            ? "Collaborative study notes"
            : "Read-only shared study notes",
          class: "boardprep-editor",
          spellcheck: "true",
        },
      },
      editable,
      immediatelyRender: false,
    },
    [document, editable, provider, user.color, user.name],
  );

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  useImperativeHandle(
    ref,
    () => ({
      captureDraft: () => {
        if (!editor) {
          return null;
        }

        return {
          content: editor.getJSON() as Record<string, unknown>,
          text: editor.getText(),
        };
      },
      captureSnapshot: () => {
        if (!editor) {
          return null;
        }

        return {
          content: editor.getJSON() as Record<string, unknown>,
          yjsState: encodeBase64(Y.encodeStateAsUpdate(document)),
        };
      },
      isFocused: () => editor?.isFocused ?? false,
      restoreContent: (content) => {
        if (!editor || !editable) {
          return false;
        }

        return editor.commands.setContent(content as JSONContent, {
          emitUpdate: true,
          errorOnInvalidContent: true,
        });
      },
    }),
    [document, editable, editor],
  );

  if (!editor) {
    return (
      <div className="editor-initializing">Preparing the rich-text canvas…</div>
    );
  }

  return (
    <div className="editor-card">
      {editable ? (
        <EditorToolbar
          editor={editor}
          editable={editable}
          syncLabel={syncLabel}
          syncStatus={syncStatus}
        />
      ) : (
        <div className="read-only-editor-banner" role="status">
          Viewer access · editing controls are disabled
        </div>
      )}
      <EditorContent editor={editor} />
      <footer className="editor-footer">
        {editable ? (
          <>
            <span>
              <span className="keyboard-key">⌘</span>
              <span className="keyboard-key">Z</span>
              to undo
            </span>
            <span>Changes merge automatically with everyone in this room.</span>
          </>
        ) : (
          <span>Ask the room owner for editor access to make changes.</span>
        )}
      </footer>
    </div>
  );
});
