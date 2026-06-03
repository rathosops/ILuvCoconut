import { type IconName } from '../icons/Icon';
import { type TagVariant } from '../components/controls';
import type { GameProjectType } from '../engine/types';

export const TYPE_LABEL: Record<GameProjectType, string> = {
  slot: 'Slot',
  bingo: 'Bingo',
  pachinko: 'Pachinko',
  free: 'Livre'
};

export const TYPE_ICON: Record<GameProjectType, IconName> = {
  slot: 'reels',
  bingo: 'grid',
  pachinko: 'box',
  free: 'layers'
};

export const TYPE_TAG: Record<GameProjectType, TagVariant> = {
  slot: 'green',
  bingo: 'gold',
  pachinko: 'navy',
  free: 'husk'
};

export interface TypeVisual {
  tint: string;
  fg: string;
}

export const TYPE_VISUAL: Record<GameProjectType, TypeVisual> = {
  slot: { tint: '#DCEFD8', fg: '#1E7A43' },
  bingo: { tint: '#F6E6C0', fg: '#B5811A' },
  pachinko: { tint: '#DEDEF1', fg: '#5A4F9E' },
  free: { tint: '#ECE2CC', fg: '#6B5B3C' }
};

export interface GameTypeInfo {
  id: GameProjectType;
  name: string;
  blurb: string;
  tag: string;
}

export const GAME_TYPES: GameTypeInfo[] = [
  { id: 'slot', name: 'Slot', blurb: 'Reels, paylines e paytable. O coração da factory.', tag: 'Recomendado' },
  { id: 'bingo', name: 'Bingo', blurb: 'Cartelas, sorteio de bolas e padrões de prêmio.', tag: 'Template' },
  { id: 'pachinko', name: 'Pachinko', blurb: 'Física de pinos, canais e gatilhos de bônus.', tag: 'Template' },
  { id: 'free', name: 'Projeto Livre', blurb: 'Cena vazia com runtime e contratos do Core.', tag: 'Avançado' }
];

export interface TemplateInfo {
  id: string;
  name: string;
  type: GameProjectType;
  note: string;
}

export const TEMPLATES: TemplateInfo[] = [
  { id: 'classic-fruit', name: 'Frutas Clássicas', type: 'slot', note: '5×3 · 20 linhas' },
  { id: 'megaways', name: 'Megaways', type: 'slot', note: '6×7 · 117.649 formas' },
  { id: 'hold-spin', name: 'Hold & Spin', type: 'slot', note: '5×3 · respin de moedas' },
  { id: 'blank', name: 'Em branco', type: 'slot', note: 'monte do zero' }
];

export const FILTER_TYPES: Array<GameProjectType | 'all'> = ['all', 'slot', 'bingo', 'pachinko'];
