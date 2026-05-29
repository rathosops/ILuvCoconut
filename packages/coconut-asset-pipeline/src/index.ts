import { access, mkdir, readFile, readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';
import type { CoconutAssetManifest, GameConfig, ThemeConfig } from '@iluvcoconut/contracts';

const supportedRasterExtensions = new Set(['.avif', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp']);

export type RawAssetSourceStatus = 'supported' | 'unsupported';
export type RawBackgroundRemovalMode = 'none' | 'white';

export interface RawAssetSourceReport {
  path: string;
  status: RawAssetSourceStatus;
  format?: string;
  width?: number;
  height?: number;
  hasAlpha?: boolean;
  reason?: string;
}

export interface RawSpriteSheetSliceOptions {
  inputPath: string;
  outputDir: string;
  columns: number;
  rows: number;
  namePrefix?: string;
  marginX?: number;
  marginY?: number;
  gapX?: number;
  gapY?: number;
  trim?: boolean;
  removeBackground?: RawBackgroundRemovalMode;
}

export interface SlicedAsset {
  id: string;
  path: string;
  frame: {
    column: number;
    row: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

export async function listRawAssetSources(rawAssetsDir: string): Promise<RawAssetSourceReport[]> {
  const files = await listFiles(rawAssetsDir);
  const reports = await Promise.all(files.map((file) => inspectRawAssetSource(file)));
  return reports.sort((left, right) => left.path.localeCompare(right.path));
}

export async function inspectRawAssetSource(path: string): Promise<RawAssetSourceReport> {
  const extension = extname(path).toLowerCase();

  if (!supportedRasterExtensions.has(extension)) {
    return {
      path,
      status: 'unsupported',
      reason: extension === '.eps'
        ? 'EPS must be exported/rasterized to PNG, WebP or TIFF before automatic slicing.'
        : `Unsupported raw asset extension '${extension}'.`
    };
  }

  try {
    const metadata = await sharp(path).metadata();
    return {
      path,
      status: 'supported',
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      hasAlpha: metadata.hasAlpha
    };
  } catch (error: unknown) {
    return {
      path,
      status: 'unsupported',
      reason: error instanceof Error ? error.message : 'Unable to inspect image.'
    };
  }
}

export async function sliceRawSpriteSheet(options: RawSpriteSheetSliceOptions): Promise<SlicedAsset[]> {
  validateSliceOptions(options);

  const metadata = await sharp(options.inputPath).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read dimensions from ${options.inputPath}.`);
  }

  const marginX = options.marginX ?? 0;
  const marginY = options.marginY ?? 0;
  const gapX = options.gapX ?? 0;
  const gapY = options.gapY ?? 0;
  const availableWidth = metadata.width - marginX * 2 - gapX * (options.columns - 1);
  const availableHeight = metadata.height - marginY * 2 - gapY * (options.rows - 1);
  const frameWidth = Math.floor(availableWidth / options.columns);
  const frameHeight = Math.floor(availableHeight / options.rows);

  if (frameWidth <= 0 || frameHeight <= 0) {
    throw new Error('Invalid grid: calculated frame dimensions must be positive.');
  }

  await mkdir(options.outputDir, { recursive: true });

  const namePrefix = sanitizeAssetId(options.namePrefix ?? basename(options.inputPath, extname(options.inputPath)));
  const slicedAssets: SlicedAsset[] = [];

  for (let row = 0; row < options.rows; row += 1) {
    for (let column = 0; column < options.columns; column += 1) {
      const id = `${namePrefix}-${row + 1}-${column + 1}`;
      const x = marginX + column * (frameWidth + gapX);
      const y = marginY + row * (frameHeight + gapY);
      const outputPath = join(options.outputDir, `${id}.png`);
      let pipeline = sharp(options.inputPath)
        .extract({ left: x, top: y, width: frameWidth, height: frameHeight })
        .rotate();

      if (options.removeBackground === 'white') {
        pipeline = pipeline.unflatten();
      }

      if (options.trim ?? true) {
        pipeline = pipeline.trim();
      }

      await pipeline.png({ compressionLevel: 9 }).toFile(outputPath);
      slicedAssets.push({
        id,
        path: outputPath,
        frame: { column, row, x, y, width: frameWidth, height: frameHeight }
      });
    }
  }

  return slicedAssets;
}

export async function buildAssetManifest(gameDir: string): Promise<CoconutAssetManifest> {
  const config = await readJsonFile<GameConfig>(join(gameDir, 'game.config.json'));
  const theme = await readJsonFile<ThemeConfig>(join(gameDir, 'theme.config.json'));
  const assets = [
    { id: 'background.portrait', type: 'image' as const, src: theme.background.portrait, scope: 'base' as const },
    { id: 'background.landscape', type: 'image' as const, src: theme.background.landscape, scope: 'base' as const },
    ...Object.entries(theme.symbols).map(([id, src]) => ({ id: `symbol.${id}`, type: 'image' as const, src, scope: 'base' as const })),
    ...Object.entries(theme.audio).map(([id, src]) => ({ id: `audio.${id}`, type: 'audio' as const, src, scope: id.includes('bonus') ? 'lazy' as const : 'base' as const }))
  ];

  return { gameId: config.id, version: '0.1.0', assets };
}

export async function validateGameDirectory(gameDir: string): Promise<string[]> {
  const errors: string[] = [];
  const configPath = join(gameDir, 'game.config.json');
  const themePath = join(gameDir, 'theme.config.json');

  try { await access(configPath); } catch { errors.push(`Missing ${configPath}`); }
  try { await access(themePath); } catch { errors.push(`Missing ${themePath}`); }
  if (errors.length > 0) return errors;

  const config = await readJsonFile<GameConfig>(configPath);
  const theme = await readJsonFile<ThemeConfig>(themePath);

  if (config.layout.reels <= 0 || config.layout.rows <= 0) errors.push('layout.reels and layout.rows must be positive.');
  if (config.bet.min > config.bet.max) errors.push('bet.min cannot be greater than bet.max.');

  for (const symbol of config.symbols) {
    const asset = theme.symbols[symbol.id];
    if (!asset) errors.push(`Missing theme asset for symbol '${symbol.id}'.`);
  }

  return errors;
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    if (entry.isFile()) return [path];
    return [];
  }));

  return nestedFiles.flat();
}

function validateSliceOptions(options: RawSpriteSheetSliceOptions): void {
  if (options.columns <= 0 || options.rows <= 0) {
    throw new Error('columns and rows must be positive.');
  }
}

function sanitizeAssetId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
