import { getElement, getInputTarget } from './dom';
import { createDefaultSlotLayout } from './slotLayout';
import { MIN_COUNT_INPUT, MIN_NUMERIC_INPUT } from './studioConstants';
import type { StudioSlotLayout, StudioState } from './types';

type SlotLayoutKey = keyof StudioSlotLayout;

interface BindSlotLayoutControlsOptions {
  draw: () => void;
  onLayoutChanged?: () => void;
  state: StudioState;
}

const INPUTS: Array<{ id: string; key: SlotLayoutKey; min: number }> = [
  { id: 'slotReels', key: 'reels', min: MIN_COUNT_INPUT },
  { id: 'slotRows', key: 'rows', min: MIN_COUNT_INPUT },
  { id: 'slotCellWidth', key: 'cellWidth', min: MIN_COUNT_INPUT },
  { id: 'slotCellHeight', key: 'cellHeight', min: MIN_COUNT_INPUT },
  { id: 'slotReelGap', key: 'reelGap', min: MIN_NUMERIC_INPUT },
  { id: 'slotRowGap', key: 'rowGap', min: MIN_NUMERIC_INPUT },
  { id: 'slotDesktopWidth', key: 'desktopWidth', min: MIN_COUNT_INPUT },
  { id: 'slotDesktopHeight', key: 'desktopHeight', min: MIN_COUNT_INPUT },
  { id: 'slotMobileWidth', key: 'mobileWidth', min: MIN_COUNT_INPUT },
  { id: 'slotMobileHeight', key: 'mobileHeight', min: MIN_COUNT_INPUT }
];

export function bindSlotLayoutControls({ draw, onLayoutChanged, state }: BindSlotLayoutControlsOptions): void {
  for (const input of INPUTS) {
    getElement<HTMLInputElement>(input.id).addEventListener('input', (event) => {
      state.slotLayout[input.key] = Math.max(input.min, Number(getInputTarget(event).value));
      onLayoutChanged?.();
      draw();
    });
  }
}

export function resetSlotLayoutControls(state: StudioState): void {
  state.slotLayout = createDefaultSlotLayout();
  syncSlotLayoutControls(state);
}

export function syncSlotLayoutControls(state: StudioState): void {
  for (const input of INPUTS) {
    getElement<HTMLInputElement>(input.id).value = String(state.slotLayout[input.key]);
  }
}
