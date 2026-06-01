import type { SymbolRole } from '@iluvcoconut/contracts';
import { getElement, getInputTarget } from './dom';
import { getSelectedSymbol, moveSelectedSymbol, syncSymbolsWithFrames, updateSelectedSymbol } from './symbolManager';
import type { StudioState } from './types';

interface BindSymbolControlsOptions {
  getAssetPrefix: () => string;
  draw: () => void;
  onSymbolsChanged?: () => void;
  state: StudioState;
}

export function bindSymbolControls({ draw, getAssetPrefix, onSymbolsChanged, state }: BindSymbolControlsOptions): void {
  getElement<HTMLInputElement>('symbolId').addEventListener('input', (event) => {
    updateSelectedSymbol(state, { id: getInputTarget(event).value });
    onSymbolsChanged?.();
    draw();
  });
  getElement<HTMLInputElement>('symbolLabel').addEventListener('input', (event) => {
    updateSelectedSymbol(state, { label: getInputTarget(event).value });
    onSymbolsChanged?.();
    draw();
  });
  getElement<HTMLSelectElement>('symbolRole').addEventListener('change', (event) => {
    if (!(event.currentTarget instanceof HTMLSelectElement)) return;
    updateSelectedSymbol(state, { role: event.currentTarget.value as SymbolRole });
    onSymbolsChanged?.();
    draw();
  });
  getElement<HTMLButtonElement>('moveSymbolUp').addEventListener('click', () => {
    moveSelectedSymbol(state, -1);
    onSymbolsChanged?.();
    draw();
  });
  getElement<HTMLButtonElement>('moveSymbolDown').addEventListener('click', () => {
    moveSelectedSymbol(state, 1);
    onSymbolsChanged?.();
    draw();
  });
  getElement<HTMLInputElement>('assetPrefix').addEventListener('change', () => {
    syncSymbolsWithFrames(state, getAssetPrefix());
    onSymbolsChanged?.();
    draw();
  });
}

export function syncSymbolInspector(state: StudioState): void {
  const symbol = getSelectedSymbol(state);
  const disabled = !symbol;
  const idInput = getElement<HTMLInputElement>('symbolId');
  const labelInput = getElement<HTMLInputElement>('symbolLabel');
  const roleInput = getElement<HTMLSelectElement>('symbolRole');
  const moveUpButton = getElement<HTMLButtonElement>('moveSymbolUp');
  const moveDownButton = getElement<HTMLButtonElement>('moveSymbolDown');

  idInput.disabled = disabled;
  labelInput.disabled = disabled;
  roleInput.disabled = disabled;
  moveUpButton.disabled = disabled;
  moveDownButton.disabled = disabled;

  idInput.value = symbol?.id ?? '';
  labelInput.value = symbol?.label ?? '';
  roleInput.value = symbol?.role ?? 'regular';
}
