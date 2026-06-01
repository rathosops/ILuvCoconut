import { DETECTED_MODE, MIN_COUNT_INPUT, MIN_NUMERIC_INPUT } from './studioConstants';
import { removeSymbolForFrame } from './symbolManager';
import type { FrameRect, StudioState } from './types';

interface DeleteSelectedFrameOptions {
  draw: () => void;
  onFramesChanged?: () => void;
  setStatus: (value: string) => void;
  state: StudioState;
}

export function deleteSelectedDetectedFrame({ draw, onFramesChanged, setStatus, state }: DeleteSelectedFrameOptions): void {
  if (state.frameMode !== DETECTED_MODE || state.detectedFrames.length === MIN_NUMERIC_INPUT) return;
  const currentIndex = state.selectedFrame;
  removeSymbolForFrame(state, currentIndex);
  state.detectedFrames = state.detectedFrames
    .filter((frame) => frame.index !== currentIndex)
    .map((frame, index) => ({ ...frame, index }));
  state.selectedFrame = Math.min(currentIndex, Math.max(MIN_NUMERIC_INPUT, state.detectedFrames.length - MIN_COUNT_INPUT));
  state.detectionSummary = state.detectionSummary
    ? {
        ...state.detectionSummary,
        figureCount: state.detectedFrames.length,
        rowCount: new Set(state.detectedFrames.map((frame) => frame.row)).size,
        figuresByRow: countFiguresByRow(state.detectedFrames)
      }
    : undefined;
  setStatus('Frame removido da selecao.');
  onFramesChanged?.();
  draw();
}

function countFiguresByRow(frames: FrameRect[]): number[] {
  const rowCount = new Set(frames.map((frame) => frame.row)).size;
  return Array.from({ length: rowCount }, (_, row) => frames.filter((frame) => frame.row === row).length);
}
