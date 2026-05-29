#!/usr/bin/env node
import {
  buildAssetManifest,
  listRawAssetSources,
  sliceRawSpriteSheet,
  validateGameDirectory
} from '@iluvcoconut/asset-pipeline';

const [, , command, firstArg = 'games/fruit-classic', ...args] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case 'validate': {
      const errors = await validateGameDirectory(firstArg);
      if (errors.length > 0) {
        console.error('ILuvCoconut validation failed:');
        for (const error of errors) console.error(`- ${error}`);
        process.exitCode = 1;
        return;
      }
      console.log(`ILuvCoconut validation passed for ${firstArg}`);
      break;
    }
    case 'manifest': {
      const manifest = await buildAssetManifest(firstArg);
      console.log(JSON.stringify(manifest, null, 2));
      break;
    }
    case 'raw:inspect': {
      const reports = await listRawAssetSources(firstArg);
      console.log(JSON.stringify(reports, null, 2));
      break;
    }
    case 'raw:slice-grid': {
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
      break;
    }
    case 'preview': {
      console.log('Preview command placeholder. Use: pnpm dev:pixi and pass ?game=fruit-classic&fixture=small-win');
      break;
    }
    case 'build': {
      console.log('Build command placeholder. Use target-specific builders: pixi via Vite, cocos via Cocos Creator CLI.');
      break;
    }
    default:
      console.log(`ILuvCoconut CLI

Commands:
  validate <gameDir>
  manifest <gameDir>
  raw:inspect <rawAssetsDir>
  raw:slice-grid <inputPath> <outputDir> <columns> <rows> [namePrefix]
  preview <gameDir> --target pixi
  build <gameDir> --target pixi|cocos
`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
