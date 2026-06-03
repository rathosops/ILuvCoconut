import { useState } from 'react';
import { Icon } from './icons/Icon';
import { Launcher } from './screens/Launcher';
import { NewProjectDialog } from './screens/NewProjectDialog';
import { Settings } from './screens/Settings';
import { Editor } from './editor/Editor';
import { useRecentProjects } from './state/useRecentProjects';
import { recordOpened, type CreateProjectInput, type ProjectSummary } from './platform/projects';
import { type ProjectSeed } from './state/createStudioState';
import { DEFAULT_ASSET_PREFIX } from './engine/studioConstants';

const DEFAULT_RESOLUTION = '1280×720';

function seedFromSummary(summary: ProjectSummary): ProjectSeed {
  return {
    gameId: summary.id,
    title: summary.name,
    assetPrefix: DEFAULT_ASSET_PREFIX,
    projectType: summary.type,
    language: 'pt',
    renderer: summary.renderer,
    resolution: DEFAULT_RESOLUTION
  };
}

function seedFromInput(input: CreateProjectInput): ProjectSeed {
  return {
    gameId: input.id,
    title: input.name,
    assetPrefix: DEFAULT_ASSET_PREFIX,
    projectType: input.type,
    language: input.language,
    renderer: input.renderer,
    resolution: input.resolution
  };
}

export function App(): JSX.Element {
  const recent = useRecentProjects();
  const [seed, setSeed] = useState<ProjectSeed | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  function openProject(summary: ProjectSummary): void {
    recordOpened(summary);
    setSeed(seedFromSummary(summary));
  }

  function createProject(input: CreateProjectInput): void {
    setShowNew(false);
    void recent.create(input);
    setSeed(seedFromInput(input));
  }

  const title = seed
    ? <><span className="crumb-strong">{seed.title}</span><span className="dot-sep" /><span>ILuvCoconut Studio</span></>
    : <span className="crumb-strong">ILuvCoconut Studio</span>;

  return (
    <div className="win">
      <div className="titlebar">
        <div className="title-center">{title}</div>
        <div className="title-right">
          <span className="title-chip"><Icon name="bolt" size={12} style={{ color: 'var(--gold)' }} /> v0.4.1</span>
        </div>
      </div>

      {seed
        ? <Editor seed={seed} onExit={() => setSeed(null)} />
        : <Launcher projects={recent.projects} loading={recent.loading} onNew={() => setShowNew(true)} onOpen={openProject} onSettings={() => setShowSettings(true)} />}

      {showNew && <NewProjectDialog onClose={() => setShowNew(false)} onCreate={createProject} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
