import {
  findResizeHandle,
  getHandleCursor,
  pointerToImagePoint,
  resizeFrameFromPointer,
  type FrameEditSnapshot,
  type ResizeHandle
} from './frameEditing';
import { frameAtPointer, getCanvasPlacement, getFrames } from './frameMath';
import { DETECTED_MODE, MIN_NUMERIC_INPUT } from './studioConstants';
import type { FrameRect, StudioState } from './types';

interface BindFrameEditingOptions {
  draw: () => void;
  sheetCanvas: HTMLCanvasElement;
  state: StudioState;
}

export function bindFrameEditing({ draw, sheetCanvas, state }: BindFrameEditingOptions): void {
  let activeFrameEdit: { handle: ResizeHandle; pointerId: number; snapshot: FrameEditSnapshot } | undefined;

  sheetCanvas.addEventListener('pointerdown', (event) => {
    if (startFrameResize(event)) return;
    const frame = frameAtPointer(event, sheetCanvas, state.image, state.zoom, getFrames(state));
    if (!frame) return;
    state.selectedFrame = frame.index;
    draw();
  });

  sheetCanvas.addEventListener('pointermove', (event) => {
    if (activeFrameEdit) {
      updateFrameResize(event);
      return;
    }
    syncCanvasCursor(event);
  });

  sheetCanvas.addEventListener('pointerup', stopFrameResize);
  sheetCanvas.addEventListener('pointercancel', stopFrameResize);

  function startFrameResize(event: PointerEvent): boolean {
    const frame = getSelectedDetectedFrame();
    if (!state.image || !frame) return false;
    const placement = getCanvasPlacement(state.image, sheetCanvas, state.zoom);
    const pointer = pointerToImagePoint(event, sheetCanvas, state.image, state.zoom);
    const handle = findResizeHandle(pointer, frame, placement.scale);
    if (!handle) return false;

    activeFrameEdit = { handle, pointerId: event.pointerId, snapshot: { frame: { ...frame }, pointer } };
    sheetCanvas.setPointerCapture(event.pointerId);
    sheetCanvas.style.cursor = getHandleCursor(handle);
    event.preventDefault();
    return true;
  }

  function updateFrameResize(event: PointerEvent): void {
    if (!activeFrameEdit || event.pointerId !== activeFrameEdit.pointerId || !state.image) return;
    const nextFrame = resizeFrameFromPointer(
      activeFrameEdit.snapshot,
      activeFrameEdit.handle,
      pointerToImagePoint(event, sheetCanvas, state.image, state.zoom),
      state.image.naturalWidth,
      state.image.naturalHeight
    );
    replaceDetectedFrame(nextFrame);
    draw();
  }

  function stopFrameResize(event: PointerEvent): void {
    if (!activeFrameEdit || event.pointerId !== activeFrameEdit.pointerId) return;
    if (sheetCanvas.hasPointerCapture(event.pointerId)) sheetCanvas.releasePointerCapture(event.pointerId);
    activeFrameEdit = undefined;
    syncCanvasCursor(event);
  }

  function syncCanvasCursor(event: PointerEvent): void {
    const frame = getSelectedDetectedFrame();
    if (!state.image || !frame) {
      sheetCanvas.style.cursor = 'crosshair';
      return;
    }

    const placement = getCanvasPlacement(state.image, sheetCanvas, state.zoom);
    const pointer = pointerToImagePoint(event, sheetCanvas, state.image, state.zoom);
    sheetCanvas.style.cursor = getHandleCursor(findResizeHandle(pointer, frame, placement.scale));
  }

  function getSelectedDetectedFrame(): FrameRect | undefined {
    if (state.frameMode !== DETECTED_MODE) return undefined;
    return state.detectedFrames.find((frame) => frame.index === state.selectedFrame);
  }

  function replaceDetectedFrame(nextFrame: FrameRect): void {
    const frameIndex = state.detectedFrames.findIndex((frame) => frame.index === nextFrame.index);
    if (frameIndex < MIN_NUMERIC_INPUT) return;
    state.detectedFrames = state.detectedFrames.map((frame, index) => (index === frameIndex ? nextFrame : frame));
  }
}
