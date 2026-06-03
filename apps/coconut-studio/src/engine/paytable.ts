import {
  DEFAULT_PAYTABLE_LINE_BET,
  DEFAULT_PAYTABLE_MIN_MATCH,
  DEFAULT_PAYTABLE_PAYLINES,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT,
  PAYTABLE_BASE_FOUR_OF_KIND_MULTIPLIER,
  PAYTABLE_BASE_FULL_REEL_MULTIPLIER,
  PAYTABLE_BASE_THREE_OF_KIND_MULTIPLIER,
  PAYTABLE_FOUR_OF_KIND,
  PAYTABLE_FULL_REEL_DECAY_STEP,
  PAYTABLE_MAX_FOUR_OF_KIND_DECAY,
  PAYTABLE_MAX_FULL_REEL_DECAY,
  PAYTABLE_MAX_THREE_OF_KIND_DECAY,
  PAYTABLE_MIN_FOUR_OF_KIND_MULTIPLIER,
  PAYTABLE_MIN_FULL_REEL_MULTIPLIER,
  PAYTABLE_THREE_OF_KIND
} from './studioConstants';
import type { StudioPayline, StudioPaytable, StudioPayout, StudioState, StudioSymbol, StudioSymbolPay } from './types';

export function createDefaultPaytable(reels: number, rows: number): StudioPaytable {
  return {
    bonusTriggersAnywhere: true,
    evaluation: 'leftToRight',
    highestWinOnlyPerLine: true,
    lineBet: DEFAULT_PAYTABLE_LINE_BET,
    minMatch: DEFAULT_PAYTABLE_MIN_MATCH,
    paylines: createDefaultPaylines(reels, rows),
    scatterPaysAnywhere: true,
    selectedPaylineId: 'line.01',
    selectedSymbolId: '',
    symbolPays: [],
    wildSubstitutes: true
  };
}

export function resetPaytable(state: StudioState): void {
  state.paytable = createDefaultPaytable(state.slotLayout.reels, state.slotLayout.rows);
  syncPaytableWithState(state);
}

export function syncPaytableWithState(state: StudioState): void {
  syncSymbolPays(state);
  syncPaylines(state);
}

export function createDefaultPayouts(symbolIndex: number, reels: number): StudioPayout[] {
  return createPayoutCounts(reels).map((count) => ({
    count,
    multiplier: createDefaultMultiplier(count, symbolIndex, reels)
  }));
}

export function createDefaultPaylines(reels: number, rows: number): StudioPayline[] {
  const patterns = createDefaultPaylinePatterns(reels, rows);
  return patterns.map((pattern, order) => ({
    enabled: true,
    id: `line.${String(order + MIN_COUNT_INPUT).padStart(2, '0')}`,
    order,
    pattern
  }));
}

export function formatPaylinePattern(pattern: number[]): string {
  return pattern.join(',');
}

export function parsePaylinePattern(value: string, reels: number): number[] {
  const rows = value
    .split(/[,\s]+/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part));

  if (rows.length === reels && rows.every(Number.isInteger)) return rows;
  return Array.from({ length: reels }, () => MIN_NUMERIC_INPUT);
}

function syncSymbolPays(state: StudioState): void {
  const existing = new Map(state.paytable.symbolPays.map((symbolPay) => [symbolPay.symbolId, symbolPay]));
  state.paytable.symbolPays = state.symbols
    .filter((symbol) => symbol.role !== 'decorative')
    .sort((left, right) => left.order - right.order)
    .map((symbol, index) => mergeSymbolPay(symbol, existing.get(symbol.id), index, state.slotLayout.reels));

  if (!state.paytable.symbolPays.some((symbolPay) => symbolPay.symbolId === state.paytable.selectedSymbolId)) {
    state.paytable.selectedSymbolId = state.paytable.symbolPays[MIN_NUMERIC_INPUT]?.symbolId ?? '';
  }
}

function syncPaylines(state: StudioState): void {
  const { paylines } = state.paytable;
  if (paylines.length === MIN_NUMERIC_INPUT) {
    state.paytable.paylines = createDefaultPaylines(state.slotLayout.reels, state.slotLayout.rows);
  } else {
    state.paytable.paylines = paylines.map((payline, order) => ({
      ...payline,
      order,
      pattern: normalizePaylinePattern(payline.pattern, state.slotLayout.reels, state.slotLayout.rows)
    }));
  }

  if (!state.paytable.paylines.some((payline) => payline.id === state.paytable.selectedPaylineId)) {
    state.paytable.selectedPaylineId = state.paytable.paylines[MIN_NUMERIC_INPUT]?.id ?? '';
  }
}

function mergeSymbolPay(symbol: StudioSymbol, existing: StudioSymbolPay | undefined, symbolIndex: number, reels: number): StudioSymbolPay {
  const existingPayouts = new Map(existing?.payouts.map((payout) => [payout.count, payout.multiplier]) ?? []);
  return {
    symbolId: symbol.id,
    role: symbol.role,
    payouts: createDefaultPayouts(symbolIndex, reels).map((payout) => ({
      ...payout,
      multiplier: existingPayouts.get(payout.count) ?? payout.multiplier
    }))
  };
}

function createDefaultPaylinePatterns(reels: number, rows: number): number[][] {
  const middleRow = Math.floor(Math.max(MIN_NUMERIC_INPUT, rows - MIN_COUNT_INPUT) / 2);
  const topRow = MIN_NUMERIC_INPUT;
  const bottomRow = Math.max(MIN_NUMERIC_INPUT, rows - MIN_COUNT_INPUT);
  const candidates = [middleRow, topRow, bottomRow]
    .filter((row, index, allRows) => allRows.indexOf(row) === index)
    .slice(MIN_NUMERIC_INPUT, DEFAULT_PAYTABLE_PAYLINES);

  return candidates.map((row) => Array.from({ length: reels }, () => row));
}

function normalizePaylinePattern(pattern: number[], reels: number, rows: number): number[] {
  return Array.from({ length: reels }, (_, index) => {
    const row = pattern[index] ?? MIN_NUMERIC_INPUT;
    return Math.max(MIN_NUMERIC_INPUT, Math.min(Math.max(MIN_NUMERIC_INPUT, rows - MIN_COUNT_INPUT), row));
  });
}

function createPayoutCounts(reels: number): number[] {
  return [PAYTABLE_THREE_OF_KIND, PAYTABLE_FOUR_OF_KIND, reels]
    .filter((count) => count <= reels)
    .filter((count, index, counts) => counts.indexOf(count) === index);
}

function createDefaultMultiplier(count: number, symbolIndex: number, reels: number): number {
  if (count === PAYTABLE_THREE_OF_KIND) {
    return Math.max(MIN_COUNT_INPUT, PAYTABLE_BASE_THREE_OF_KIND_MULTIPLIER - Math.min(symbolIndex, PAYTABLE_MAX_THREE_OF_KIND_DECAY));
  }

  if (count === PAYTABLE_FOUR_OF_KIND && reels > PAYTABLE_FOUR_OF_KIND) {
    return Math.max(PAYTABLE_MIN_FOUR_OF_KIND_MULTIPLIER, PAYTABLE_BASE_FOUR_OF_KIND_MULTIPLIER - Math.min(symbolIndex, PAYTABLE_MAX_FOUR_OF_KIND_DECAY));
  }

  return Math.max(
    PAYTABLE_MIN_FULL_REEL_MULTIPLIER,
    PAYTABLE_BASE_FULL_REEL_MULTIPLIER - Math.min(symbolIndex * PAYTABLE_FULL_REEL_DECAY_STEP, PAYTABLE_MAX_FULL_REEL_DECAY)
  );
}
