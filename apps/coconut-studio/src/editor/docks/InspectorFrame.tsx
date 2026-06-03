import { Icon } from '../../icons/Icon';
import { Field } from '../../components/controls';
import { DETECTED_MODE } from '../../engine/studioConstants';
import { getFrames } from '../../engine/frameMath';
import { removeSymbolForFrame } from '../../engine/symbolManager';
import { type FrameRect } from '../../engine/types';
import { type StudioProject } from '../../state/useStudioProject';

export interface InspectorFrameProps {
  project: StudioProject;
  index: number;
  onAssign: (frameIndex: number) => void;
}

export function InspectorFrame({ project, index, onAssign }: InspectorFrameProps): JSX.Element {
  const frame = getFrames(project.state).find((item) => item.index === index);
  if (!frame) return <div className="dock-section muted">Frame não encontrado.</div>;
  const editable = project.state.frameMode === DETECTED_MODE;

  function editRect(patch: Partial<Pick<FrameRect, 'x' | 'y' | 'width' | 'height'>>): void {
    project.mutate((state) => {
      state.detectedFrames = state.detectedFrames.map((item) => (item.index === index ? { ...item, ...patch } : item));
    });
  }

  function discard(): void {
    project.mutate((state) => {
      removeSymbolForFrame(state, index);
      state.detectedFrames = state.detectedFrames
        .filter((item) => item.index !== index)
        .map((item, position) => ({ ...item, index: position, column: position }));
      state.selectedFrame = Math.max(0, Math.min(state.selectedFrame, state.detectedFrames.length - 1));
    });
  }

  return (
    <div className="dock-section">
      <div className="field-row">
        <Field label="X"><input className="num" type="number" value={frame.x} disabled={!editable} onChange={(event) => editRect({ x: Number(event.target.value) })} /></Field>
        <Field label="Y"><input className="num" type="number" value={frame.y} disabled={!editable} onChange={(event) => editRect({ y: Number(event.target.value) })} /></Field>
      </div>
      <div className="field-row">
        <Field label="Largura"><input className="num" type="number" value={frame.width} disabled={!editable} onChange={(event) => editRect({ width: Number(event.target.value) })} /></Field>
        <Field label="Altura"><input className="num" type="number" value={frame.height} disabled={!editable} onChange={(event) => editRect({ height: Number(event.target.value) })} /></Field>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <button type="button" className="btn sm grow" onClick={() => onAssign(index)}><Icon name="sparkle" size={14} /> Editar símbolo</button>
        <button type="button" className="btn sm btn-danger grow" disabled={!editable} onClick={discard}><Icon name="x" size={14} /> Descartar</button>
      </div>
    </div>
  );
}
