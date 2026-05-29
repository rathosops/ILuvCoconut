import { getCanvasContext } from './dom';
import {
  ANALYSIS_MAX_PIXELS,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT
} from './studioConstants';
import type { DetectionSummary, FrameRect, RgbColor } from './types';

interface CoconutVisionRequest {
  width: number;
  height: number;
  rgba: number[];
  threshold: number;
  minArea: number;
  padding: number;
  backgroundMode: 'auto';
  analysisScale: number;
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

export interface CoconutVisionDetectionResult {
  frames: FrameRect[];
  summary: DetectionSummary;
}

export async function detectFiguresWithCoconutVision(
  image: HTMLImageElement,
  _background: RgbColor,
  threshold: number,
  minArea: number
): Promise<CoconutVisionDetectionResult> {
  const { invoke } = await import('@tauri-apps/api/core');
  const request = createCoconutVisionRequest(image, threshold, minArea);
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

function createCoconutVisionRequest(image: HTMLImageElement, threshold: number, minArea: number): CoconutVisionRequest {
  const analysisScale = Math.min(MIN_COUNT_INPUT, Math.sqrt(ANALYSIS_MAX_PIXELS / (image.naturalWidth * image.naturalHeight)));
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
    rgba: Array.from(imageData.data),
    threshold,
    minArea,
    padding: MIN_NUMERIC_INPUT,
    backgroundMode: 'auto',
    analysisScale
  };
}
