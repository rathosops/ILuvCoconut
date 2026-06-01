import { getElement } from './dom';
import { createExportPlan } from './exportPlan';
import { createJsonPreviewState, stringifyJsonPreview } from './slotProjectDraft';
import { JSON_INDENT_SPACES, MIN_NUMERIC_INPUT } from './studioConstants';
import type { StudioState } from './types';

interface JsonPreviewControllerOptions {
  getAssetPrefix: () => string;
  getGameId: () => string;
  setStatus: (value: string) => void;
  state: StudioState;
}

export function createCurrentExportPlan({ getAssetPrefix, getGameId, state }: Pick<JsonPreviewControllerOptions, 'getAssetPrefix' | 'getGameId' | 'state'>): object {
  return createExportPlan({
    assetPrefix: getAssetPrefix(),
    gameId: getGameId(),
    projectType: state.projectType,
    state
  });
}

export function bindJsonPreviewControls(options: JsonPreviewControllerOptions, draw: () => void): void {
  getElement<HTMLSelectElement>('jsonPreviewKind').addEventListener('change', (event) => {
    options.state.selectedJsonPreview = (event.target as HTMLSelectElement).value as StudioState['selectedJsonPreview'];
    draw();
  });
  getElement<HTMLButtonElement>('copyJsonPreview').addEventListener('click', () => {
    void navigator.clipboard.writeText(getCurrentJsonPreviewText());
    options.setStatus('JSON copiado para a area de transferencia.');
  });
}

export function updateJsonPreview(options: JsonPreviewControllerOptions): void {
  getElement<HTMLSelectElement>('jsonPreviewKind').value = options.state.selectedJsonPreview;
  const previewState = createJsonPreviewState({
    assetPrefix: options.getAssetPrefix(),
    exportPlan: createCurrentExportPlan(options),
    gameId: options.getGameId(),
    state: options.state
  });
  const previewValue = previewState[options.state.selectedJsonPreview];
  getElement<HTMLPreElement>('jsonPreview').textContent = stringifyJsonPreview(previewValue);
  getElement<HTMLDivElement>('jsonValidation').textContent = previewState.validation.length > MIN_NUMERIC_INPUT
    ? previewState.validation.join(' ')
    : 'JSON valido para a etapa atual.';
}

export function copyExportPlan(options: JsonPreviewControllerOptions): void {
  const plan = createCurrentExportPlan(options);
  void navigator.clipboard.writeText(JSON.stringify(plan, null, JSON_INDENT_SPACES));
  options.setStatus('Plano JSON copiado para a area de transferencia.');
}

function getCurrentJsonPreviewText(): string {
  return getElement<HTMLPreElement>('jsonPreview').textContent;
}
