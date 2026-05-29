import {
  ALPHA_CHANNEL_OFFSET,
  ANALYSIS_MAX_PIXELS,
  ANALYSIS_SAMPLE_LAST_PIXEL,
  ANALYSIS_SAMPLE_MID_PIXEL,
  ANALYSIS_SAMPLE_SIZE,
  BLUE_CHANNEL_OFFSET,
  COMPONENT_MERGE_PADDING_MIN,
  COMPONENT_MERGE_PADDING_RATIO,
  CONNECTED_COMPONENT_NEIGHBOR_COUNT,
  GREEN_CHANNEL_OFFSET,
  HALF_DIVISOR,
  MAX_COLOR_CHANNEL,
  MIN_ALPHA_FOR_FOREGROUND,
  MIN_CONNECTED_COMPONENT_AREA,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT,
  MORPHOLOGY_KERNEL_RADIUS,
  RGBA_STRIDE
} from './studioConstants';
import { getCanvasContext } from './dom';
import { componentBoundsToFrames } from './frameMath';
import type { ComponentBounds, DetectionSummary, FrameRect, RgbColor } from './types';

export interface HeuristicDetectionResult {
  frames: FrameRect[];
  summary: DetectionSummary;
}

export function detectFigureFramesWithHeuristic(
  image: HTMLImageElement,
  background: RgbColor,
  threshold: number,
  minArea: number
): FrameRect[] {
  return detectFiguresWithHeuristic(image, background, threshold, minArea).frames;
}

export function detectFiguresWithHeuristic(
  image: HTMLImageElement,
  background: RgbColor,
  threshold: number,
  minArea: number
): HeuristicDetectionResult {
  const startedAt = performance.now();
  const scale = Math.min(MIN_COUNT_INPUT, Math.sqrt(ANALYSIS_MAX_PIXELS / (image.naturalWidth * image.naturalHeight)));
  const width = Math.max(MIN_COUNT_INPUT, Math.round(image.naturalWidth * scale));
  const height = Math.max(MIN_COUNT_INPUT, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = getCanvasContext(canvas, true);
  context.drawImage(image, MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, width, height);
  const imageData = context.getImageData(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, width, height);
  const mask = cleanForegroundMask(createForegroundMask(imageData, background, threshold), width, height);
  const scaledMinArea = Math.max(MIN_CONNECTED_COMPONENT_AREA, Math.round(minArea * scale * scale));
  const frames = componentBoundsToFrames(connectedComponents(mask, width, height, scaledMinArea), image.naturalWidth, image.naturalHeight, scale);

  return {
    frames,
    summary: {
      backend: 'heuristic',
      figureCount: frames.length,
      rowCount: countRows(frames),
      figuresByRow: countFiguresByRow(frames),
      analysisScale: scale,
      elapsedMs: Math.round(performance.now() - startedAt)
    }
  };
}

export function sampleBackgroundColor(image: HTMLImageElement): RgbColor {
  const canvas = document.createElement('canvas');
  canvas.width = ANALYSIS_SAMPLE_SIZE;
  canvas.height = ANALYSIS_SAMPLE_SIZE;
  const context = getCanvasContext(canvas, true);
  context.drawImage(image, MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, ANALYSIS_SAMPLE_SIZE, ANALYSIS_SAMPLE_SIZE);
  const imageData = context.getImageData(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, ANALYSIS_SAMPLE_SIZE, ANALYSIS_SAMPLE_SIZE);
  const points = [
    [MIN_COUNT_INPUT, MIN_COUNT_INPUT],
    [ANALYSIS_SAMPLE_LAST_PIXEL, MIN_COUNT_INPUT],
    [MIN_COUNT_INPUT, ANALYSIS_SAMPLE_LAST_PIXEL],
    [ANALYSIS_SAMPLE_LAST_PIXEL, ANALYSIS_SAMPLE_LAST_PIXEL],
    [ANALYSIS_SAMPLE_MID_PIXEL, MIN_COUNT_INPUT],
    [MIN_COUNT_INPUT, ANALYSIS_SAMPLE_MID_PIXEL],
    [ANALYSIS_SAMPLE_LAST_PIXEL, ANALYSIS_SAMPLE_MID_PIXEL],
    [ANALYSIS_SAMPLE_MID_PIXEL, ANALYSIS_SAMPLE_LAST_PIXEL]
  ] as const;

  return medianColor(points.map(([x, y]) => {
    const index = (y * imageData.width + x) * RGBA_STRIDE;
    return {
      r: imageData.data[index] ?? MIN_NUMERIC_INPUT,
      g: imageData.data[index + GREEN_CHANNEL_OFFSET] ?? MIN_NUMERIC_INPUT,
      b: imageData.data[index + BLUE_CHANNEL_OFFSET] ?? MIN_NUMERIC_INPUT
    };
  }));
}

function createForegroundMask(imageData: ImageData, background: RgbColor, threshold: number): Uint8Array {
  const mask = new Uint8Array(imageData.width * imageData.height);
  const data = imageData.data;

  for (let i = MIN_NUMERIC_INPUT, pixel = MIN_NUMERIC_INPUT; i < data.length; i += RGBA_STRIDE, pixel += MIN_COUNT_INPUT) {
    const alpha = data[i + ALPHA_CHANNEL_OFFSET] ?? MAX_COLOR_CHANNEL;
    const distance = colorDistance(
      {
        r: data[i] ?? MIN_NUMERIC_INPUT,
        g: data[i + GREEN_CHANNEL_OFFSET] ?? MIN_NUMERIC_INPUT,
        b: data[i + BLUE_CHANNEL_OFFSET] ?? MIN_NUMERIC_INPUT
      },
      background
    );
    mask[pixel] = alpha > MIN_ALPHA_FOR_FOREGROUND && distance > threshold ? MIN_COUNT_INPUT : MIN_NUMERIC_INPUT;
  }

  return mask;
}

function connectedComponents(mask: Uint8Array, width: number, height: number, minArea: number): ComponentBounds[] {
  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  const components: ComponentBounds[] = [];
  const neighborDeltas = [
    { dx: -MIN_COUNT_INPUT, dy: MIN_NUMERIC_INPUT },
    { dx: MIN_COUNT_INPUT, dy: MIN_NUMERIC_INPUT },
    { dx: MIN_NUMERIC_INPUT, dy: -MIN_COUNT_INPUT },
    { dx: MIN_NUMERIC_INPUT, dy: MIN_COUNT_INPUT },
    { dx: -MIN_COUNT_INPUT, dy: -MIN_COUNT_INPUT },
    { dx: MIN_COUNT_INPUT, dy: -MIN_COUNT_INPUT },
    { dx: -MIN_COUNT_INPUT, dy: MIN_COUNT_INPUT },
    { dx: MIN_COUNT_INPUT, dy: MIN_COUNT_INPUT }
  ] as const;
  let tail = MIN_NUMERIC_INPUT;

  for (let start = MIN_NUMERIC_INPUT; start < mask.length; start += MIN_COUNT_INPUT) {
    if (visited[start] || !mask[start]) continue;
    let head = MIN_NUMERIC_INPUT;
    tail = MIN_NUMERIC_INPUT;
    queue[tail] = start;
    tail += MIN_COUNT_INPUT;
    visited[start] = MIN_COUNT_INPUT;
    const startX = start % width;
    const startY = Math.floor(start / width);
    const bounds: ComponentBounds = { minX: startX, minY: startY, maxX: startX, maxY: startY, area: MIN_NUMERIC_INPUT };

    while (head < tail) {
      const pixel = queue[head] ?? MIN_NUMERIC_INPUT;
      head += MIN_COUNT_INPUT;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      bounds.area += MIN_COUNT_INPUT;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
      for (let offsetIndex = MIN_NUMERIC_INPUT; offsetIndex < CONNECTED_COMPONENT_NEIGHBOR_COUNT; offsetIndex += MIN_COUNT_INPUT) {
        const delta = neighborDeltas[offsetIndex] ?? neighborDeltas[MIN_NUMERIC_INPUT];
        const nextX = x + delta.dx;
        const nextY = y + delta.dy;
        enqueueNeighbor(nextY * width + nextX, nextX >= MIN_NUMERIC_INPUT && nextY >= MIN_NUMERIC_INPUT && nextX < width && nextY < height);
      }
    }

    if (bounds.area >= minArea) components.push(bounds);
  }

  return mergeNearbyComponents(components, Math.max(COMPONENT_MERGE_PADDING_MIN, Math.round(Math.min(width, height) * COMPONENT_MERGE_PADDING_RATIO)));

  function enqueueNeighbor(pixel: number, valid: boolean): void {
    if (!valid || visited[pixel] || !mask[pixel]) return;
    visited[pixel] = MIN_COUNT_INPUT;
    queue[tail] = pixel;
    tail += MIN_COUNT_INPUT;
  }
}

function mergeNearbyComponents(components: ComponentBounds[], padding: number): ComponentBounds[] {
  let merged = components.map((component) => ({ ...component }));
  let changed = true;

  while (changed) {
    changed = false;
    const next: ComponentBounds[] = [];

    for (const component of merged) {
      const target = next.find((candidate) => boxesOverlap(candidate, component, padding));
      if (!target) {
        next.push({ ...component });
        continue;
      }

      target.minX = Math.min(target.minX, component.minX);
      target.minY = Math.min(target.minY, component.minY);
      target.maxX = Math.max(target.maxX, component.maxX);
      target.maxY = Math.max(target.maxY, component.maxY);
      target.area += component.area;
      changed = true;
    }

    merged = next;
  }

  return merged;
}

function cleanForegroundMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  return dilateMask(erodeMask(dilateMask(mask, width, height), width, height), width, height);
}

function erodeMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const output = new Uint8Array(mask.length);

  for (let y = MIN_NUMERIC_INPUT; y < height; y += MIN_COUNT_INPUT) {
    for (let x = MIN_NUMERIC_INPUT; x < width; x += MIN_COUNT_INPUT) {
      const pixel = y * width + x;
      output[pixel] = hasFullNeighborhood(mask, x, y, width, height) ? MIN_COUNT_INPUT : MIN_NUMERIC_INPUT;
    }
  }

  return output;
}

function dilateMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const output = new Uint8Array(mask.length);

  for (let y = MIN_NUMERIC_INPUT; y < height; y += MIN_COUNT_INPUT) {
    for (let x = MIN_NUMERIC_INPUT; x < width; x += MIN_COUNT_INPUT) {
      const pixel = y * width + x;
      output[pixel] = hasAnyNeighborhood(mask, x, y, width, height) ? MIN_COUNT_INPUT : MIN_NUMERIC_INPUT;
    }
  }

  return output;
}

function hasFullNeighborhood(mask: Uint8Array, x: number, y: number, width: number, height: number): boolean {
  for (let dy = -MORPHOLOGY_KERNEL_RADIUS; dy <= MORPHOLOGY_KERNEL_RADIUS; dy += MIN_COUNT_INPUT) {
    for (let dx = -MORPHOLOGY_KERNEL_RADIUS; dx <= MORPHOLOGY_KERNEL_RADIUS; dx += MIN_COUNT_INPUT) {
      const nextX = x + dx;
      const nextY = y + dy;
      if (nextX < MIN_NUMERIC_INPUT || nextY < MIN_NUMERIC_INPUT || nextX >= width || nextY >= height) return false;
      if (!mask[nextY * width + nextX]) return false;
    }
  }

  return true;
}

function hasAnyNeighborhood(mask: Uint8Array, x: number, y: number, width: number, height: number): boolean {
  for (let dy = -MORPHOLOGY_KERNEL_RADIUS; dy <= MORPHOLOGY_KERNEL_RADIUS; dy += MIN_COUNT_INPUT) {
    for (let dx = -MORPHOLOGY_KERNEL_RADIUS; dx <= MORPHOLOGY_KERNEL_RADIUS; dx += MIN_COUNT_INPUT) {
      const nextX = x + dx;
      const nextY = y + dy;
      if (nextX < MIN_NUMERIC_INPUT || nextY < MIN_NUMERIC_INPUT || nextX >= width || nextY >= height) continue;
      if (mask[nextY * width + nextX]) return true;
    }
  }

  return false;
}

function boxesOverlap(left: ComponentBounds, right: ComponentBounds, padding: number): boolean {
  return left.minX - padding <= right.maxX
    && left.maxX + padding >= right.minX
    && left.minY - padding <= right.maxY
    && left.maxY + padding >= right.minY;
}

function medianColor(samples: RgbColor[]): RgbColor {
  return {
    r: median(samples.map((sample) => sample.r)),
    g: median(samples.map((sample) => sample.g)),
    b: median(samples.map((sample) => sample.b))
  };
}

function median(values: number[]): number {
  return [...values].sort((left, right) => left - right)[Math.floor(values.length / HALF_DIVISOR)] ?? MIN_NUMERIC_INPUT;
}

function colorDistance(left: RgbColor, right: RgbColor): number {
  const red = left.r - right.r;
  const green = left.g - right.g;
  const blue = left.b - right.b;
  return Math.sqrt(red * red + green * green + blue * blue);
}

function countRows(frames: FrameRect[]): number {
  return new Set(frames.map((frame) => frame.row)).size;
}

function countFiguresByRow(frames: FrameRect[]): number[] {
  const rowCount = countRows(frames);
  return Array.from({ length: rowCount }, (_, row) => frames.filter((frame) => frame.row === row).length);
}
