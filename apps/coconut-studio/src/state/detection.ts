import {
  COCONUT_VISION_BACKEND,
  DETECTED_MODE,
  HEURISTIC_BACKEND,
  MIN_NUMERIC_INPUT
} from '../engine/studioConstants';
import { detectFiguresWithCoconutVision, isCoconutVisionRuntimeAvailable } from '../engine/coconutVision';
import { detectFiguresWithHeuristic, sampleBackgroundColor } from '../engine/imageDetection';
import type { DetectionBackend, DetectionSummary, FrameRect, StudioState } from '../engine/types';

export interface DetectionOutcome {
  frames: FrameRect[];
  summary: DetectionSummary;
}

export function preferredBackend(): DetectionBackend {
  return isCoconutVisionRuntimeAvailable() ? COCONUT_VISION_BACKEND : HEURISTIC_BACKEND;
}

export function backendLabel(backend: DetectionBackend): string {
  return backend === COCONUT_VISION_BACKEND ? 'Coconut Vision' : 'Detector leve';
}

export function formatDetectionSummary(summary: DetectionSummary): string {
  if (summary.figureCount === MIN_NUMERIC_INPUT) {
    return `Nenhuma figura encontrada com ${summary.backend}. Ajuste tolerância ou área mínima.`;
  }
  const rowText = summary.figuresByRow.length > MIN_NUMERIC_INPUT ? ` (${summary.figuresByRow.join('/')})` : '';
  return `${summary.figureCount} figuras em ${summary.rowCount} linhas${rowText} com ${summary.backend} em ${summary.elapsedMs}ms.`;
}

async function detectWithPreferredBackend(state: StudioState, image: HTMLImageElement): Promise<DetectionOutcome> {
  const useHeuristic = state.detectionBackend === HEURISTIC_BACKEND || !isCoconutVisionRuntimeAvailable();
  if (useHeuristic) {
    return detectFiguresWithHeuristic(image, state.backgroundColor, state.detectionThreshold, state.detectionMinArea);
  }
  return detectFiguresWithCoconutVision(image, state.backgroundColor, state.detectionThreshold, state.detectionMinArea);
}

/** Runs detection in place on `state`, returning a status message for the status bar. */
export async function runDetection(state: StudioState): Promise<string> {
  const { image } = state;
  if (!image) return 'Importe uma imagem para detectar figuras.';
  state.backgroundColor = sampleBackgroundColor(image);

  let status: string;
  try {
    const result = await detectWithPreferredBackend(state, image);
    state.detectedFrames = result.frames;
    state.detectionSummary = result.summary;
    status = formatDetectionSummary(result.summary);
  } catch (error: unknown) {
    const result = detectFiguresWithHeuristic(image, state.backgroundColor, state.detectionThreshold, state.detectionMinArea);
    state.detectedFrames = result.frames;
    state.detectionSummary = result.summary;
    const detail = error instanceof Error ? error.message : '';
    status = `${backendLabel(state.detectionBackend)} indisponível; fallback leve usado. ${formatDetectionSummary(result.summary)} ${detail}`.trim();
  }

  state.selectedFrame = MIN_NUMERIC_INPUT;
  state.frameMode = DETECTED_MODE;
  return status;
}
