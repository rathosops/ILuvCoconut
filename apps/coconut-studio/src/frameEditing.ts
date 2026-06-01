import {
  FRAME_HANDLE_HIT_SIZE,
  FRAME_MIN_EDIT_SIZE,
  HALF_DIVISOR,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT
} from './studioConstants';
import { getCanvasPlacement } from './frameMath';
import type { FrameRect } from './types';

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface ImagePoint {
  x: number;
  y: number;
}

export interface FrameEditSnapshot {
  frame: FrameRect;
  pointer: ImagePoint;
}

export function pointerToImagePoint(event: PointerEvent, sheetCanvas: HTMLCanvasElement, image: HTMLImageElement, zoom: number): ImagePoint {
  const rect = sheetCanvas.getBoundingClientRect();
  const placement = getCanvasPlacement(image, sheetCanvas, zoom);
  const canvasX = (event.clientX - rect.left) * (sheetCanvas.width / rect.width);
  const canvasY = (event.clientY - rect.top) * (sheetCanvas.height / rect.height);

  return {
    x: (canvasX - placement.offsetX) / placement.scale,
    y: (canvasY - placement.offsetY) / placement.scale
  };
}

export function resizeFrameFromPointer(
  snapshot: FrameEditSnapshot,
  handle: ResizeHandle,
  pointer: ImagePoint,
  imageWidth: number,
  imageHeight: number
): FrameRect {
  const deltaX = pointer.x - snapshot.pointer.x;
  const deltaY = pointer.y - snapshot.pointer.y;
  const left = snapshot.frame.x;
  const top = snapshot.frame.y;
  const right = snapshot.frame.x + snapshot.frame.width;
  const bottom = snapshot.frame.y + snapshot.frame.height;

  return rectToFrame(snapshot.frame, {
    left: handle.includes('w') ? left + deltaX : left,
    top: handle.includes('n') ? top + deltaY : top,
    right: handle.includes('e') ? right + deltaX : right,
    bottom: handle.includes('s') ? bottom + deltaY : bottom
  }, imageWidth, imageHeight);
}

export function findResizeHandle(point: ImagePoint, frame: FrameRect, scale: number): ResizeHandle | undefined {
  const hitSize = FRAME_HANDLE_HIT_SIZE / scale;

  return getHandleCenters(frame).find(({ x, y }) => {
    return Math.abs(point.x - x) <= hitSize / HALF_DIVISOR && Math.abs(point.y - y) <= hitSize / HALF_DIVISOR;
  })?.handle;
}

export function getHandleCursor(handle: ResizeHandle | undefined): string {
  switch (handle) {
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'nw':
    case 'se':
      return 'nwse-resize';
    default:
      return 'crosshair';
  }
}

function rectToFrame(frame: FrameRect, rect: { left: number; top: number; right: number; bottom: number }, imageWidth: number, imageHeight: number): FrameRect {
  const left = clamp(Math.min(rect.left, rect.right - FRAME_MIN_EDIT_SIZE), MIN_NUMERIC_INPUT, imageWidth - FRAME_MIN_EDIT_SIZE);
  const top = clamp(Math.min(rect.top, rect.bottom - FRAME_MIN_EDIT_SIZE), MIN_NUMERIC_INPUT, imageHeight - FRAME_MIN_EDIT_SIZE);
  const right = clamp(Math.max(rect.right, left + FRAME_MIN_EDIT_SIZE), left + FRAME_MIN_EDIT_SIZE, imageWidth);
  const bottom = clamp(Math.max(rect.bottom, top + FRAME_MIN_EDIT_SIZE), top + FRAME_MIN_EDIT_SIZE, imageHeight);

  return {
    ...frame,
    x: Math.round(left),
    y: Math.round(top),
    width: Math.max(MIN_COUNT_INPUT, Math.round(right - left)),
    height: Math.max(MIN_COUNT_INPUT, Math.round(bottom - top))
  };
}

function getHandleCenters(frame: FrameRect): Array<{ handle: ResizeHandle; x: number; y: number }> {
  const left = frame.x;
  const top = frame.y;
  const centerX = frame.x + frame.width / HALF_DIVISOR;
  const centerY = frame.y + frame.height / HALF_DIVISOR;
  const right = frame.x + frame.width;
  const bottom = frame.y + frame.height;

  return [
    { handle: 'nw', x: left, y: top },
    { handle: 'n', x: centerX, y: top },
    { handle: 'ne', x: right, y: top },
    { handle: 'e', x: right, y: centerY },
    { handle: 'se', x: right, y: bottom },
    { handle: 's', x: centerX, y: bottom },
    { handle: 'sw', x: left, y: bottom },
    { handle: 'w', x: left, y: centerY }
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
