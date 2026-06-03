import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../../icons/Icon';
import { Mascot } from '../../components/Brand';
import { SymbolTile } from '../../components/SymbolTile';
import { buildSymbolViews } from '../../components/symbolView';
import { type StudioProject } from '../../state/useStudioProject';

const START_BALANCE = 1000;
const BET = 20;
const SPIN_TICK_MS = 70;
const SPIN_TICKS = 12;
const WIN_CHANCE = 0.55;
const MAX_WIN_MULT = 8;

function randomGrid(ids: string[], reels: number, rows: number): string[][] {
  return Array.from({ length: reels }, () =>
    Array.from({ length: rows }, () => ids[Math.floor(Math.random() * ids.length)] ?? ''));
}

export function PreviewMode({ project }: { project: StudioProject }): JSX.Element {
  const { reels, rows } = project.state.slotLayout;
  const ids = project.state.symbols.map((symbol) => symbol.id);
  const views = buildSymbolViews(project.state.symbols);

  const [grid, setGrid] = useState<string[][]>(project.reelGrid);
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(START_BALANCE);
  const [win, setWin] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => setGrid(project.reelGrid), [project.reelGrid]);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const finish = useCallback(() => {
    const final = randomGrid(ids, reels, rows);
    setGrid(final);
    const amount = Math.random() < WIN_CHANCE ? Math.round(Math.random() * MAX_WIN_MULT + 1) * BET : 0;
    setWin(amount);
    setBalance((value) => value + amount);
    setSpinning(false);
  }, [ids, reels, rows]);

  function spin(): void {
    if (spinning || balance < BET || ids.length === 0) return;
    setSpinning(true);
    setWin(0);
    setBalance((value) => value - BET);
    let ticks = 0;
    timer.current = setInterval(() => {
      setGrid(randomGrid(ids, reels, rows));
      ticks += 1;
      if (ticks > SPIN_TICKS && timer.current) {
        clearInterval(timer.current);
        finish();
      }
    }, SPIN_TICK_MS);
  }

  return (
    <div className="viewport">
      <div className="vp-toolbar">
        <span className="vp-title">Preview</span>
        <span className="tag green"><Icon name="dot" size={10} /> {project.meta.renderer === 'cocos' ? 'Cocos' : 'Pixi'} · 60fps</span>
        <span className="grow" />
        <button type="button" className="btn sm" onClick={() => { setBalance(START_BALANCE); setWin(0); setGrid(project.reelGrid); }}><Icon name="refresh" size={14} /> Reset</button>
      </div>
      <div className="vp-stage dark">
        <div className="cabinet">
          <div className="marquee">
            <div className="row" style={{ gap: 9 }}>
              <Mascot size={30} />
              <div className="marquee-title">{project.meta.title}</div>
            </div>
            {win > 0 && <span className="cab-stat-value gold">+{win}</span>}
          </div>
          <div className={`cab-screen ${win > 0 ? 'win' : ''}`}>
            <div className="cab-grid" style={{ gridTemplateColumns: `repeat(${reels}, 1fr)` }}>
              {Array.from({ length: reels }).map((_reelValue, reel) =>
                Array.from({ length: rows }).map((_rowValue, row) => (
                  <div key={`${reel}-${row}`} className={`cab-cell ${spinning ? 'spin' : ''}`}>
                    <SymbolTile view={views[grid[reel]?.[row] ?? ''] ?? null} badge={false} />
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="cab-controls">
            <div className="cab-stats">
              <div><div className="cab-stat-label">Saldo</div><div className="cab-stat-value">{balance.toLocaleString('pt-BR')}</div></div>
              <div><div className="cab-stat-label">Aposta</div><div className="cab-stat-value">{BET}</div></div>
              <div><div className="cab-stat-label">Win</div><div className={`cab-stat-value ${win > 0 ? 'gold' : ''}`}>{win}</div></div>
            </div>
            <button type="button" className="spin-btn" disabled={spinning || ids.length === 0} onClick={spin}>
              {spinning ? <Icon name="refresh" size={22} /> : <span className="row" style={{ gap: 6 }}><Icon name="play" size={16} /> SPIN</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
