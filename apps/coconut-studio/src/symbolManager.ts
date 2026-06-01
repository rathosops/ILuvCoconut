import { MIN_COUNT_INPUT, MIN_NUMERIC_INPUT } from './studioConstants';
import { getFrames } from './frameMath';
import type { FrameRect, StudioState, StudioSymbol } from './types';

export function syncSymbolsWithFrames(state: StudioState, assetPrefix: string): void {
  const frames = getFrames(state);
  const existing = new Map(state.symbols.map((symbol) => [symbol.frameIndex, symbol]));

  state.symbols = frames
    .map((frame, order) => {
      const current = existing.get(frame.index);
      return current ? { ...current, order } : createDefaultSymbol(frame, order, assetPrefix);
    })
    .sort((left, right) => left.order - right.order)
    .map((symbol, order) => ({ ...symbol, order }));
}

export function getSelectedSymbol(state: StudioState): StudioSymbol | undefined {
  return state.symbols.find((symbol) => symbol.frameIndex === state.selectedFrame);
}

export function updateSelectedSymbol(state: StudioState, patch: Partial<Pick<StudioSymbol, 'id' | 'label' | 'role'>>): void {
  state.symbols = state.symbols.map((symbol) => (symbol.frameIndex === state.selectedFrame ? { ...symbol, ...patch } : symbol));
}

export function moveSelectedSymbol(state: StudioState, direction: -1 | 1): void {
  const ordered = [...state.symbols].sort((left, right) => left.order - right.order);
  const currentIndex = ordered.findIndex((symbol) => symbol.frameIndex === state.selectedFrame);
  const targetIndex = currentIndex + direction;
  if (currentIndex < MIN_NUMERIC_INPUT || targetIndex < MIN_NUMERIC_INPUT || targetIndex >= ordered.length) return;

  const current = ordered[currentIndex];
  const target = ordered[targetIndex];
  if (!current || !target) return;

  ordered[currentIndex] = target;
  ordered[targetIndex] = current;
  state.symbols = ordered.map((symbol, order) => ({ ...symbol, order }));
}

export function removeSymbolForFrame(state: StudioState, frameIndex: number): void {
  state.symbols = state.symbols
    .filter((symbol) => symbol.frameIndex !== frameIndex)
    .map((symbol) => ({
      ...symbol,
      frameIndex: symbol.frameIndex > frameIndex ? symbol.frameIndex - MIN_COUNT_INPUT : symbol.frameIndex
    }))
    .sort((left, right) => left.order - right.order)
    .map((symbol, order) => ({ ...symbol, order }));
}

export function getDuplicateSymbolIds(symbols: StudioSymbol[]): string[] {
  const counts = new Map<string, number>();
  for (const symbol of symbols) {
    counts.set(symbol.id, (counts.get(symbol.id) ?? MIN_NUMERIC_INPUT) + MIN_COUNT_INPUT);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > MIN_COUNT_INPUT)
    .map(([id]) => id);
}

function createDefaultSymbol(frame: FrameRect, order: number, assetPrefix: string): StudioSymbol {
  const assetKey = `${assetPrefix}-${String(order + MIN_COUNT_INPUT).padStart(2, '0')}`;
  return {
    assetKey,
    frameIndex: frame.index,
    id: `symbol.${assetKey}`,
    label: toTitle(assetKey),
    order,
    role: 'regular'
  };
}

function toTitle(value: string): string {
  return value
    .split(/[-_.\s]+/u)
    .filter(Boolean)
    .map((part) => `${part.charAt(MIN_NUMERIC_INPUT).toUpperCase()}${part.slice(MIN_COUNT_INPUT)}`)
    .join(' ');
}
