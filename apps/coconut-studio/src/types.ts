export type FrameMode = 'grid' | 'detected';
export type DetectionBackend = 'heuristic' | 'coconutVision';

export interface CropGrid {
  columns: number;
  rows: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
  frameWidth: number;
  frameHeight: number;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface StudioState {
  image?: HTMLImageElement;
  imageName?: string;
  imageUrl?: string;
  grid: CropGrid;
  zoom: number;
  selectedFrame: number;
  backgroundPreview: boolean;
  frameMode: FrameMode;
  backgroundColor: RgbColor;
  detectionThreshold: number;
  detectionMinArea: number;
  detectionBackend: DetectionBackend;
  detectedFrames: FrameRect[];
  detectionSummary?: DetectionSummary | undefined;
}

export interface FrameRect {
  index: number;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasPlacement {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface ComponentBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  area: number;
}

export interface DetectionSummary {
  backend: DetectionBackend;
  figureCount: number;
  rowCount: number;
  figuresByRow: number[];
  analysisScale: number;
  elapsedMs: number;
}
