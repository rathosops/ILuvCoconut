import type {
  PaytableDraft,
  SlotDraft,
  SlotProjectDraft,
  SymbolDraft,
  ThemeDraft
} from '@iluvcoconut/contracts';
import {
  HALF_DIVISOR,
  JSON_INDENT_SPACES,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT
} from './studioConstants';
import { getFrames } from './frameMath';
import { createGameConfigFromDraft, createPaytableConfigFromDraft, createThemeConfigFromDraft } from './slotConfigExport';
import { getDuplicateSymbolIds } from './symbolManager';
import type { FrameRect, StudioState, StudioSymbol } from './types';

export interface SlotProjectInput {
  assetPrefix: string;
  exportPlan: object;
  gameId: string;
  state: StudioState;
}

export interface JsonPreviewState {
  exportPlan: object;
  gameConfig: object;
  paytableConfig: object;
  slotDraft: SlotProjectDraft;
  themeConfig: object;
  validation: string[];
}

const DEFAULT_LAYERS: ThemeDraft['layers'] = ['background', 'reelFrame', 'reelMask', 'symbols', 'symbolEffects', 'winLines', 'ui', 'modal', 'debugOverlay'];
export function createJsonPreviewState(input: SlotProjectInput): JsonPreviewState {
  const slotDraft = createSlotProjectDraft(input);
  const gameConfig = createGameConfigFromDraft(slotDraft);
  const themeConfig = createThemeConfigFromDraft(slotDraft);
  const paytableConfig = createPaytableConfigFromDraft(slotDraft);

  return {
    exportPlan: input.exportPlan,
    gameConfig,
    paytableConfig,
    slotDraft,
    themeConfig,
    validation: validateSlotProjectDraft(slotDraft)
  };
}

export function stringifyJsonPreview(value: unknown): string {
  return JSON.stringify(value, null, JSON_INDENT_SPACES);
}

function createSlotProjectDraft({ assetPrefix, exportPlan, gameId, state }: SlotProjectInput): SlotProjectDraft {
  const symbols = createSymbolDrafts(getFrames(state), assetPrefix, state);
  const slot = createSlotDraft(state);
  const paytable = createPaytableDraft(state);
  const theme = createThemeDraft(symbols);

  return {
    schemaVersion: 1,
    projectType: 'slot',
    gameId,
    title: toTitle(gameId),
    language: state.language,
    symbols,
    slot,
    paytable,
    theme,
    exportPlan
  };
}

function createSymbolDrafts(frames: FrameRect[], assetPrefix: string, state: StudioState): SymbolDraft[] {
  const symbolsByFrame = new Map(state.symbols.map((symbol) => [symbol.frameIndex, symbol]));
  return frames
    .map((frame, fallbackOrder) => [frame, symbolsByFrame.get(frame.index) ?? createFallbackSymbol(frame, fallbackOrder, assetPrefix)] as const)
    .sort(([, left], [, right]) => left.order - right.order)
    .map(([frame, symbol], order) => {
    return {
      id: symbol.id,
      label: symbol.label,
      role: symbol.role,
      order,
      frame: { ...frame },
      assetKey: symbol.assetKey,
      source: {
        imageName: state.imageName ?? null,
        detectionBackend: state.detectionBackend,
        detectionIndex: frame.index
      },
      render: {
        layer: 'symbols',
        anchorX: 0.5,
        anchorY: 0.5,
        fit: 'contain'
      }
    };
  });
}

function createSlotDraft(state: StudioState): SlotDraft {
  const { cellHeight, cellWidth, desktopHeight, desktopWidth, mobileHeight, mobileWidth, reelGap, reels, rowGap, rows } = state.slotLayout;
  const reelsWidth = reels * cellWidth + (reels - MIN_COUNT_INPUT) * reelGap;
  const reelsHeight = rows * cellHeight + (rows - MIN_COUNT_INPUT) * rowGap;

  return {
    reels,
    rows,
    visibleRows: rows,
    cellWidth,
    cellHeight,
    reelGap,
    rowGap,
    spinDirection: 'vertical',
    defaultBet: MIN_COUNT_INPUT,
    paylinesMode: 'fixed',
    layout: {
      designWidth: desktopWidth,
      designHeight: desktopHeight,
      orientation: 'responsive',
      safeArea: { top: MIN_NUMERIC_INPUT, right: MIN_NUMERIC_INPUT, bottom: MIN_NUMERIC_INPUT, left: MIN_NUMERIC_INPUT },
      breakpoints: [
        {
          id: 'desktop',
          minWidth: 1024,
          scaleMode: 'fit',
          reelsRect: centeredRect(desktopWidth, desktopHeight, reelsWidth, reelsHeight),
          uiSlots: {}
        },
        {
          id: 'mobile',
          minWidth: MIN_NUMERIC_INPUT,
          maxWidth: 767,
          scaleMode: 'fit',
          reelsRect: centeredRect(mobileWidth, mobileHeight, reelsWidth, reelsHeight),
          uiSlots: {}
        }
      ]
    }
  };
}

function createPaytableDraft(state: StudioState): PaytableDraft {
  return {
    currencyMode: 'credits',
    lineBet: state.paytable.lineBet,
    paylines: state.paytable.paylines.map((payline) => ({ ...payline, pattern: [...payline.pattern] })),
    symbolPays: state.paytable.symbolPays.map((symbolPay) => ({
      symbolId: symbolPay.symbolId,
      role: symbolPay.role,
      payouts: symbolPay.payouts.map((payout) => ({ ...payout }))
    })),
    rules: {
      evaluation: state.paytable.evaluation,
      minMatch: state.paytable.minMatch,
      wildSubstitutes: state.paytable.wildSubstitutes,
      scatterPaysAnywhere: state.paytable.scatterPaysAnywhere,
      bonusTriggersAnywhere: state.paytable.bonusTriggersAnywhere,
      highestWinOnlyPerLine: state.paytable.highestWinOnlyPerLine
    }
  };
}

function createThemeDraft(symbols: SymbolDraft[]): ThemeDraft {
  return {
    layers: DEFAULT_LAYERS,
    symbols: Object.fromEntries(symbols.map((symbol) => [
      symbol.id,
      {
        asset: symbol.assetKey,
        fit: symbol.render.fit,
        anchor: [symbol.render.anchorX, symbol.render.anchorY]
      }
    ]))
  };
}

function validateSlotProjectDraft(draft: SlotProjectDraft): string[] {
  const issues: string[] = [];
  if (!draft.gameId.trim()) issues.push('gameId precisa estar preenchido.');
  if (!draft.symbols.some((symbol) => symbol.role === 'regular')) issues.push('Inclua pelo menos um simbolo regular.');
  const duplicateIds = getDuplicateSymbolIds(draft.symbols.map((symbol) => ({
    assetKey: symbol.assetKey,
    frameIndex: symbol.frame.index,
    id: symbol.id,
    label: symbol.label,
    order: symbol.order,
    role: symbol.role
  })));
  if (duplicateIds.length > MIN_NUMERIC_INPUT) issues.push(`IDs duplicados: ${duplicateIds.join(', ')}.`);
  if (draft.slot.reels <= MIN_NUMERIC_INPUT || draft.slot.rows <= MIN_NUMERIC_INPUT) issues.push('Grade do slot precisa ter reels e linhas maiores que zero.');

  issues.push(...validatePaytableRules(draft));
  issues.push(...validatePaylines(draft));
  issues.push(...validateSymbolPays(draft));

  return issues;
}

function validatePaytableRules(draft: SlotProjectDraft): string[] {
  const issues: string[] = [];
  if (draft.paytable.lineBet <= MIN_NUMERIC_INPUT) issues.push('Aposta por linha precisa ser maior que zero.');
  if (draft.paytable.rules.minMatch < MIN_COUNT_INPUT || draft.paytable.rules.minMatch > draft.slot.reels) {
    issues.push(`Minimo de combinacao precisa ficar entre 1 e ${draft.slot.reels}.`);
  }
  if (!draft.paytable.paylines.some((payline) => payline.enabled)) issues.push('Inclua pelo menos uma linha ativa.');
  return issues;
}

function validatePaylines(draft: SlotProjectDraft): string[] {
  const issues: string[] = [];
  for (const payline of draft.paytable.paylines) {
    if (payline.pattern.length !== draft.slot.reels) issues.push(`${payline.id} precisa ter ${draft.slot.reels} posicoes.`);
    if (payline.pattern.some((row) => row < MIN_NUMERIC_INPUT || row >= draft.slot.rows)) issues.push(`${payline.id} possui linha fora da grade.`);
  }
  return issues;
}

function validateSymbolPays(draft: SlotProjectDraft): string[] {
  const issues: string[] = [];
  for (const symbolPay of draft.paytable.symbolPays) {
    if (!draft.symbols.some((symbol) => symbol.id === symbolPay.symbolId)) issues.push(`${symbolPay.symbolId} nao existe na lista de simbolos.`);
    if (symbolPay.payouts.some((payout) => payout.count < draft.paytable.rules.minMatch || payout.count > draft.slot.reels)) {
      issues.push(`${symbolPay.symbolId} possui contagem de premio fora da regra.`);
    }
    if (symbolPay.payouts.some((payout) => payout.multiplier < MIN_NUMERIC_INPUT)) issues.push(`${symbolPay.symbolId} possui multiplicador negativo.`);
  }
  return issues;
}

function centeredRect(areaWidth: number, areaHeight: number, width: number, height: number): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.round((areaWidth - width) / HALF_DIVISOR),
    y: Math.round((areaHeight - height) / HALF_DIVISOR),
    width,
    height
  };
}

function toTitle(value: string): string {
  return value
    .split(/[-_.\s]+/u)
    .filter(Boolean)
    .map((part) => `${part.charAt(MIN_NUMERIC_INPUT).toUpperCase()}${part.slice(MIN_COUNT_INPUT)}`)
    .join(' ');
}

function createFallbackSymbol(frame: FrameRect, order: number, assetPrefix: string): StudioSymbol {
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
