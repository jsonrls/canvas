import { AUTOMATIC_FIT_MAX_ZOOM } from "@/components/collaboration/whiteboard/types";
import type { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import { fitCameraToElements } from "@/lib/whiteboard/geometry";
import {
  clampCamera,
  createInitialCamera,
  panCamera,
  zoomCameraAt,
  type ViewportSize,
  type WhiteboardCamera,
  type WhiteboardElement,
} from "@/lib/whiteboard/model";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

export function useWhiteboardCamera({
  containerRef,
  elements,
  collaboration,
  svgRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  elements: WhiteboardElement[];
  collaboration: ReturnType<typeof useCollaborativeTool>;
  svgRef: RefObject<SVGSVGElement | null>;
}) {
  const [camera, setCamera] = useState<WhiteboardCamera>({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const [viewport, setViewport] = useState<ViewportSize>({
    width: 1_600,
    height: 960,
  });

  const hasMeasuredViewportRef = useRef(false);

  const hasSettledInitialCameraRef = useRef(false);

  const hasInteractedWithBoardRef = useRef(false);

  const previousViewportRef = useRef<ViewportSize | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateViewport = (width: number, height: number): void => {
      if (width <= 0 || height <= 0) return;
      hasMeasuredViewportRef.current = true;
      setViewport((current) =>
        Math.abs(current.width - width) < 0.5 &&
        Math.abs(current.height - height) < 0.5
          ? current
          : { width, height },
      );
    };

    const initialBounds = container.getBoundingClientRect();
    updateViewport(initialBounds.width, initialBounds.height);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        updateViewport(width, height);
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [containerRef]);

  useEffect(() => {
    if (!hasMeasuredViewportRef.current) return;

    const previousViewport = previousViewportRef.current;
    const viewportChanged = Boolean(
      previousViewport &&
      (Math.abs(previousViewport.width - viewport.width) >= 0.5 ||
        Math.abs(previousViewport.height - viewport.height) >= 0.5),
    );
    let nextCamera: WhiteboardCamera | null = null;
    let settlesInitialCamera = false;

    if (!hasSettledInitialCameraRef.current) {
      if (elements.length > 0) {
        if (!hasInteractedWithBoardRef.current) {
          nextCamera = fitCameraToElements(
            elements,
            viewport,
            AUTOMATIC_FIT_MAX_ZOOM,
          );
          settlesInitialCamera = true;
        } else {
          hasSettledInitialCameraRef.current = true;
        }
      } else if (collaboration.status === "synced") {
        nextCamera = createInitialCamera(viewport);
        settlesInitialCamera = true;
      }
    } else if (viewportChanged) {
      nextCamera =
        elements.length > 0
          ? fitCameraToElements(elements, viewport, AUTOMATIC_FIT_MAX_ZOOM)
          : createInitialCamera(viewport);
    }

    if (!nextCamera) {
      previousViewportRef.current = viewport;
      return;
    }

    const cameraForViewport = nextCamera;
    const frame = requestAnimationFrame(() => {
      setCamera(cameraForViewport);
      previousViewportRef.current = viewport;
      if (settlesInitialCamera) {
        hasSettledInitialCameraRef.current = true;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [collaboration.status, elements, viewport]);

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>): void => {
    if (!svgRef.current) return;
    event.preventDefault();

    const bounds = svgRef.current.getBoundingClientRect();
    const originX = bounds.left;
    const originY = bounds.top;

    // Zoom if Ctrl (Windows/Linux) or Cmd (Mac) key is held down
    if (event.ctrlKey || event.metaKey) {
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const nextZoom = camera.zoom * zoomFactor;

      setCamera((current) =>
        zoomCameraAt(
          current,
          viewport,
          nextZoom,
          event.clientX,
          event.clientY,
          originX,
          originY,
        ),
      );
    } else {
      // Pan otherwise (scroll wheel/swipe pans the canvas)
      setCamera((current) =>
        panCamera(current, viewport, -event.deltaX, -event.deltaY),
      );
    }
  };

  const handleZoomIn = (): void => {
    if (!svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const originX = bounds.left;
    const originY = bounds.top;

    setCamera((current) =>
      zoomCameraAt(
        current,
        viewport,
        current.zoom * 1.15,
        centerX,
        centerY,
        originX,
        originY,
      ),
    );
  };

  const handleZoomOut = (): void => {
    if (!svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const originX = bounds.left;
    const originY = bounds.top;

    setCamera((current) =>
      zoomCameraAt(
        current,
        viewport,
        current.zoom / 1.15,
        centerX,
        centerY,
        originX,
        originY,
      ),
    );
  };

  const handleResetView = (): void => {
    setCamera(clampCamera({ x: 0, y: 0, zoom: 1 }, viewport));
  };

  const handleAutoFit = (): void => {
    setCamera(fitCameraToElements(elements, viewport));
  };
  return {
    camera,
    setCamera,
    viewport,
    hasInteractedWithBoardRef,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleAutoFit,
  };
}
