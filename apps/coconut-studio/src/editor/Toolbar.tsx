import { Icon } from '../icons/Icon';
import { Mascot } from '../components/Brand';
import { type EditorMode, type ModeTab } from './types';

const MODES: ModeTab[] = [
  { id: 'reels', label: 'Reels' },
  { id: 'assets', label: 'Assets' },
  { id: 'paytable', label: 'Paytable' },
  { id: 'preview', label: 'Preview' }
];
const MODE_ICON: Record<EditorMode, Parameters<typeof Icon>[0]['name']> = {
  reels: 'reels',
  assets: 'image',
  paytable: 'table',
  preview: 'play'
};
const MENUS = ['Arquivo', 'Editar', 'Projeto', 'Executar', 'Ajuda'];

export interface ToolbarProps {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  onExit: () => void;
  onSave: () => void;
  onExport: () => void;
}

export function Toolbar({ mode, setMode, onExit, onSave, onExport }: ToolbarProps): JSX.Element {
  return (
    <div className="toolbar">
      <button type="button" className="btn btn-ghost icon sm" title="Voltar aos projetos" onClick={onExit}>
        <Icon name="chevronD" size={16} style={{ transform: 'rotate(90deg)' }} />
      </button>
      <Mascot size={24} />
      <div className="menu-strip">
        {MENUS.map((menu) => <button key={menu} type="button" className="menu-item">{menu}</button>)}
      </div>

      <div className="mode-tabs">
        {MODES.map((tab) => (
          <button key={tab.id} type="button" className={`mode-tab ${mode === tab.id ? 'active' : ''}`} onClick={() => setMode(tab.id)}>
            <Icon name={MODE_ICON[tab.id]} size={15} className="ic" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="run-group">
        <button type="button" className="btn sm" onClick={onSave}><Icon name="save" size={14} /> Salvar</button>
        <button type="button" className="btn sm" onClick={onExport}><Icon name="download" size={14} /> Exportar</button>
        <div className="tb-sep" />
        <button type="button" className="btn btn-gold sm" onClick={() => setMode('preview')}><Icon name="play" size={14} /> Rodar</button>
      </div>
    </div>
  );
}
