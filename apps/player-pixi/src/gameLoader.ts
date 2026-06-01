import type { GameConfig, SpinResult } from '@iluvcoconut/contracts';
import type { QualityProfile } from '@iluvcoconut/renderer-api';

const DEFAULT_GAME_ID = 'fruit-classic';
const DEFAULT_FIXTURE_ID = 'big-win';
const DEFAULT_QUALITY: QualityProfile = 'high';

export interface PlayerParams {
  debug: boolean;
  fixtureId: string;
  gameId: string;
  quality: QualityProfile;
}

export interface LoadedGameBundle {
  config: GameConfig;
  fixture: SpinResult;
  params: PlayerParams;
}

export function getPlayerParams(search = window.location.search): PlayerParams {
  const params = new URLSearchParams(search);
  return {
    debug: params.get('debug') === '1',
    fixtureId: params.get('fixture') ?? DEFAULT_FIXTURE_ID,
    gameId: params.get('game') ?? DEFAULT_GAME_ID,
    quality: parseQuality(params.get('quality'))
  };
}

export async function loadGameBundle(params = getPlayerParams()): Promise<LoadedGameBundle> {
  const basePath = `/games/${params.gameId}`;
  const [config, fixture] = await Promise.all([
    fetchJson<GameConfig>(`${basePath}/game.config.json`),
    fetchJson<SpinResult>(`${basePath}/fixtures/${params.fixtureId}.json`)
  ]);

  return { config, fixture, params };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Nao foi possivel carregar ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}

function parseQuality(value: string | null): QualityProfile {
  if (value === 'ultra' || value === 'high' || value === 'medium' || value === 'low' || value === 'batterySaver') return value;
  return DEFAULT_QUALITY;
}
