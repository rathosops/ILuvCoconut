import {
  CHECKERBOARD_SIZE,
  DETECTED_MODE,
  EMPTY_STATE_FONT,
  FRAME_HANDLE_HALF_DIVISOR,
  FRAME_HANDLE_SIZE,
  HALF_DIVISOR,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT,
  OVERLAY_LABEL_FONT,
  OVERLAY_LABEL_HEIGHT,
  OVERLAY_LABEL_TEXT_X,
  OVERLAY_LABEL_TEXT_Y,
  OVERLAY_LABEL_WIDTH,
  OVERLAY_LABEL_X,
  OVERLAY_LABEL_Y,
  PREVIEW_CHECKERBOARD_SIZE
} from './studioConstants';
import { getCanvasPlacement, getFrames } from './frameMath';
import type { CanvasPlacement, FrameRect, StudioState } from './types';

interface DrawStudioCanvasOptions {
  previewCanvas: HTMLCanvasElement;
  previewContext: CanvasRenderingContext2D;
  setFrameInfo: (value: string) => void;
  sheetCanvas: HTMLCanvasElement;
  sheetContext: CanvasRenderingContext2D;
  state: StudioState;
}

export function drawStudioCanvas(options: DrawStudioCanvasOptions): void {
  const { sheetCanvas, sheetContext, state } = options;
  sheetContext.clearRect(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, sheetCanvas.width, sheetCanvas.height);

  if (state.backgroundPreview) {
    drawCheckerboard(sheetContext, sheetCanvas.width, sheetCanvas.height, CHECKERBOARD_SIZE);
  }

  if (!state.image) {
    drawEmptyState(sheetCanvas, sheetContext);
    drawPreview(options);
    return;
  }

  const placement = getCanvasPlacement(state.image, sheetCanvas, state.zoom);
  sheetContext.drawImage(
    state.image,
    placement.offsetX,
    placement.offsetY,
    state.image.naturalWidth * placement.scale,
    state.image.naturalHeight * placement.scale
  );
  drawOverlay(options, placement);
  drawPreview(options);
}

function drawEmptyState(sheetCanvas: HTMLCanvasElement, sheetContext: CanvasRenderingContext2D): void {
  sheetContext.fillStyle = '#263241';
  sheetContext.fillRect(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, sheetCanvas.width, sheetCanvas.height);
  sheetContext.fillStyle = '#d8e2ee';
  sheetContext.font = EMPTY_STATE_FONT;
  sheetContext.textAlign = 'center';
  sheetContext.fillText('Importe uma imagem composta para ajustar grid ou detectar figuras.', sheetCanvas.width / HALF_DIVISOR, sheetCanvas.height / HALF_DIVISOR);
}

function drawOverlay(options: DrawStudioCanvasOptions, placement: CanvasPlacement): void {
  const { sheetContext, state } = options;
  sheetContext.lineWidth = MIN_COUNT_INPUT;
  sheetContext.font = OVERLAY_LABEL_FONT;
  sheetContext.textAlign = 'left';

  for (const frame of getFrames(state)) {
    const x = placement.offsetX + frame.x * placement.scale;
    const y = placement.offsetY + frame.y * placement.scale;
    const width = frame.width * placement.scale;
    const height = frame.height * placement.scale;
    const selected = frame.index === state.selectedFrame;
    sheetContext.strokeStyle = selected ? '#39e29d' : state.frameMode === DETECTED_MODE ? 'rgba(255,199,92,0.86)' : 'rgba(255,255,255,0.76)';
    sheetContext.fillStyle = selected ? 'rgba(57,226,157,0.16)' : 'rgba(14,21,32,0.08)';
    sheetContext.fillRect(x, y, width, height);
    sheetContext.strokeRect(x, y, width, height);
    sheetContext.fillStyle = selected ? '#07130f' : '#ffffff';
    sheetContext.fillRect(x + OVERLAY_LABEL_X, y + OVERLAY_LABEL_Y, OVERLAY_LABEL_WIDTH, OVERLAY_LABEL_HEIGHT);
    sheetContext.fillStyle = selected ? '#39e29d' : '#121820';
    sheetContext.fillText(String(frame.index + MIN_COUNT_INPUT), x + OVERLAY_LABEL_TEXT_X, y + OVERLAY_LABEL_TEXT_Y);
    if (selected && state.frameMode === DETECTED_MODE) drawResizeHandles(sheetContext, frame, placement);
  }
}

function drawResizeHandles(context: CanvasRenderingContext2D, frame: FrameRect, placement: CanvasPlacement): void {
  context.save();
  context.fillStyle = '#39e29d';
  context.strokeStyle = '#07130f';
  context.lineWidth = MIN_COUNT_INPUT;

  for (const point of getHandlePoints(frame, placement)) {
    context.fillRect(
      point.x - FRAME_HANDLE_SIZE / FRAME_HANDLE_HALF_DIVISOR,
      point.y - FRAME_HANDLE_SIZE / FRAME_HANDLE_HALF_DIVISOR,
      FRAME_HANDLE_SIZE,
      FRAME_HANDLE_SIZE
    );
    context.strokeRect(
      point.x - FRAME_HANDLE_SIZE / FRAME_HANDLE_HALF_DIVISOR,
      point.y - FRAME_HANDLE_SIZE / FRAME_HANDLE_HALF_DIVISOR,
      FRAME_HANDLE_SIZE,
      FRAME_HANDLE_SIZE
    );
  }

  context.restore();
}

function getHandlePoints(frame: FrameRect, placement: CanvasPlacement): Array<{ x: number; y: number }> {
  const left = placement.offsetX + frame.x * placement.scale;
  const top = placement.offsetY + frame.y * placement.scale;
  const centerX = left + frame.width * placement.scale / HALF_DIVISOR;
  const centerY = top + frame.height * placement.scale / HALF_DIVISOR;
  const right = left + frame.width * placement.scale;
  const bottom = top + frame.height * placement.scale;

  return [
    { x: left, y: top },
    { x: centerX, y: top },
    { x: right, y: top },
    { x: right, y: centerY },
    { x: right, y: bottom },
    { x: centerX, y: bottom },
    { x: left, y: bottom },
    { x: left, y: centerY }
  ];
}

function drawPreview(options: DrawStudioCanvasOptions): void {
  const { previewCanvas, previewContext, setFrameInfo, state } = options;
  previewContext.clearRect(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, previewCanvas.width, previewCanvas.height);
  drawCheckerboard(previewContext, previewCanvas.width, previewCanvas.height, PREVIEW_CHECKERBOARD_SIZE);

  const frame = getFrames(state)[state.selectedFrame];
  if (!state.image || !frame) {
    setFrameInfo('Nenhum frame selecionado.');
    return;
  }

  const scale = Math.min(previewCanvas.width / frame.width, previewCanvas.height / frame.height);
  const width = frame.width * scale;
  const height = frame.height * scale;
  previewContext.drawImage(
    state.image,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    (previewCanvas.width - width) / HALF_DIVISOR,
    (previewCanvas.height - height) / HALF_DIVISOR,
    width,
    height
  );
  setFrameInfo(`Frame ${frame.index + MIN_COUNT_INPUT}: ${frame.width}x${frame.height}px, x ${frame.x}, y ${frame.y}`);
}

function drawCheckerboard(context: CanvasRenderingContext2D, width: number, height: number, size: number): void {
  for (let y = MIN_NUMERIC_INPUT; y < height; y += size) {
    for (let x = MIN_NUMERIC_INPUT; x < width; x += size) {
      context.fillStyle = (x / size + y / size) % HALF_DIVISOR === MIN_NUMERIC_INPUT ? '#f2f4f7' : '#d9dee7';
      context.fillRect(x, y, size, size);
    }
  }
}
