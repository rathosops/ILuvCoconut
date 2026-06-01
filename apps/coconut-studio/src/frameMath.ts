import {
  CANVAS_MIN_OFFSET,
  CANVAS_SAFE_PADDING,
  COMPONENT_PADDING_BASE,
  COMPONENT_PADDING_MIN,
  COMPONENT_ROW_CLUSTER_MIN_RATIO,
  COMPONENT_ROW_CLUSTER_RATIO,
  DETECTED_MODE,
  DETECTION_SCORE_MAX,
  FRAME_OVERLAP_MIN_SIZE,
  HALF_DIVISOR,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT
} from './studioConstants';
import type { CanvasPlacement, ComponentBounds, FrameRect, StudioState } from './types';

type FrameState = Pick<StudioState, 'detectedFrames' | 'frameMode' | 'grid' | 'image'>;

export function getFrames(state: FrameState): FrameRect[] {
  if (!state.image) return [];
  if (state.frameMode === DETECTED_MODE) return state.detectedFrames;

  const { columns, rows, marginX, marginY, gapX, gapY, frameWidth, frameHeight } = state.grid;
  const availableWidth = state.image.naturalWidth - marginX * HALF_DIVISOR - gapX * (columns - MIN_COUNT_INPUT);
  const availableHeight = state.image.naturalHeight - marginY * HALF_DIVISOR - gapY * (rows - MIN_COUNT_INPUT);
  const width = frameWidth > MIN_NUMERIC_INPUT ? frameWidth : Math.max(MIN_COUNT_INPUT, Math.floor(availableWidth / columns));
  const height = frameHeight > MIN_NUMERIC_INPUT ? frameHeight : Math.max(MIN_COUNT_INPUT, Math.floor(availableHeight / rows));
  const frames: FrameRect[] = [];

  for (let row = MIN_NUMERIC_INPUT; row < rows; row += MIN_COUNT_INPUT) {
    for (let column = MIN_NUMERIC_INPUT; column < columns; column += MIN_COUNT_INPUT) {
      frames.push({
        index: row * columns + column,
        column,
        row,
        x: marginX + column * (width + gapX),
        y: marginY + row * (height + gapY),
        width,
        height
      });
    }
  }

  return frames;
}

export function componentBoundsToFrames(bounds: ComponentBounds[], imageWidth: number, imageHeight: number, scale: number): FrameRect[] {
  const padding = Math.max(COMPONENT_PADDING_MIN, Math.round(COMPONENT_PADDING_BASE * scale));
  const inverseScale = MIN_COUNT_INPUT / scale;

  const frames = bounds
    .map((component, index) => {
      const x = Math.max(MIN_NUMERIC_INPUT, Math.floor((component.minX - padding) * inverseScale));
      const y = Math.max(MIN_NUMERIC_INPUT, Math.floor((component.minY - padding) * inverseScale));
      const maxX = Math.min(imageWidth, Math.ceil((component.maxX + padding) * inverseScale));
      const maxY = Math.min(imageHeight, Math.ceil((component.maxY + padding) * inverseScale));
      return {
        index,
        column: index,
        row: MIN_NUMERIC_INPUT,
        x,
        y,
        width: Math.max(MIN_COUNT_INPUT, maxX - x),
        height: Math.max(MIN_COUNT_INPUT, maxY - y)
      };
    });

  return assignRowsAndColumns(frames);
}

function assignRowsAndColumns(frames: FrameRect[]): FrameRect[] {
  const medianHeight = median(frames.map((frame) => frame.height));
  const minHeight = Math.min(...frames.map((frame) => frame.height));
  const rowTolerance = Math.max(
    MIN_COUNT_INPUT,
    Math.round(medianHeight * COMPONENT_ROW_CLUSTER_RATIO),
    Math.round(minHeight * COMPONENT_ROW_CLUSTER_MIN_RATIO)
  );
  const rows: FrameRect[][] = [];

  for (const frame of [...frames].sort((left, right) => centerY(left) - centerY(right) || left.x - right.x)) {
    const row = rows.find((candidate) => Math.abs(median(candidate.map(centerY)) - centerY(frame)) <= rowTolerance);
    if (row) {
      row.push(frame);
      continue;
    }

    rows.push([frame]);
  }

  return rows
    .map((row, rowIndex) => trimRowOverlaps(row.sort((left, right) => left.x - right.x)).map((frame, columnIndex) => ({ ...frame, row: rowIndex, column: columnIndex })))
    .flat()
    .map((frame, index) => ({ ...frame, index }))
    .sort((left, right) => left.index - right.index);
}

function trimRowOverlaps(row: FrameRect[]): FrameRect[] {
  const nextRow = row.map((frame) => ({ ...frame }));

  for (let index = MIN_NUMERIC_INPUT; index < nextRow.length - MIN_COUNT_INPUT; index += MIN_COUNT_INPUT) {
    const left = nextRow[index];
    const right = nextRow[index + MIN_COUNT_INPUT];
    if (!left || !right) continue;
    const leftEnd = left.x + left.width;
    if (leftEnd <= right.x) continue;

    const boundary = Math.round((leftEnd + right.x) / HALF_DIVISOR);
    const clampedBoundary = Math.max(left.x + FRAME_OVERLAP_MIN_SIZE, Math.min(right.x + right.width - FRAME_OVERLAP_MIN_SIZE, boundary));
    left.width = Math.max(FRAME_OVERLAP_MIN_SIZE, clampedBoundary - left.x);
    right.width = Math.max(FRAME_OVERLAP_MIN_SIZE, right.x + right.width - clampedBoundary);
    right.x = clampedBoundary;
  }

  return nextRow;
}

function centerY(frame: FrameRect): number {
  return frame.y + frame.height / HALF_DIVISOR;
}

function median(values: number[]): number {
  if (values.length === MIN_NUMERIC_INPUT) return DETECTION_SCORE_MAX;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / HALF_DIVISOR)] ?? DETECTION_SCORE_MAX;
}

export function frameAtPointer(
  event: PointerEvent,
  sheetCanvas: HTMLCanvasElement,
  image: HTMLImageElement | undefined,
  zoom: number,
  frames: FrameRect[]
): FrameRect | undefined {
  if (!image) return undefined;
  const rect = sheetCanvas.getBoundingClientRect();
  const placement = getCanvasPlacement(image, sheetCanvas, zoom);
  const x = (event.clientX - rect.left) * (sheetCanvas.width / rect.width);
  const y = (event.clientY - rect.top) * (sheetCanvas.height / rect.height);

  return frames.find((frame) => {
    const frameX = placement.offsetX + frame.x * placement.scale;
    const frameY = placement.offsetY + frame.y * placement.scale;
    return x >= frameX && x <= frameX + frame.width * placement.scale && y >= frameY && y <= frameY + frame.height * placement.scale;
  });
}

export function getCanvasPlacement(image: HTMLImageElement | undefined, sheetCanvas: HTMLCanvasElement, zoom: number): CanvasPlacement {
  if (!image) return { offsetX: MIN_NUMERIC_INPUT, offsetY: MIN_NUMERIC_INPUT, scale: MIN_COUNT_INPUT };
  const scale = calculateScale(image, sheetCanvas, zoom);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  return {
    offsetX: Math.max(CANVAS_MIN_OFFSET, (sheetCanvas.width - drawWidth) / HALF_DIVISOR),
    offsetY: Math.max(CANVAS_MIN_OFFSET, (sheetCanvas.height - drawHeight) / HALF_DIVISOR),
    scale
  };
}

export function calculateScale(image: HTMLImageElement, sheetCanvas: HTMLCanvasElement, zoom: number): number {
  const fitScale = Math.min((sheetCanvas.width - CANVAS_SAFE_PADDING) / image.naturalWidth, (sheetCanvas.height - CANVAS_SAFE_PADDING) / image.naturalHeight);
  return fitScale * zoom;
}
