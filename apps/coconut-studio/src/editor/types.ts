export type EditorMode = 'reels' | 'assets' | 'paytable' | 'preview';

export type Selection =
  | { kind: 'game' }
  | { kind: 'reels' }
  | { kind: 'paytable' }
  | { kind: 'symbol'; frameIndex: number }
  | { kind: 'cell'; reel: number; row: number }
  | { kind: 'frame'; index: number };

export interface ModeTab {
  id: EditorMode;
  label: string;
}
