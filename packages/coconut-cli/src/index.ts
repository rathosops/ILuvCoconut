#!/usr/bin/env node
import { spawn } from 'node:child_process';
import {
  buildAssetManifest,
  listRawAssetSources,
  optimizeRasterAsset,
  sliceRawSpriteSheet,
  validateGameDirectory
} from '@iluvcoconut/asset-pipeline';

const [, , command, firstArg = 'games/fruit-classic', ...args] = process.argv;

type CommandHandler = () => Promise<void> | void;

const handlers: Record<string, CommandHandler> = {
  build: showBuildPlaceholder,
  manifest: printManifest,
  preview: showPreviewPlaceholder,
  'raw:inspect': printRawAssetReport,
  'raw:detect-symbols': detectRawSymbols,
  'raw:optimize-image': optimizeRawImage,
  'raw:slice-grid': sliceRawGrid,
  validate: validateGame
};

async function main(): Promise<void> {
  const handler = command ? handlers[command] : undefined;
  if (!handler) {
    showHelp();
    return;
  }

  await handler();
}

async function validateGame(): Promise<void> {
  const errors = await validateGameDirectory(firstArg);
  if (errors.length > 0) {
    console.error('ILuvCoconut validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ILuvCoconut validation passed for ${firstArg}`);
}

async function printManifest(): Promise<void> {
  const manifest = await buildAssetManifest(firstArg);
  console.log(JSON.stringify(manifest, null, 2));
}

async function printRawAssetReport(): Promise<void> {
  const reports = await listRawAssetSources(firstArg);
  console.log(JSON.stringify(reports, null, 2));
}

async function sliceRawGrid(): Promise<void> {
  const [outputDir, columns, rows, namePrefix] = args;
  if (!outputDir || !columns || !rows) {
    throw new Error('Usage: ilc raw:slice-grid <inputPath> <outputDir> <columns> <rows> [namePrefix]');
  }

  const sliceOptions = {
    inputPath: firstArg,
    outputDir,
    columns: Number(columns),
    rows: Number(rows),
    removeBackground: 'white',
    trim: true
  } as const;
  const slicedAssets = await sliceRawSpriteSheet(namePrefix ? { ...sliceOptions, namePrefix } : sliceOptions);
  console.log(JSON.stringify(slicedAssets, null, 2));
}

async function optimizeRawImage(): Promise<void> {
  const [outputDir, assetId, width] = args;
  if (!outputDir || !assetId) {
    throw new Error('Usage: ilc raw:optimize-image <inputPath> <outputDir> <assetId> [width]');
  }

  const optimizeOptions = {
    inputPath: firstArg,
    outputDir,
    assetId
  };
  const optimizedAssets = await optimizeRasterAsset(width ? { ...optimizeOptions, width: Number(width) } : optimizeOptions);
  console.log(JSON.stringify(optimizedAssets, null, 2));
}

async function detectRawSymbols(): Promise<void> {
  const [outputDir, namePrefix, threshold, minArea, padding] = args;
  if (!outputDir || !namePrefix) {
    throw new Error('Usage: ilc raw:detect-symbols <inputPath> <outputDir> <namePrefix> [threshold] [minArea] [padding]');
  }

  const cliArgs = [
    'run',
    '-p',
    'coconut-vision-cli',
    '--',
    'crop',
    firstArg,
    outputDir,
    namePrefix
  ];

  if (threshold) cliArgs.push('--threshold', threshold);
  if (minArea) cliArgs.push('--min-area', minArea);
  if (padding) cliArgs.push('--padding', padding);

  await runCargo(cliArgs);
}

async function runCargo(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('cargo', args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`cargo ${args.join(' ')} exited with code ${code ?? 'unknown'}.`));
    });
  });
}

function showPreviewPlaceholder(): void {
  console.log('Preview command placeholder. Use: pnpm dev:pixi and pass ?game=fruit-classic&fixture=small-win');
}

function showBuildPlaceholder(): void {
  console.log('Build command placeholder. Use target-specific builders: pixi via Vite, cocos via Cocos Creator CLI.');
}

function showHelp(): void {
  console.log(`ILuvCoconut CLI

Commands:
  validate <gameDir>
  manifest <gameDir>
  raw:inspect <rawAssetsDir>
  raw:detect-symbols <inputPath> <outputDir> <namePrefix> [threshold] [minArea] [padding]
  raw:slice-grid <inputPath> <outputDir> <columns> <rows> [namePrefix]
  raw:optimize-image <inputPath> <outputDir> <assetId> [width]
  preview <gameDir> --target pixi
  build <gameDir> --target pixi|cocos
`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
