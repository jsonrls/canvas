import type { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import {
  readWhiteboardElement,
  type WhiteboardElement,
} from "@/lib/whiteboard/model";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";

export function useWhiteboardDocument({
  collaboration,
  canEdit,
}: {
  collaboration: ReturnType<typeof useCollaborativeTool>;
  canEdit: boolean;
}) {
  const [elements, setElements] = useState<WhiteboardElement[]>([]);

  const [canUndo, setCanUndo] = useState(false);

  const [canRedo, setCanRedo] = useState(false);

  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  useEffect(() => {
    const document = collaboration.connection?.document;
    if (!document) return;
    const elementMap = document.getMap<unknown>("whiteboard-elements");
    const undoManager = new Y.UndoManager(elementMap);
    undoManagerRef.current = undoManager;
    const refreshHistory = (): void => {
      setCanUndo(undoManager.canUndo());
      setCanRedo(undoManager.canRedo());
    };
    undoManager.on("stack-item-added", refreshHistory);
    undoManager.on("stack-item-popped", refreshHistory);
    undoManager.on("stack-cleared", refreshHistory);
    const refresh = (): void => {
      setElements(
        Array.from(elementMap.values())
          .map(readWhiteboardElement)
          .filter((element): element is WhiteboardElement => element !== null)
          .sort((first, second) =>
            first.createdAt.localeCompare(second.createdAt),
          ),
      );
    };
    refresh();
    elementMap.observe(refresh);
    return () => {
      elementMap.unobserve(refresh);
      undoManager.destroy();
      if (undoManagerRef.current === undoManager) undoManagerRef.current = null;
    };
  }, [collaboration.connection]);

  const transact = useCallback(
    (change: (document: Y.Doc) => void): void => {
      const document = collaboration.connection?.document;
      if (!canEdit || !document) return;
      document.transact(() => change(document));
      const undoManager = undoManagerRef.current;
      if (undoManager) {
        setCanUndo(undoManager.canUndo());
        setCanRedo(undoManager.canRedo());
      }
    },
    [canEdit, collaboration.connection],
  );

  const upsertElement = useCallback(
    (element: WhiteboardElement): void => {
      transact((document) =>
        document
          .getMap<WhiteboardElement>("whiteboard-elements")
          .set(element.id, element),
      );
    },
    [transact],
  );

  const handleUndo = (): void => {
    undoManagerRef.current?.undo();
    setCanUndo(undoManagerRef.current?.canUndo() ?? false);
    setCanRedo(undoManagerRef.current?.canRedo() ?? false);
  };

  const handleRedo = (): void => {
    undoManagerRef.current?.redo();
    setCanUndo(undoManagerRef.current?.canUndo() ?? false);
    setCanRedo(undoManagerRef.current?.canRedo() ?? false);
  };
  return {
    elements,
    canUndo,
    canRedo,
    transact,
    upsertElement,
    handleUndo,
    handleRedo,
  };
}
