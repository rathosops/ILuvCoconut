import { Icon } from '../icons/Icon';
import { type StudioProject } from '../state/useStudioProject';

export interface StatusBarProps {
  project: StudioProject;
  rtp: number;
}

export function StatusBar({ project, rtp }: StatusBarProps): JSX.Element {
  const { reels, rows } = project.state.slotLayout;
  const rendererLabel = project.meta.renderer === 'cocos' ? 'Cocos' : 'Pixi';
  return (
    <div className="statusbar">
      <span className="status-seg"><Icon name="dot" size={9} style={{ color: 'var(--accent)' }} /> {project.status}</span>
      <span className="status-mono">res://games/{project.meta.gameId}</span>
      <span className="status-spacer" />
      <span className="status-seg mono">{reels}×{rows} · {reels * rows} células</span>
      <span className="status-seg mono">RTP {rtp}%</span>
      <span className="status-seg mono">{rendererLabel} · 60fps</span>
    </div>
  );
}
