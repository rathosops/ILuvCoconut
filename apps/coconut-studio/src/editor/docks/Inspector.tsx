import { Icon, type IconName } from '../../icons/Icon';
import { type StudioProject } from '../../state/useStudioProject';
import { type Selection } from '../types';
import { InspectorSymbol } from './InspectorSymbol';
import { InspectorFrame } from './InspectorFrame';
import { InspectorCell, InspectorGame, InspectorPaytable, InspectorReels } from './InspectorConfig';

export interface InspectorProps {
  project: StudioProject;
  selection: Selection;
  onSelect: (selection: Selection) => void;
}

interface Head {
  icon: IconName;
  title: string;
  sub: string;
}

function headFor(project: StudioProject, selection: Selection): Head {
  switch (selection.kind) {
    case 'reels': return { icon: 'reels', title: 'Reels', sub: 'SlotGrid' };
    case 'paytable': return { icon: 'table', title: 'Paytable', sub: 'PayConfig' };
    case 'cell': return { icon: 'grid', title: `Célula ${selection.reel},${selection.row}`, sub: 'ReelCell' };
    case 'frame': return { icon: 'crop', title: `frame #${selection.index}`, sub: 'DetectedFrame' };
    case 'symbol': {
      const symbol = project.state.symbols.find((item) => item.frameIndex === selection.frameIndex);
      return { icon: 'sparkle', title: symbol?.label ?? 'Símbolo', sub: 'Symbol' };
    }
    default: return { icon: 'box', title: project.meta.title, sub: 'GameRoot' };
  }
}

function body(project: StudioProject, selection: Selection, onSelect: (selection: Selection) => void): JSX.Element {
  switch (selection.kind) {
    case 'reels': return <InspectorReels project={project} />;
    case 'paytable': return <InspectorPaytable project={project} />;
    case 'cell': return <InspectorCell project={project} reel={selection.reel} row={selection.row} />;
    case 'symbol': return <InspectorSymbol project={project} frameIndex={selection.frameIndex} />;
    case 'frame': return <InspectorFrame project={project} index={selection.index} onAssign={(frameIndex) => onSelect({ kind: 'symbol', frameIndex })} />;
    default: return <InspectorGame project={project} />;
  }
}

export function Inspector({ project, selection, onSelect }: InspectorProps): JSX.Element {
  const head = headFor(project, selection);
  return (
    <div className="dock right">
      <div className="dock-tabs"><button type="button" className="dock-tab active"><Icon name="sliders" size={14} /> Inspector</button></div>
      <div className="dock-body">
        <div className="insp-head">
          <span className="insp-icon"><Icon name={head.icon} size={18} /></span>
          <div style={{ minWidth: 0 }}>
            <div className="insp-title">{head.title}</div>
            <div className="insp-sub">{head.sub}</div>
          </div>
        </div>
        {body(project, selection, onSelect)}
      </div>
    </div>
  );
}
