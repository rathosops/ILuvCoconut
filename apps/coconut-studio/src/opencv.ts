import { ANALYSIS_MAX_PIXELS, MIN_COUNT_INPUT } from './studioConstants';
import type { ComponentBounds, RgbColor } from './types';

export interface OpenCvDetectionRequest {
  image: HTMLImageElement;
  backgroundColor: RgbColor;
  threshold: number;
  minArea: number;
}

export interface OpenCvDetectionResult {
  bounds: ComponentBounds[];
  backend: 'opencv';
  analysisScale: number;
}

interface OpenCvRuntime {
  Mat: new () => unknown;
  matFromImageData(imageData: ImageData): unknown;
  imread(source: HTMLCanvasElement): unknown;
  cvtColor(src: unknown, dst: unknown, code: number): void;
  inRange(src: unknown, lower: unknown, upper: unknown, dst: unknown): void;
  bitwise_not(src: unknown, dst: unknown): void;
  morphologyEx(src: unknown, dst: unknown, operation: number, kernel: unknown): void;
  getStructuringElement(shape: number, size: unknown): unknown;
  connectedComponentsWithStats(src: unknown, labels: unknown, stats: unknown, centroids: unknown): number;
  Size: new (width: number, height: number) => unknown;
  Scalar: new (first: number, second: number, third: number, fourth: number) => unknown;
  CV_8UC1: number;
  COLOR_RGBA2RGB: number;
  MORPH_OPEN: number;
  MORPH_RECT: number;
  CC_STAT_LEFT: number;
  CC_STAT_TOP: number;
  CC_STAT_WIDTH: number;
  CC_STAT_HEIGHT: number;
  CC_STAT_AREA: number;
}

declare global {
  interface Window {
    cv?: OpenCvRuntime & { onRuntimeInitialized?: () => void };
  }
}

const OPENCV_SCRIPT_ID = 'iluvcoconut-opencv-js';
const OPENCV_CDN_URL = 'https://docs.opencv.org/4.x/opencv.js';
const OPENCV_LOAD_TIMEOUT_MS = 15000;
const OPEN_CV_MORPH_KERNEL_SIZE = 3;
const OPEN_CV_COLOR_CHANNEL_MAX = 255;
const OPEN_CV_STAT_STRIDE = 5;

let loadingOpenCv: Promise<OpenCvRuntime> | undefined;

export async function loadOpenCv(): Promise<OpenCvRuntime> {
  if (window.cv?.Mat) return window.cv;
  loadingOpenCv ??= new Promise((resolve, reject) => {
    const existing = document.getElementById(OPENCV_SCRIPT_ID);
    const script = existing instanceof HTMLScriptElement ? existing : document.createElement('script');
    const timeout = window.setTimeout(() => reject(new Error('OpenCV.js load timed out.')), OPENCV_LOAD_TIMEOUT_MS);

    window.cv = window.cv ?? {} as OpenCvRuntime;
    window.cv.onRuntimeInitialized = () => {
      window.clearTimeout(timeout);
      if (!window.cv?.Mat) {
        reject(new Error('OpenCV.js runtime initialized without Mat API.'));
        return;
      }

      resolve(window.cv);
    };

    script.id = OPENCV_SCRIPT_ID;
    script.async = true;
    script.src = OPENCV_CDN_URL;
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Unable to load OpenCV.js.'));
    };

    if (!existing) document.head.appendChild(script);
  });

  try {
    return await loadingOpenCv;
  } catch (error: unknown) {
    loadingOpenCv = undefined;
    throw error;
  }
}

export async function detectFiguresWithOpenCv(request: OpenCvDetectionRequest): Promise<OpenCvDetectionResult> {
  const cv = await loadOpenCv();
  const analysisScale = Math.min(MIN_COUNT_INPUT, Math.sqrt(ANALYSIS_MAX_PIXELS / (request.image.naturalWidth * request.image.naturalHeight)));
  const width = Math.max(MIN_COUNT_INPUT, Math.round(request.image.naturalWidth * analysisScale));
  const height = Math.max(MIN_COUNT_INPUT, Math.round(request.image.naturalHeight * analysisScale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create OpenCV staging canvas.');
  context.drawImage(request.image, 0, 0, width, height);

  const source = cv.imread(canvas);
  const rgb = new cv.Mat();
  const mask = new cv.Mat();
  const labels = new cv.Mat();
  const stats = new cv.Mat();
  const centroids = new cv.Mat();
  let kernel: unknown;

  try {
    cv.cvtColor(source, rgb, cv.COLOR_RGBA2RGB);
    const lower = new cv.Scalar(
      Math.max(0, request.backgroundColor.r - request.threshold),
      Math.max(0, request.backgroundColor.g - request.threshold),
      Math.max(0, request.backgroundColor.b - request.threshold),
      0
    );
    const upper = new cv.Scalar(
      Math.min(OPEN_CV_COLOR_CHANNEL_MAX, request.backgroundColor.r + request.threshold),
      Math.min(OPEN_CV_COLOR_CHANNEL_MAX, request.backgroundColor.g + request.threshold),
      Math.min(OPEN_CV_COLOR_CHANNEL_MAX, request.backgroundColor.b + request.threshold),
      OPEN_CV_COLOR_CHANNEL_MAX
    );
    cv.inRange(rgb, lower, upper, mask);
    cv.bitwise_not(mask, mask);
    kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(OPEN_CV_MORPH_KERNEL_SIZE, OPEN_CV_MORPH_KERNEL_SIZE));
    cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);
    const count = cv.connectedComponentsWithStats(mask, labels, stats, centroids);
    const minArea = Math.max(MIN_COUNT_INPUT, Math.round(request.minArea * analysisScale * analysisScale));
    const bounds = extractComponentBounds(cv, stats, count, minArea);
    return { bounds, backend: 'opencv', analysisScale };
  } finally {
    disposeMat(source);
    disposeMat(rgb);
    disposeMat(mask);
    disposeMat(labels);
    disposeMat(stats);
    disposeMat(centroids);
    disposeMat(kernel);
  }
}

function extractComponentBounds(cv: OpenCvRuntime, stats: unknown, count: number, minArea: number): ComponentBounds[] {
  const data = (stats as { data32S?: Int32Array }).data32S;
  if (!data) return [];
  const bounds: ComponentBounds[] = [];

  for (let label = 1; label < count; label += 1) {
    const offset = label * OPEN_CV_STAT_STRIDE;
    const area = data[offset + cv.CC_STAT_AREA] ?? 0;
    if (area < minArea) continue;

    const left = data[offset + cv.CC_STAT_LEFT] ?? 0;
    const top = data[offset + cv.CC_STAT_TOP] ?? 0;
    const width = data[offset + cv.CC_STAT_WIDTH] ?? 1;
    const height = data[offset + cv.CC_STAT_HEIGHT] ?? 1;
    bounds.push({
      minX: left,
      minY: top,
      maxX: left + width,
      maxY: top + height,
      area
    });
  }

  return bounds;
}

function disposeMat(mat: unknown): void {
  const disposable = mat as { delete?: () => void };
  disposable.delete?.();
}
