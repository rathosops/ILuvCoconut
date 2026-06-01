import { FixtureSpinProvider, SlotRuntime } from '@iluvcoconut/core';
import { PixiCoconutRenderer } from '@iluvcoconut/pixi';
import { loadGameBundle } from './gameLoader';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app element');

const { config, fixture, params } = await loadGameBundle();
const renderer = new PixiCoconutRenderer();
await renderer.init({ parent: app, quality: params.quality, debug: params.debug });
const runtime = new SlotRuntime(renderer, new FixtureSpinProvider(fixture), config);
await runtime.boot();
createHud(config.title, params.gameId, params.fixtureId, params.debug);

window.addEventListener('click', () => { void runtime.spin(); });

function createHud(title: string, gameId: string, fixtureId: string, debug: boolean): void {
  const hud = document.querySelector<HTMLDivElement>('#hud') ?? document.createElement('div');
  hud.id = 'hud';
  hud.style.cssText = [
    'position:fixed',
    'left:16px',
    'top:16px',
    'z-index:10',
    'padding:10px 12px',
    'border:1px solid rgba(94,213,138,0.45)',
    'border-radius:8px',
    'color:#dfffea',
    'background:rgba(4,16,12,0.78)',
    'font:12px system-ui'
  ].join(';');
  hud.textContent = `${title} | game=${gameId} | fixture=${fixtureId}${debug ? ' | debug=1' : ''} | clique para spin`;
  document.body.appendChild(hud);
}
