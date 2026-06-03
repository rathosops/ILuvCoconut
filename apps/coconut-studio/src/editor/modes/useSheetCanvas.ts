import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { getCanvasContext } from '../../engine/canvasContext';
import { drawStudioCanvas } from '../../engine/canvasRenderer';
import { getCanvasPlacement, frameAtPointer, getFrames } from '../../engine/frameMath';
import {
  findResizeHandle,
  getHandleCursor,
  pointerToImagePoint,
  resizeFrameFromPointer,
  type FrameEditSnapshot,
  type ResizeHandle
} from '../../engine/frameEditing';
import { type StudioProject } from '../../state/useStudioProject';

interface DragState {
  handle: ResizeHandle;
  snapshot: FrameEditSnapshot;
}

export interface SheetCanvas {
  sheetRef: React.RefObject<HTMLCanvasElement>;
  previewRef: React.RefObject<HTMLCanvasElement>;
  cursorRef: React.RefObject<HTMLDivElement>;
  onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
}

export function useSheetCanvas(project: StudioProject, onSelectFrame: (index: number) => void): SheetCanvas {
  const sheetRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const redraw = useCallback(() => {
    const sheet = sheetRef.current;
    const preview = previewRef.current;
    if (!sheet || !preview) return;
    drawStudioCanvas({
      sheetCanvas: sheet,
      sheetContext: getCanvasContext(sheet),
      previewCanvas: preview,
      previewContext: getCanvasContext(preview),
      setFrameInfo: () => undefined,
      state: project.state
    });
  }, [project.state]);

  useEffect(redraw, [redraw, project.version]);

  const selectedFrame = useCallback(() => {
    return getFrames(project.state).find((frame) => frame.index === project.state.selectedFrame);
  }, [project.state]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const sheet = sheetRef.current;
    const { image, zoom } = project.state;
    if (!sheet || !image) return;
    const point = pointerToImagePoint(event.nativeEvent, sheet, image, zoom);
    const scale = getCanvasPlacement(image, sheet, zoom).scale;
    const current = selectedFrame();
    const handle = current ? findResizeHandle(point, current, scale) : undefined;
    if (current && handle) {
      dragRef.current = { handle, snapshot: { frame: { ...current }, pointer: point } };
      sheet.setPointerCapture(event.pointerId);
      return;
    }
    const frame = frameAtPointer(event.nativeEvent, sheet, image, zoom, getFrames(project.state));
    if (frame) {
      project.mutate((state) => { state.selectedFrame = frame.index; });
      onSelectFrame(frame.index);
    }
  }, [project, selectedFrame, onSelectFrame]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const sheet = sheetRef.current;
    const { image, zoom } = project.state;
    if (!sheet || !image) return;
    const point = pointerToImagePoint(event.nativeEvent, sheet, image, zoom);
    const drag = dragRef.current;
    if (!drag) {
      const current = selectedFrame();
      const scale = getCanvasPlacement(image, sheet, zoom).scale;
      if (cursorRef.current) cursorRef.current.style.cursor = getHandleCursor(current ? findResizeHandle(point, current, scale) : undefined);
      return;
    }
    const next = resizeFrameFromPointer(drag.snapshot, drag.handle, point, image.naturalWidth, image.naturalHeight);
    project.state.detectedFrames = project.state.detectedFrames.map((frame) => (frame.index === drag.snapshot.frame.index ? next : frame));
    redraw();
  }, [project, redraw, selectedFrame]);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    sheetRef.current?.releasePointerCapture(event.pointerId);
    project.mutate(() => undefined);
  }, [project]);

  return { sheetRef, previewRef, cursorRef, onPointerDown, onPointerMove, onPointerUp };
}
