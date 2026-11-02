"use client";

import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/button";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { StatusDot } from "@astryxdesign/core/StatusDot";
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
    <VStack className="w-24 shrink-0">
      <NumberInput
        label="Font size in pixels"
        isLabelHidden
        value={fontSize}
        onChange={applyFontSize}
        min={8}
        max={72}
        isIntegerOnly
        isWheelEnabled={false}
        hasNumberSteppers
        isDisabled={!editable}
        width="100%"
      />
    </VStack>
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
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (currentEditor.isDestroyed || !currentEditor.schema) {
        return {
          documentSize: 0,
          fontSize: 11,
          wordCount: 0,
        };
      }

      const editorText = currentEditor.getText().trim();

      return {
        documentSize: currentEditor.state.doc.content.size,
        wordCount: editorText ? editorText.split(/\s+/u).length : 0,
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

    const clampedSize = Math.min(72, Math.max(8, nextSize));
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
      className: `min-h-11 min-w-11 ${isActive ? "bg-accent-muted! text-accent!" : ""}`,
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
    <VStack
      className="shrink-0 overflow-x-auto border-b border-border bg-surface"
      gap={0}
    >
      <Toolbar
        label="Text formatting"
        size="lg"
        endContent={
          <HStack
            gap={3}
            className="shrink-0 whitespace-nowrap"
            vAlign="center"
          >
            {syncLabel ? (
              <HStack
                gap={1.5}
                vAlign="center"
                role="status"
                className="hidden! md:flex!"
              >
                <StatusDot
                  variant={
                    syncStatus === "synced"
                      ? "success"
                      : syncStatus === "offline"
                        ? "warning"
                        : "neutral"
                  }
                  label={syncLabel}
                />
                <Text type="supporting">{syncLabel}</Text>
              </HStack>
            ) : (
              <Text type="supporting" className="hidden! md:block!">
                Shared notes
              </Text>
            )}
            <Text type="supporting">{toolbarState.wordCount} words</Text>
          </HStack>
        }
        startContent={
          <>
            <HStack gap={2} vAlign="center" className="hidden shrink-0 lg:flex">
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
                    className={
                      groupIndex > 0 ? "border-l border-border pl-2" : ""
                    }
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
                className={`min-h-11 min-w-11 ${mobileSecondaryActionActive || fontSize !== 11 ? "bg-accent-muted! text-accent!" : ""}`}
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
          class:
            "boardprep-editor w-full max-w-5xl! mx-auto! h-full! min-h-0! overflow-x-hidden! overflow-y-auto! overscroll-contain p-5! md:p-8! bg-surface!",
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
        <EditorToolbar
          editor={editor}
          editable={editable}
          syncLabel={syncLabel}
          syncStatus={syncStatus}
        />
      ) : (
        <Text
          as="p"
          role="status"
          className="shrink-0 border-b border-border p-3 text-secondary"
        >
          Viewer access · editing controls are disabled
        </Text>
      )}
      <EditorContent
        className="editor-scroll-region flex-1 min-h-0! overflow-hidden!"
        editor={editor}
      />
      <HStack
        as="footer"
        gap={3}
        paddingInline={4}
        paddingBlock={2}
        hAlign="between"
        wrap="wrap"
        className="editor-footer shrink-0 border-t border-border bg-surface! p-2! px-4!"
      >
        {editable ? (
          <>
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
            <Text type="supporting">
              Changes sync automatically with your room.
            </Text>
          </>
        ) : (
          <Text type="supporting">
            Ask the room owner for editor access to make changes.
          </Text>
        )}
      </HStack>
    </VStack>
  );
});
