import {
  COMPONENT_SPLIT_ASPECT_RATIO,
  COMPONENT_SPLIT_MIN_AREA_RATIO,
  COMPONENT_SPLIT_SEARCH_MARGIN_RATIO,
  COMPONENT_SPLIT_VALLEY_RATIO,
  COMPONENT_SPLIT_WIDTH_RATIO,
  MIN_CONNECTED_COMPONENT_AREA,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT
} from './studioConstants';
import type { ComponentBounds } from './types';

export function splitWideComponents(mask: Uint8Array, width: number, components: ComponentBounds[], minArea: number): ComponentBounds[] {
  const medianWidth = median(components.map(componentWidth));

  return components.flatMap((component) => splitComponent(mask, width, component, medianWidth, minArea));
}

function splitComponent(mask: Uint8Array, imageWidth: number, component: ComponentBounds, medianWidth: number, minArea: number): ComponentBounds[] {
  if (!shouldTrySplit(component, medianWidth)) return [component];

  const projection = verticalProjection(mask, imageWidth, component);
  const maxProjection = Math.max(...projection);
  const splitOffset = findSplitOffset(projection, maxProjection);
  if (splitOffset === undefined) return [component];

  const splitX = component.minX + splitOffset;
  const left = boundsFromMask(mask, imageWidth, component, component.minX, splitX);
  const right = boundsFromMask(mask, imageWidth, component, splitX + MIN_COUNT_INPUT, component.maxX);
  const minSplitArea = Math.max(MIN_CONNECTED_COMPONENT_AREA, Math.round(minArea * COMPONENT_SPLIT_MIN_AREA_RATIO));

  return left && right && left.area >= minSplitArea && right.area >= minSplitArea ? [left, right] : [component];
}

function shouldTrySplit(component: ComponentBounds, medianWidth: number): boolean {
  const width = componentWidth(component);
  const height = componentHeight(component);

  return width >= medianWidth * COMPONENT_SPLIT_WIDTH_RATIO && width >= height * COMPONENT_SPLIT_ASPECT_RATIO;
}

function verticalProjection(mask: Uint8Array, imageWidth: number, component: ComponentBounds): number[] {
  const projection = new Array<number>(componentWidth(component)).fill(MIN_NUMERIC_INPUT);

  for (let y = component.minY; y <= component.maxY; y += MIN_COUNT_INPUT) {
    for (let x = component.minX; x <= component.maxX; x += MIN_COUNT_INPUT) {
      const offset = x - component.minX;
      if (mask[y * imageWidth + x]) projection[offset] = (projection[offset] ?? MIN_NUMERIC_INPUT) + MIN_COUNT_INPUT;
    }
  }

  return projection;
}

function findSplitOffset(projection: number[], maxProjection: number): number | undefined {
  if (maxProjection <= MIN_NUMERIC_INPUT) return undefined;
  const start = Math.floor(projection.length * COMPONENT_SPLIT_SEARCH_MARGIN_RATIO);
  const end = Math.ceil(projection.length * (MIN_COUNT_INPUT - COMPONENT_SPLIT_SEARCH_MARGIN_RATIO));
  let bestOffset = start;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let offset = start; offset <= end; offset += MIN_COUNT_INPUT) {
    const score = smoothedProjection(projection, offset);
    if (score < bestScore) {
      bestOffset = offset;
      bestScore = score;
    }
  }

  return bestScore <= maxProjection * COMPONENT_SPLIT_VALLEY_RATIO ? bestOffset : undefined;
}

function smoothedProjection(projection: number[], offset: number): number {
  const left = projection[offset - MIN_COUNT_INPUT] ?? projection[offset] ?? MIN_NUMERIC_INPUT;
  const center = projection[offset] ?? MIN_NUMERIC_INPUT;
  const right = projection[offset + MIN_COUNT_INPUT] ?? center;
  return (left + center + right) / (MIN_COUNT_INPUT + MIN_COUNT_INPUT + MIN_COUNT_INPUT);
}

function boundsFromMask(mask: Uint8Array, imageWidth: number, component: ComponentBounds, minX: number, maxX: number): ComponentBounds | undefined {
  let output: ComponentBounds | undefined;

  for (let y = component.minY; y <= component.maxY; y += MIN_COUNT_INPUT) {
    for (let x = minX; x <= maxX; x += MIN_COUNT_INPUT) {
      if (!mask[y * imageWidth + x]) continue;
      output = expandBounds(output, x, y);
    }
  }

  return output;
}

function expandBounds(bounds: ComponentBounds | undefined, x: number, y: number): ComponentBounds {
  if (!bounds) return { minX: x, minY: y, maxX: x, maxY: y, area: MIN_COUNT_INPUT };

  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
  bounds.area += MIN_COUNT_INPUT;
  return bounds;
}

function componentWidth(component: ComponentBounds): number {
  return component.maxX - component.minX + MIN_COUNT_INPUT;
}

function componentHeight(component: ComponentBounds): number {
  return component.maxY - component.minY + MIN_COUNT_INPUT;
}

function median(values: number[]): number {
  if (values.length === MIN_NUMERIC_INPUT) return MIN_COUNT_INPUT;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / (MIN_COUNT_INPUT + MIN_COUNT_INPUT))] ?? MIN_COUNT_INPUT;
}
