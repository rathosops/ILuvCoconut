import { getCanvasContext } from './dom';
import {
  COMPONENT_PADDING_BASE,
  COMPONENT_PADDING_MIN,
  COCONUT_VISION_MAX_PIXELS,
  MAX_COLOR_CHANNEL,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT
} from './studioConstants';
import type { DetectionSummary, FrameRect, RgbColor } from './types';

interface CoconutVisionRequest {
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  rgba: number[];
  threshold: number;
  minArea: number;
  padding: number;
  backgroundMode: 'auto';
  backgroundColor: CoconutVisionRgbaColor;
  analysisScale: number;
}

interface CoconutVisionRgbaColor extends RgbColor {
  a: number;
}

interface CoconutVisionResponse {
  symbols: CoconutVisionSymbol[];
  summary: CoconutVisionSummary;
}

interface CoconutVisionSymbol {
  index: number;
  row: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CoconutVisionSummary {
  figureCount: number;
  rowCount: number;
  figuresByRow: number[];
  analysisScale: number;
  elapsedMs: number;
}

interface TauriInternals {
  invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
}

interface TauriGlobal {
  __TAURI_INTERNALS__?: TauriInternals;
}

export interface CoconutVisionDetectionResult {
  frames: FrameRect[];
  summary: DetectionSummary;
}

export async function detectFiguresWithCoconutVision(
  image: HTMLImageElement,
  background: RgbColor,
  threshold: number,
  minArea: number
): Promise<CoconutVisionDetectionResult> {
  const invoke = getTauriInvoke();
  const request = createCoconutVisionRequest(image, background, threshold, minArea);
  const response = await invoke<CoconutVisionResponse>('detect_symbols', { request });

  return {
    frames: response.symbols.map((symbol) => ({
      index: symbol.index,
      row: symbol.row,
      column: symbol.column,
      x: symbol.x,
      y: symbol.y,
      width: symbol.width,
      height: symbol.height
    })),
    summary: {
      backend: 'coconutVision',
      figureCount: response.summary.figureCount,
      rowCount: response.summary.rowCount,
      figuresByRow: response.summary.figuresByRow,
      analysisScale: response.summary.analysisScale,
      elapsedMs: response.summary.elapsedMs
    }
  };
}

export function isCoconutVisionRuntimeAvailable(): boolean {
  const tauriGlobal = globalThis as TauriGlobal;
  return typeof tauriGlobal.__TAURI_INTERNALS__?.invoke === 'function';
}

function getTauriInvoke(): TauriInternals['invoke'] {
  const tauriGlobal = globalThis as TauriGlobal;
  if (!isCoconutVisionRuntimeAvailable() || !tauriGlobal.__TAURI_INTERNALS__?.invoke) {
    throw new Error('Coconut Vision requer o runtime Tauri.');
  }
  return tauriGlobal.__TAURI_INTERNALS__.invoke;
}

function createCoconutVisionRequest(image: HTMLImageElement, background: RgbColor, threshold: number, minArea: number): CoconutVisionRequest {
  const analysisScale = Math.min(MIN_COUNT_INPUT, Math.sqrt(COCONUT_VISION_MAX_PIXELS / (image.naturalWidth * image.naturalHeight)));
  const width = Math.max(MIN_COUNT_INPUT, Math.round(image.naturalWidth * analysisScale));
  const height = Math.max(MIN_COUNT_INPUT, Math.round(image.naturalHeight * analysisScale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = getCanvasContext(canvas, true);
  context.drawImage(image, MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, width, height);
  const imageData = context.getImageData(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, width, height);

  return {
    width,
    height,
    sourceWidth: image.naturalWidth,
    sourceHeight: image.naturalHeight,
    rgba: Array.from(imageData.data),
    threshold,
    minArea,
    padding: Math.max(COMPONENT_PADDING_MIN, Math.round(COMPONENT_PADDING_BASE * analysisScale)),
    backgroundMode: 'auto',
    backgroundColor: { ...background, a: MAX_COLOR_CHANNEL },
    analysisScale
  };
}
