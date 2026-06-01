import type { GameConfig, SlotProjectDraft, ThemeConfig } from '@iluvcoconut/contracts';
import { MIN_COUNT_INPUT } from './studioConstants';

const BET_MIN = 0.2;
const BET_HALF = 0.5;
const BET_TWO = 2;
const BET_FIVE = 5;
const BET_TEN = 10;
const BET_MAX = 100;

export function createGameConfigFromDraft(draft: SlotProjectDraft): GameConfig {
  return {
    id: draft.gameId,
    title: draft.title,
    template: `${draft.projectType}-${draft.slot.reels}x${draft.slot.rows}-classic`,
    layout: {
      reels: draft.slot.reels,
      rows: draft.slot.rows,
      mode: draft.slot.paylinesMode === 'ways' ? 'ways' : 'paylines'
    },
    bet: {
      default: draft.slot.defaultBet,
      min: BET_MIN,
      max: BET_MAX,
      denominations: [BET_MIN, BET_HALF, MIN_COUNT_INPUT, BET_TWO, BET_FIVE, BET_TEN]
    },
    symbols: draft.symbols
      .filter((symbol) => symbol.role !== 'decorative' && symbol.role !== 'multiplier')
      .map((symbol) => ({
        id: symbol.id,
        type: symbol.role === 'regular' || symbol.role === 'wild' || symbol.role === 'scatter' || symbol.role === 'bonus' ? symbol.role : 'regular'
      })),
    presentation: {
      spinDurationMs: 1300,
      reelStopDelayMs: 180,
      winCycleDelayMs: 1200,
      turboMode: true,
      quickSpin: true
    },
    assetManifest: {
      gameId: draft.gameId,
      version: '0.1.0',
      assets: draft.symbols.map((symbol) => ({
        id: symbol.assetKey,
        type: 'image',
        src: `assets/optimized/pixi/symbols.webp#${symbol.assetKey}`,
        scope: 'base'
      }))
    }
  };
}

export function createThemeConfigFromDraft(draft: SlotProjectDraft): ThemeConfig {
  return {
    background: {
      portrait: 'assets/optimized/common/background-portrait.webp',
      landscape: 'assets/optimized/common/background-landscape.webp'
    },
    symbols: Object.fromEntries(draft.symbols.map((symbol) => [symbol.id, `assets/optimized/pixi/symbols.webp#${symbol.assetKey}`])),
    audio: {},
    ui: {}
  };
}

export function createPaytableConfigFromDraft(draft: SlotProjectDraft): object {
  return {
    mode: draft.slot.paylinesMode === 'ways' ? 'ways' : 'paylines',
    paylines: draft.paytable.paylines.filter((payline) => payline.enabled).map((payline) => payline.pattern),
    rules: draft.paytable.rules,
    payouts: Object.fromEntries(draft.paytable.symbolPays.map((symbolPay) => [
      symbolPay.symbolId,
      Object.fromEntries(symbolPay.payouts.map((payout) => [String(payout.count), payout.multiplier]))
    ])),
    fixtures: createPaytableFixtures(draft)
  };
}

function createPaytableFixtures(draft: SlotProjectDraft): object {
  const payableSymbols = draft.paytable.symbolPays.map((symbolPay) => symbolPay.symbolId);
  const fallbackSymbol = draft.symbols.find((symbol) => symbol.role !== 'decorative')?.id ?? 'symbol.missing';
  const primarySymbol = payableSymbols[0] ?? fallbackSymbol;
  const secondarySymbol = payableSymbols.find((symbolId) => symbolId !== primarySymbol) ?? fallbackSymbol;
  const minMatch = Math.min(draft.paytable.rules.minMatch, draft.slot.reels);

  return {
    noWin: createFixtureMatrix(draft.slot.reels, draft.slot.rows, (reel, row) => payableSymbols[(reel + row) % Math.max(MIN_COUNT_INPUT, payableSymbols.length)] ?? fallbackSymbol),
    smallWin: createFixtureMatrix(draft.slot.reels, draft.slot.rows, (reel, row) => {
      if (row === MIN_COUNT_INPUT && reel < minMatch) return primarySymbol;
      return secondarySymbol;
    }),
    bigWin: createFixtureMatrix(draft.slot.reels, draft.slot.rows, (_reel, row) => (row === MIN_COUNT_INPUT ? primarySymbol : secondarySymbol))
  };
}

function createFixtureMatrix(reels: number, rows: number, selectSymbol: (reel: number, row: number) => string): string[][] {
  return Array.from({ length: reels }, (_reelValue, reel) => Array.from({ length: rows }, (_rowValue, row) => selectSymbol(reel, row)));
}
