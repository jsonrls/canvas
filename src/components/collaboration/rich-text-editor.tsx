"use client";

import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/button";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Text } from "@astryxdesign/core/Text";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { Mark, mergeAttributes } from "@tiptap/core";
import type { Editor, JSONContent } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  MoreHorizontal,
  Code2,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Undo2,
} from "@/components/ui/icons";
import type { IconComponent } from "@/components/ui/icons";
import {
  Fragment,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { LoadingIndicator } from "@/components/ui/LoadingScreen";
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
  user: StudyUser;
}

export const NOTES_SCROLL_REGION_CLASS = "editor-scroll-region";

export interface RichTextEditorHandle {
  captureDraft: () => EditorDraft | null;
  captureSnapshot: () => EditorSnapshot | null;
  isFocused: () => boolean;
  restoreContent: (content: Record<string, unknown>) => boolean;
}

interface ToolbarAction {
  icon: IconComponent;
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

const MOBILE_PRIMARY_NOTE_ACTIONS = new Set(["Undo", "Redo", "Bold", "Italic"]);
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;

function FontSizeControl({
  editable,
  fontSize,
  applyFontSize,
}: {
  editable: boolean;
  fontSize: number;
  applyFontSize: (nextSize: number) => void;
}): React.ReactElement {
  // Google Docs-style stepper: − 14 + on one white pill. The number stays
  // typeable; the buttons step by one.
  return (
    <HStack
      gap={0.5}
      vAlign="center"
      className="font-size-stepper shrink-0 rounded-full bg-surface p-0.5"
    >
      <IconButton
        label="Decrease text size"
        tooltip="Decrease text size"
        icon={<Minus aria-hidden="true" size={14} />}
        size="sm"
        isDisabled={!editable || fontSize <= MIN_FONT_SIZE}
        onClick={() => applyFontSize(fontSize - 1)}
      />
      <VStack className="w-10">
        <NumberInput
          label="Font size in pixels"
          isLabelHidden
          value={fontSize}
          onChange={applyFontSize}
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          isIntegerOnly
          isWheelEnabled={false}
          isDisabled={!editable}
          size="sm"
          width="100%"
        />
      </VStack>
      <IconButton
        label="Increase text size"
        tooltip="Increase text size"
        icon={<Plus aria-hidden="true" size={14} />}
        size="sm"
        isDisabled={!editable || fontSize >= MAX_FONT_SIZE}
        onClick={() => applyFontSize(fontSize + 1)}
      />
    </HStack>
  );
}

function EditorWordCount({ editor }: { editor: Editor }): React.ReactElement {
  const wordCount = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (currentEditor.isDestroyed || !currentEditor.schema) return 0;
      const text = currentEditor.getText().trim();
      return text ? text.split(/\s+/u).length : 0;
    },
  });

  return (
    <Text type="supporting" className="rounded-full bg-muted px-3 py-1">
      {wordCount} {wordCount === 1 ? "word" : "words"}
    </Text>
  );
}

function EditorToolbar({
  editor,
  editable,
}: {
  editor: Editor;
  editable: boolean;
}): React.ReactElement {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (currentEditor.isDestroyed || !currentEditor.schema) {
        return {
          documentSize: 0,
          fontSize: 11,
        };
      }

      return {
        documentSize: currentEditor.state.doc.content.size,
        fontSize: Number.parseInt(
          currentEditor.getAttributes("fontSize").size ?? "11",
          10,
        ),
      };
    },
  });

  const editorReady = !editor.isDestroyed && Boolean(editor.schema);

  const fontSize = Number.isFinite(toolbarState.fontSize)
    ? toolbarState.fontSize
    : 11;

  const applyFontSize = (nextSize: number) => {
    if (!editorReady) {
      return;
    }

    const clampedSize = Math.min(
      MAX_FONT_SIZE,
      Math.max(MIN_FONT_SIZE, nextSize),
    );
    editor
      .chain()
      .focus()
      .setMark("fontSize", { size: `${clampedSize}px` })
      .run();
  };

  const renderAction = (
    action: ToolbarAction,
    options?: { close?: () => void; dialog?: boolean; mobile?: boolean },
  ): React.ReactElement => {
    const Icon = action.icon;
    const isActive = editorReady ? (action.isActive?.(editor) ?? false) : false;
    const isDisabled =
      !editable || !editorReady || (action.isDisabled?.(editor) ?? false);

    const sharedProps = {
      label: action.label,
      "aria-pressed": action.isActive ? isActive : undefined,
      isDisabled,
      variant: "ghost" as const,
      className: `min-w-9 ${isActive ? "bg-surface! text-primary!" : ""}`,
      icon: <Icon aria-hidden="true" size={17} strokeWidth={1.9} />,
      onClick: () => {
        if (!editorReady) return;
        action.run(editor);
        options?.close?.();
      },
    };
    return options?.dialog ? (
      <Button key={action.label} {...sharedProps} />
    ) : (
      <IconButton key={action.label} {...sharedProps} tooltip={action.label} />
    );
  };

  const mobilePrimaryActions = TOOLBAR_GROUPS.flat().filter((action) =>
    MOBILE_PRIMARY_NOTE_ACTIONS.has(action.label),
  );
  const mobileSecondaryActions = TOOLBAR_GROUPS.flat().filter(
    (action) => !MOBILE_PRIMARY_NOTE_ACTIONS.has(action.label),
  );
  const mobileSecondaryActionActive =
    editorReady &&
    mobileSecondaryActions.some((action) => action.isActive?.(editor) ?? false);

  return (
    <HStack hAlign="center" className="shrink-0 overflow-x-auto px-3 pt-3">
      {/* One muted track holds every tool; the active tool is the white pill. */}
      <VStack className="editor-toolbar-track qollab-pill-tray max-w-full rounded-full bg-muted px-2">
        <Toolbar
          label="Text formatting"
          size="lg"
          startContent={
            <>
              <HStack
                gap={2}
                vAlign="center"
                className="hidden shrink-0 lg:flex"
              >
                {TOOLBAR_GROUPS.map((group, groupIndex) => (
                  <Fragment key={groupIndex}>
                    {groupIndex === 1 ? (
                      <FontSizeControl
                        editable={editable && editorReady}
                        fontSize={fontSize}
                        applyFontSize={applyFontSize}
                      />
                    ) : null}
                    <HStack
                      gap={0.5}
                      vAlign="center"
                      className={groupIndex > 0 ? "pl-2" : ""}
                    >
                      {group.map((action) => renderAction(action))}
                    </HStack>
                  </Fragment>
                ))}
              </HStack>
              <HStack gap={1} vAlign="center" className="lg:hidden">
                {mobilePrimaryActions.map((action) =>
                  renderAction(action, { mobile: true }),
                )}
                <IconButton
                  label="More note tools"
                  tooltip="More note tools"
                  icon={<MoreHorizontal aria-hidden="true" />}
                  variant="ghost"
                  aria-haspopup="dialog"
                  aria-expanded={isToolsOpen}
                  className={`min-w-9 ${mobileSecondaryActionActive || fontSize !== 11 ? "bg-surface! text-primary!" : ""}`}
                  onClick={() => setIsToolsOpen(true)}
                />
                <Dialog
                  isOpen={isToolsOpen}
                  onOpenChange={setIsToolsOpen}
                  purpose="form"
                  aria-label="More note tools"
                >
                  <DialogHeader
                    title="More note tools"
                    subtitle="Choose additional formatting for your shared notes."
                    onOpenChange={setIsToolsOpen}
                  />
                  <VStack gap={4} padding={4}>
                    <HStack gap={3} vAlign="center" hAlign="between">
                      <Text>Text size</Text>
                      <FontSizeControl
                        editable={editable && editorReady}
                        fontSize={fontSize}
                        applyFontSize={applyFontSize}
                      />
                    </HStack>
                    <HStack gap={2} wrap="wrap">
                      {mobileSecondaryActions.map((action) =>
                        renderAction(action, {
                          close: () => setIsToolsOpen(false),
                          dialog: true,
                        }),
                      )}
                    </HStack>
                  </VStack>
                </Dialog>
              </HStack>
            </>
          }
        />
      </VStack>
    </HStack>
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
  { document, editable, provider, user },
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
          class:
            "boardprep-editor w-full max-w-3xl! mx-auto! min-h-full! p-5! md:p-8! bg-surface!",
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
      <LoadingIndicator
        className="editor-initializing"
        label="Preparing the rich-text canvas…"
        size="panel"
      />
    );
  }

  return (
    <VStack
      className="editor-card flex! flex-col! flex-1 min-h-0! h-full! w-full! rounded-none! border-0! shadow-none! bg-surface! overflow-hidden"
      gap={0}
    >
      {editable ? (
        <EditorToolbar editor={editor} editable={editable} />
      ) : (
        <Text
          as="p"
          role="status"
          className="mx-auto mt-3 w-fit shrink-0 rounded-full bg-muted px-4 py-2 text-secondary"
        >
          Viewer access · editing controls are disabled
        </Text>
      )}
      <EditorContent
        className={`${NOTES_SCROLL_REGION_CLASS} flex-1 min-h-0 overflow-y-auto overscroll-contain`}
        editor={editor}
      />
      <HStack
        as="footer"
        gap={3}
        paddingInline={4}
        paddingBlock={2}
        hAlign="between"
        wrap="wrap"
        className="editor-footer shrink-0 border-0! bg-surface! p-2! px-4!"
      >
        {editable ? (
          <VStack gap={0} className="grid!">
            <Text
              type="supporting"
              className="editor-undo-hint col-start-1 row-start-1 hidden sm:block"
            >
              ⌘ / Ctrl Z to undo
            </Text>
            <Text
              type="supporting"
              color="primary"
              className="editor-focus-indicator col-start-1 row-start-1"
            >
              Notes focused
            </Text>
          </VStack>
        ) : (
          <Text type="supporting">
            Ask the room owner for editor access to make changes.
          </Text>
        )}
        <EditorWordCount editor={editor} />
      </HStack>
    </VStack>
  );
});
