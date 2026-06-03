import { type SymbolRole } from '@iluvcoconut/contracts';
import type { StudioSymbol } from '../engine/types';

export interface SymbolView {
  code: string;
  name: string;
  bg: string;
  fg: string;
  badge: string | null;
}

interface Swatch {
  bg: string;
  fg: string;
}

const PALETTE: Swatch[] = [
  { bg: '#DCEEDF', fg: '#1E7A43' },
  { bg: '#DEDEF1', fg: '#2E2E6E' },
  { bg: '#F6E8C8', fg: '#A9802A' },
  { bg: '#F3DAD6', fg: '#B23B2E' },
  { bg: '#ECF0CE', fg: '#7E8A22' },
  { bg: '#DCEFD8', fg: '#3E8E3A' },
  { bg: '#E6DCEC', fg: '#6E4A8E' },
  { bg: '#E0DCEE', fg: '#5A4F9E' },
  { bg: '#D6E8EC', fg: '#2C8A9E' },
  { bg: '#ECE2CC', fg: '#6B5B3C' }
];

const WILD: Swatch = { bg: '#DCEEDF', fg: '#1E7A43' };
const SCATTER: Swatch = { bg: '#F6E6C0', fg: '#B5811A' };

const ROLE_BADGE: Record<SymbolRole, string | null> = {
  wild: 'WILD',
  scatter: 'SCAT',
  bonus: 'BONUS',
  multiplier: 'MULT',
  regular: null,
  decorative: null
};

const CODE_LENGTH = 3;

function deriveCode(label: string): string {
  const cleaned = label.trim();
  if (!cleaned) return '·';
  const words = cleaned.split(/\s+/u);
  if (words.length > 1) return words.map((word) => word.charAt(0)).join('').slice(0, CODE_LENGTH).toUpperCase();
  return cleaned.slice(0, CODE_LENGTH).toUpperCase();
}

function swatchFor(role: SymbolRole, index: number): Swatch {
  if (role === 'wild') return WILD;
  if (role === 'scatter') return SCATTER;
  return PALETTE[index % PALETTE.length] ?? WILD;
}

export function deriveSymbolView(label: string, role: SymbolRole, index: number): SymbolView {
  const swatch = swatchFor(role, index);
  return {
    code: deriveCode(label),
    name: label,
    bg: swatch.bg,
    fg: swatch.fg,
    badge: ROLE_BADGE[role]
  };
}

/** Maps each symbol id to a placeholder presentation, ordered by `order`. */
export function buildSymbolViews(symbols: StudioSymbol[]): Record<string, SymbolView> {
  const ordered = [...symbols].sort((left, right) => left.order - right.order);
  const views: Record<string, SymbolView> = {};
  ordered.forEach((symbol, index) => {
    views[symbol.id] = deriveSymbolView(symbol.label, symbol.role, index);
  });
  return views;
}
