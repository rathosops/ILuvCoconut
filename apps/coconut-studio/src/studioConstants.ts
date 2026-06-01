import type { CropGrid, RgbColor } from './types';

export const DEFAULT_GRID: CropGrid = {
  columns: 5,
  rows: 3,
  marginX: 0,
  marginY: 0,
  gapX: 0,
  gapY: 0,
  frameWidth: 0,
  frameHeight: 0
};

export const DEFAULT_BACKGROUND_COLOR: RgbColor = { r: 39, g: 12, b: 82 };

export const DEFAULT_ZOOM = 1;
export const DEFAULT_DETECTION_THRESHOLD = 54;
export const DEFAULT_DETECTION_MIN_AREA = 1400;
export const DEFAULT_DETECTION_BACKEND = 'coconutVision';
export const DEFAULT_GAME_ID = 'fruit-classic';
export const DEFAULT_ASSET_PREFIX = 'symbol';
export const DEFAULT_PROJECT_TYPE = 'slot';
export const DEFAULT_LANGUAGE = 'pt';
export const MIN_NUMERIC_INPUT = 0;
export const MIN_COUNT_INPUT = 1;
export const HALF_DIVISOR = 2;
export const PERCENT_MULTIPLIER = 100;
export const JSON_INDENT_SPACES = 2;
export const MAX_COLOR_CHANNEL = 255;
export const MAX_ZOOM = 4;
export const MIN_ZOOM = 0.25;
export const ZOOM_STEP = 0.25;

export const SHEET_CANVAS_WIDTH = 1280;
export const SHEET_CANVAS_HEIGHT = 720;
export const PREVIEW_CANVAS_SIZE = 256;
export const CHECKERBOARD_SIZE = 24;
export const PREVIEW_CHECKERBOARD_SIZE = 16;
export const CANVAS_SAFE_PADDING = 48;
export const CANVAS_MIN_OFFSET = 24;
export const EMPTY_STATE_FONT = '18px system-ui';
export const OVERLAY_LABEL_FONT = '12px system-ui';

export const ANALYSIS_MAX_PIXELS = 2_000_000;
export const COCONUT_VISION_MAX_PIXELS = 450_000;
export const ANALYSIS_SAMPLE_SIZE = 32;
export const ANALYSIS_SAMPLE_LAST_PIXEL = 30;
export const ANALYSIS_SAMPLE_MID_PIXEL = 16;
export const RGBA_STRIDE = 4;
export const ALPHA_CHANNEL_OFFSET = 3;
export const GREEN_CHANNEL_OFFSET = 1;
export const BLUE_CHANNEL_OFFSET = 2;
export const MIN_ALPHA_FOR_FOREGROUND = 12;
export const MIN_CONNECTED_COMPONENT_AREA = 12;
export const COMPONENT_PADDING_BASE = 12;
export const COMPONENT_PADDING_MIN = 4;
export const COMPONENT_MERGE_PADDING_MIN = 8;
export const COMPONENT_MERGE_PADDING_RATIO = 0.018;
export const COMPONENT_ACCESSORY_AREA_RATIO = 0.45;
export const COMPONENT_ACCESSORY_SPAN_RATIO = 0.58;
export const COMPONENT_STRONG_PROXIMITY_OVERLAP_RATIO = 0.62;
export const COMPONENT_ROW_CLUSTER_RATIO = 0.42;
export const COMPONENT_ROW_CLUSTER_MIN_RATIO = 0.7;
export const COMPONENT_SPLIT_WIDTH_RATIO = 1.55;
export const COMPONENT_SPLIT_ASPECT_RATIO = 1.2;
export const COMPONENT_SPLIT_SEARCH_MARGIN_RATIO = 0.3;
export const COMPONENT_SPLIT_VALLEY_RATIO = 0.38;
export const COMPONENT_SPLIT_MIN_AREA_RATIO = 0.35;
export const FRAME_OVERLAP_MIN_SIZE = 4;
export const MORPHOLOGY_KERNEL_RADIUS = 1;
export const CONNECTED_COMPONENT_NEIGHBOR_COUNT = 8;
export const DETECTION_SCORE_MAX = 1;

export const FRAME_HANDLE_SIZE = 10;
export const FRAME_HANDLE_HIT_SIZE = 14;
export const FRAME_HANDLE_HALF_DIVISOR = 2;
export const FRAME_MIN_EDIT_SIZE = 4;

export const OVERLAY_LABEL_X = 6;
export const OVERLAY_LABEL_Y = 6;
export const OVERLAY_LABEL_WIDTH = 34;
export const OVERLAY_LABEL_HEIGHT = 20;
export const OVERLAY_LABEL_TEXT_X = 15;
export const OVERLAY_LABEL_TEXT_Y = 21;

export const STATUS_READY = 'Pronto';
export const GRID_MODE = 'grid';
export const DETECTED_MODE = 'detected';
export const HEURISTIC_BACKEND = 'heuristic';
export const COCONUT_VISION_BACKEND = 'coconutVision';
