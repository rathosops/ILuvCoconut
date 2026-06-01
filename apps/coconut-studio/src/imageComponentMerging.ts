import {
  COMPONENT_ACCESSORY_AREA_RATIO,
  COMPONENT_STRONG_PROXIMITY_OVERLAP_RATIO,
  HALF_DIVISOR,
  MIN_NUMERIC_INPUT
} from './studioConstants';
import type { ComponentBounds } from './types';

export function mergeNearbyComponents(components: ComponentBounds[], padding: number): ComponentBounds[] {
  let merged = components.map((component) => ({ ...component }));
  let changed = true;

  while (changed) {
    changed = false;
    const next: ComponentBounds[] = [];

    for (const component of merged) {
      const target = next.find((candidate) => shouldMergeComponents(candidate, component, padding));
      if (!target) {
        next.push({ ...component });
        continue;
      }

      mergeInto(target, component);
      changed = true;
    }

    merged = next;
  }

  return merged;
}

function shouldMergeComponents(left: ComponentBounds, right: ComponentBounds, padding: number): boolean {
  if (!boxesOverlap(left, right, padding)) return false;
  if (isAccessoryComponent(left, right) || isAccessoryComponent(right, left)) return true;
  if (componentGap(left, right) > padding / HALF_DIVISOR) return false;

  return horizontalOverlapRatio(left, right) >= COMPONENT_STRONG_PROXIMITY_OVERLAP_RATIO
    || verticalOverlapRatio(left, right) >= COMPONENT_STRONG_PROXIMITY_OVERLAP_RATIO;
}

function mergeInto(target: ComponentBounds, component: ComponentBounds): void {
  target.minX = Math.min(target.minX, component.minX);
  target.minY = Math.min(target.minY, component.minY);
  target.maxX = Math.max(target.maxX, component.maxX);
  target.maxY = Math.max(target.maxY, component.maxY);
  target.area += component.area;
}

function boxesOverlap(left: ComponentBounds, right: ComponentBounds, padding: number): boolean {
  return left.minX - padding <= right.maxX
    && left.maxX + padding >= right.minX
    && left.minY - padding <= right.maxY
    && left.maxY + padding >= right.minY;
}

function isAccessoryComponent(candidate: ComponentBounds, anchor: ComponentBounds): boolean {
  return candidate.area <= anchor.area * COMPONENT_ACCESSORY_AREA_RATIO;
}

function componentGap(left: ComponentBounds, right: ComponentBounds): number {
  return Math.max(
    axisGap(left.minX, left.maxX, right.minX, right.maxX),
    axisGap(left.minY, left.maxY, right.minY, right.maxY)
  );
}

function axisGap(leftMin: number, leftMax: number, rightMin: number, rightMax: number): number {
  if (leftMax < rightMin) return rightMin - leftMax;
  if (rightMax < leftMin) return leftMin - rightMax;
  return MIN_NUMERIC_INPUT;
}

function horizontalOverlapRatio(left: ComponentBounds, right: ComponentBounds): number {
  return overlapRatio(left.minX, left.maxX, right.minX, right.maxX);
}

function verticalOverlapRatio(left: ComponentBounds, right: ComponentBounds): number {
  return overlapRatio(left.minY, left.maxY, right.minY, right.maxY);
}

function overlapRatio(leftMin: number, leftMax: number, rightMin: number, rightMax: number): number {
  const overlapMin = Math.max(leftMin, rightMin);
  const overlapMax = Math.min(leftMax, rightMax);
  if (overlapMax < overlapMin) return MIN_NUMERIC_INPUT;

  const overlap = overlapMax - overlapMin + 1;
  const leftSpan = leftMax - leftMin + 1;
  const rightSpan = rightMax - rightMin + 1;
  return overlap / Math.min(leftSpan, rightSpan);
}
