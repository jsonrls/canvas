import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { readChoice, replaceQuery } from "@/lib/url-state";

/** The open workspace tool, kept in the address so a refresh stays on it. */
export function useActiveTool<T extends string>(
  tools: readonly [T, ...T[]],
): [T, (tool: T) => void] {
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool] = useState(() =>
    readChoice(searchParams.get("tool"), tools),
  );
  const openTool = useCallback(
    (tool: T): void => {
      setActiveTool(tool);
      const current = readChoice(
        new URLSearchParams(window.location.search).get("tool"),
        tools,
      );
      // The guide and view belong to the assistant that is being left.
      if (tool !== current) {
        replaceQuery({
          tool: tool === tools[0] ? null : tool,
          guide: null,
          view: null,
        });
      }
    },
    [tools],
  );
  return [activeTool, openTool];
}
