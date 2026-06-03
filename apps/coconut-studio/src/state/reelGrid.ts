import type { StudioSymbol } from '../engine/types';

function cellKey(reel: number, row: number): string {
  return `${reel}:${row}`;
}

/** Builds a reels × rows grid of symbol ids, honouring manual paint overrides. */
export function buildReelGrid(symbols: StudioSymbol[], reels: number, rows: number, painted: Map<string, string>): string[][] {
  const ids = symbols.map((symbol) => symbol.id);
  const valid = new Set(ids);
  return Array.from({ length: reels }, (_reelValue, reel) =>
    Array.from({ length: rows }, (_rowValue, row) => {
      const override = painted.get(cellKey(reel, row));
      if (override !== undefined && valid.has(override)) return override;
      if (ids.length === 0) return '';
      return ids[(reel * rows + row) % ids.length] ?? '';
    })
  );
}

export { cellKey };
