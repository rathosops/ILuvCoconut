import {
  DEFAULT_SLOT_CELL_SIZE,
  DEFAULT_SLOT_DESKTOP_HEIGHT,
  DEFAULT_SLOT_DESKTOP_WIDTH,
  DEFAULT_SLOT_MOBILE_HEIGHT,
  DEFAULT_SLOT_MOBILE_WIDTH,
  DEFAULT_SLOT_REEL_GAP,
  DEFAULT_SLOT_REELS,
  DEFAULT_SLOT_ROW_GAP,
  DEFAULT_SLOT_ROWS
} from './studioConstants';
import type { StudioSlotLayout } from './types';

export function createDefaultSlotLayout(): StudioSlotLayout {
  return {
    cellHeight: DEFAULT_SLOT_CELL_SIZE,
    cellWidth: DEFAULT_SLOT_CELL_SIZE,
    desktopHeight: DEFAULT_SLOT_DESKTOP_HEIGHT,
    desktopWidth: DEFAULT_SLOT_DESKTOP_WIDTH,
    mobileHeight: DEFAULT_SLOT_MOBILE_HEIGHT,
    mobileWidth: DEFAULT_SLOT_MOBILE_WIDTH,
    reelGap: DEFAULT_SLOT_REEL_GAP,
    reels: DEFAULT_SLOT_REELS,
    rowGap: DEFAULT_SLOT_ROW_GAP,
    rows: DEFAULT_SLOT_ROWS
  };
}
