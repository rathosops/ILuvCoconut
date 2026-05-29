import type { GameConfig, SpinResult } from '@iluvcoconut/contracts';
import { FixtureSpinProvider, SlotRuntime } from '@iluvcoconut/core';
import { PixiCoconutRenderer } from '@iluvcoconut/pixi';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app element');

const config: GameConfig = {
  id: 'fruit-classic',
  title: 'Fruit Classic',
  template: 'slot-5x3-classic',
  layout: { reels: 5, rows: 3, mode: 'paylines' },
  bet: { default: 1, min: 0.2, max: 100, denominations: [0.2, 0.5, 1, 2, 5, 10] },
  symbols: [
    { id: 'cherry', type: 'regular' },
    { id: 'lemon', type: 'regular' },
    { id: 'seven', type: 'regular' },
    { id: 'wild', type: 'wild' },
    { id: 'scatter', type: 'scatter' }
  ],
  presentation: { spinDurationMs: 600, reelStopDelayMs: 120, winCycleDelayMs: 800, turboMode: true, quickSpin: true },
  assetManifest: { gameId: 'fruit-classic', version: '0.1.0', assets: [] }
};

const fixture: SpinResult = {
  roundId: 'fixture-001',
  gameId: 'fruit-classic',
  betAmount: 1,
  matrix: [
    ['cherry', 'seven', 'lemon', 'wild', 'scatter'],
    ['lemon', 'seven', 'seven', 'seven', 'cherry'],
    ['bar', 'lemon', 'wild', 'cherry', 'lemon']
  ],
  wins: [
    { id: 'win-001', type: 'line', symbolId: 'seven', amount: 50, positions: [{ reel: 1, row: 1 }, { reel: 2, row: 1 }, { reel: 3, row: 1 }] }
  ],
  totalWin: 50,
  presentation: { bigWinLevel: 'big' }
};

const renderer = new PixiCoconutRenderer();
await renderer.init({ parent: app, quality: 'high', debug: true });
const runtime = new SlotRuntime(renderer, new FixtureSpinProvider(fixture), config);
await runtime.boot();

window.addEventListener('click', () => {
  void runtime.spin();
});
