import type { GameProjectType, StudioLanguage } from '../engine/types';
import type { RendererKind } from '../state/createStudioState';

export interface ProjectSummary {
  id: string;
  name: string;
  type: GameProjectType;
  gridLabel: string;
  renderer: RendererKind;
  updatedAt: number;
}

export interface CreateProjectInput {
  id: string;
  name: string;
  type: GameProjectType;
  renderer: RendererKind;
  language: StudioLanguage;
  resolution: string;
  template: string;
}

interface TauriInvoke {
  invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
}

interface TauriGlobal {
  __TAURI_INTERNALS__?: TauriInvoke;
}

const RECENT_KEY = 'ilc.studio.recent';

const BUNDLED: ProjectSummary[] = [
  { id: 'fruit-classic', name: 'Fruit Classic', type: 'slot', gridLabel: '5×3', renderer: 'pixi', updatedAt: 0 }
];

export function isDesktopRuntime(): boolean {
  return typeof (globalThis as TauriGlobal).__TAURI_INTERNALS__?.invoke === 'function';
}

function tauriInvoke(): TauriInvoke['invoke'] {
  const internals = (globalThis as TauriGlobal).__TAURI_INTERNALS__;
  if (!internals?.invoke) throw new Error('Tauri runtime indisponível.');
  return internals.invoke;
}

function readRecents(): ProjectSummary[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ProjectSummary[];
  } catch {
    return [];
  }
}

function writeRecents(projects: ProjectSummary[]): void {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(projects));
  } catch {
    /* storage unavailable — keep in-memory only */
  }
}

function mergeRecent(summary: ProjectSummary): ProjectSummary[] {
  const others = readRecents().filter((project) => project.id !== summary.id);
  const next = [summary, ...others];
  writeRecents(next);
  return next;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  if (isDesktopRuntime()) return tauriInvoke()<ProjectSummary[]>('list_projects');
  const recents = readRecents();
  const known = new Set(recents.map((project) => project.id));
  return [...recents, ...BUNDLED.filter((project) => !known.has(project.id))];
}

export async function createProject(input: CreateProjectInput): Promise<ProjectSummary> {
  const summary: ProjectSummary = {
    id: input.id,
    name: input.name,
    type: input.type,
    gridLabel: input.type === 'slot' ? '5×3' : '—',
    renderer: input.renderer,
    updatedAt: Date.now()
  };
  if (isDesktopRuntime()) {
    await tauriInvoke()<void>('create_project', { request: input });
  }
  mergeRecent(summary);
  return summary;
}

export function recordOpened(summary: ProjectSummary): void {
  mergeRecent({ ...summary, updatedAt: Date.now() });
}
