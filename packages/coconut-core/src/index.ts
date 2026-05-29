import type { GameConfig, SpinRequest, SpinResult } from '@iluvcoconut/contracts';
import type { ICoconutRenderer, PresentationCommand, PresentationTimeline } from '@iluvcoconut/renderer-api';

export type SlotState =
  | 'boot'
  | 'loading'
  | 'idle'
  | 'spinRequested'
  | 'spinning'
  | 'presentingWin'
  | 'settled'
  | 'error';

export interface SpinProvider {
  spin(request: SpinRequest): Promise<SpinResult>;
}

export class SlotStateMachine {
  private current: SlotState = 'boot';

  get state(): SlotState {
    return this.current;
  }

  transition(next: SlotState): void {
    this.current = next;
  }
}

export class WinPresentationPlanner {
  plan(config: GameConfig, result: SpinResult): PresentationTimeline {
    const reelIds = Array.from({ length: config.layout.reels }, (_, index) => `reel-${index}`);
    const commands: PresentationCommand[] = [
      { type: 'LOCK_INPUT' },
      { type: 'SPIN_REELS', reelIds, mode: 'normal', durationMs: config.presentation.spinDurationMs }
    ];

    for (let reelIndex = 0; reelIndex < config.layout.reels; reelIndex += 1) {
      const finalSymbols = result.matrix.map((row) => row[reelIndex] ?? 'missing');
      commands.push({
        type: 'STOP_REEL',
        reelId: `reel-${reelIndex}`,
        finalSymbols,
        stopIndex: result.reelStops?.[reelIndex] ?? 0,
        delayMs: reelIndex * config.presentation.reelStopDelayMs
      });
    }

    for (const win of result.wins) {
      commands.push({ type: 'HIGHLIGHT_WIN', winId: win.id, positions: win.positions, durationMs: config.presentation.winCycleDelayMs });
    }

    if (result.totalWin > 0) {
      commands.push({ type: 'COUNT_UP_WIN', amount: result.totalWin, durationMs: 1200 });
    }

    const level = result.presentation?.bigWinLevel;
    if (level && level !== 'none') {
      commands.push({ type: 'SHOW_BIG_WIN', level, amount: result.totalWin });
    }

    commands.push({ type: 'UNLOCK_INPUT' });
    return { result, commands };
  }
}

export class SlotRuntime {
  private readonly state = new SlotStateMachine();
  private readonly planner = new WinPresentationPlanner();
  private currentBet: number;

  constructor(
    private readonly renderer: ICoconutRenderer,
    private readonly spinProvider: SpinProvider,
    private readonly config: GameConfig
  ) {
    this.currentBet = config.bet.default;
  }

  async boot(): Promise<void> {
    this.state.transition('loading');
    await this.renderer.loadAssets(this.config.assetManifest);
    this.createBaseScene();
    this.state.transition('idle');
  }

  async spin(): Promise<SpinResult> {
    this.state.transition('spinRequested');
    const result = await this.spinProvider.spin({
      gameId: this.config.id,
      sessionId: 'local-session',
      betAmount: this.currentBet,
      currency: 'BRL',
      mode: 'mock'
    });

    this.state.transition('spinning');
    const timeline = this.planner.plan(this.config, result);
    await this.renderer.playTimeline(timeline);
    this.state.transition('settled');
    this.state.transition('idle');
    return result;
  }

  getState(): SlotState {
    return this.state.state;
  }

  private createBaseScene(): void {
    this.renderer.createLayer('background');
    this.renderer.createLayer('reels');
    this.renderer.createLayer('ui');

    for (let i = 0; i < this.config.layout.reels; i += 1) {
      this.renderer.createReel({
        id: `reel-${i}`,
        rows: this.config.layout.rows,
        symbolWidth: 160,
        symbolHeight: 160,
        x: i * 170,
        y: 0
      });
    }
  }
}

export class FixtureSpinProvider implements SpinProvider {
  constructor(private readonly result: SpinResult) {}
  spin(): Promise<SpinResult> {
    return Promise.resolve(this.result);
  }
}
