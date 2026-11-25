import * as Y from "yjs";

function blockTexts(node: Y.XmlFragment): string[] {
  const children = node.toArray();
  if (children.some((child) => child instanceof Y.XmlText)) {
    return [
      children
        .map((child) =>
          child instanceof Y.XmlText
            ? child
                .toDelta()
                .map(({ insert }: { insert: unknown }) =>
                  typeof insert === "string" ? insert : "",
                )
                .join("")
            : "\n",
        )
        .join(""),
    ];
  }
  return children.flatMap((child) =>
    child instanceof Y.XmlElement ? blockTexts(child) : [],
  );
}

/** The shared notes as plain text, for when the editor is not on screen. */
export function readNotesText(document: Y.Doc): string {
  // "default" is the fragment the Tiptap editor writes to.
  return blockTexts(document.getXmlFragment("default")).join("\n\n");
}
