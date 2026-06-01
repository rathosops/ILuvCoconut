import { getElement, getInputTarget } from './dom';
import { createDefaultPaylines, formatPaylinePattern, parsePaylinePattern, resetPaytable, syncPaytableWithState } from './paytable';
import { MIN_COUNT_INPUT, MIN_NUMERIC_INPUT } from './studioConstants';
import type { StudioPayline, StudioState, StudioSymbolPay } from './types';

interface BindPaytableControlsOptions {
  draw: () => void;
  state: StudioState;
}

export function bindPaytableControls({ draw, state }: BindPaytableControlsOptions): void {
  getElement<HTMLSelectElement>('paytableSymbol').addEventListener('change', (event) => {
    state.paytable.selectedSymbolId = getSelectedValue(event);
    syncPaytableControls(state);
  });

  getElement<HTMLSelectElement>('paytableLine').addEventListener('change', (event) => {
    state.paytable.selectedPaylineId = getSelectedValue(event);
    syncPaytableControls(state);
  });

  getElement<HTMLInputElement>('paytableLineBet').addEventListener('input', (event) => {
    state.paytable.lineBet = Math.max(MIN_COUNT_INPUT, Number(getInputTarget(event).value));
    draw();
  });

  getElement<HTMLInputElement>('paytableMinMatch').addEventListener('input', (event) => {
    state.paytable.minMatch = Math.max(MIN_COUNT_INPUT, Number(getInputTarget(event).value));
    draw();
  });

  getElement<HTMLSelectElement>('paytableEvaluation').addEventListener('change', (event) => {
    state.paytable.evaluation = getSelectedValue(event) as typeof state.paytable.evaluation;
    draw();
  });

  bindBooleanRule('paytableWildSubstitutes', state, 'wildSubstitutes', draw);
  bindBooleanRule('paytableScatterAnywhere', state, 'scatterPaysAnywhere', draw);
  bindBooleanRule('paytableBonusAnywhere', state, 'bonusTriggersAnywhere', draw);
  bindBooleanRule('paytableHighestOnly', state, 'highestWinOnlyPerLine', draw);

  getElement<HTMLInputElement>('paylineEnabled').addEventListener('change', (event) => {
    const payline = getSelectedPayline(state);
    if (!payline) return;
    payline.enabled = getInputTarget(event).checked;
    draw();
  });

  getElement<HTMLInputElement>('paylinePattern').addEventListener('change', (event) => {
    const payline = getSelectedPayline(state);
    if (!payline) return;
    payline.pattern = parsePaylinePattern(getInputTarget(event).value, state.slotLayout.reels);
    draw();
  });

  getElement<HTMLButtonElement>('resetPaylines').addEventListener('click', () => {
    state.paytable.paylines = createDefaultPaylines(state.slotLayout.reels, state.slotLayout.rows);
    state.paytable.selectedPaylineId = state.paytable.paylines[MIN_NUMERIC_INPUT]?.id ?? '';
    draw();
  });

  getElement<HTMLDivElement>('payoutRows').addEventListener('input', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const count = Number(event.target.dataset.payoutCount);
    const symbolPay = getSelectedSymbolPay(state);
    const payout = symbolPay?.payouts.find((entry) => entry.count === count);
    if (!payout) return;
    payout.multiplier = Math.max(MIN_NUMERIC_INPUT, Number(event.target.value));
    draw();
  });
}

export function resetPaytableControls(state: StudioState): void {
  resetPaytable(state);
  syncPaytableControls(state);
}

export function syncPaytableControls(state: StudioState): void {
  syncPaytableWithState(state);
  syncRuleControls(state);
  syncSymbolPayControls(state);
  syncPaylineControls(state);
}

function syncRuleControls(state: StudioState): void {
  getElement<HTMLInputElement>('paytableLineBet').value = String(state.paytable.lineBet);
  getElement<HTMLInputElement>('paytableMinMatch').value = String(state.paytable.minMatch);
  getElement<HTMLSelectElement>('paytableEvaluation').value = state.paytable.evaluation;
  getElement<HTMLInputElement>('paytableWildSubstitutes').checked = state.paytable.wildSubstitutes;
  getElement<HTMLInputElement>('paytableScatterAnywhere').checked = state.paytable.scatterPaysAnywhere;
  getElement<HTMLInputElement>('paytableBonusAnywhere').checked = state.paytable.bonusTriggersAnywhere;
  getElement<HTMLInputElement>('paytableHighestOnly').checked = state.paytable.highestWinOnlyPerLine;
}

function syncSymbolPayControls(state: StudioState): void {
  const select = getElement<HTMLSelectElement>('paytableSymbol');
  select.innerHTML = state.paytable.symbolPays.map((symbolPay) => {
    const symbol = state.symbols.find((entry) => entry.id === symbolPay.symbolId);
    const label = symbol?.label ?? symbolPay.symbolId;
    return `<option value="${escapeAttribute(symbolPay.symbolId)}">${escapeHtml(label)}</option>`;
  }).join('');
  select.value = state.paytable.selectedSymbolId;

  const symbolPay = getSelectedSymbolPay(state);
  const rows = getElement<HTMLDivElement>('payoutRows');
  rows.innerHTML = symbolPay ? renderPayoutRows(symbolPay) : '<div class="empty-note">Sem simbolos pagantes.</div>';
}

function syncPaylineControls(state: StudioState): void {
  const select = getElement<HTMLSelectElement>('paytableLine');
  select.innerHTML = state.paytable.paylines.map((payline) => (
    `<option value="${escapeAttribute(payline.id)}">${escapeHtml(payline.id)}</option>`
  )).join('');
  select.value = state.paytable.selectedPaylineId;

  const payline = getSelectedPayline(state);
  getElement<HTMLInputElement>('paylineEnabled').checked = payline?.enabled ?? false;
  getElement<HTMLInputElement>('paylinePattern').value = payline ? formatPaylinePattern(payline.pattern) : '';
}

function renderPayoutRows(symbolPay: StudioSymbolPay): string {
  return symbolPay.payouts.map((payout) => `
    <label class="payout-row">
      <span>${payout.count}x</span>
      <input data-payout-count="${payout.count}" type="number" min="${MIN_NUMERIC_INPUT}" value="${payout.multiplier}" />
    </label>
  `).join('');
}

function bindBooleanRule(id: string, state: StudioState, key: 'wildSubstitutes' | 'scatterPaysAnywhere' | 'bonusTriggersAnywhere' | 'highestWinOnlyPerLine', draw: () => void): void {
  getElement<HTMLInputElement>(id).addEventListener('change', (event) => {
    state.paytable[key] = getInputTarget(event).checked;
    draw();
  });
}

function getSelectedSymbolPay(state: StudioState): StudioSymbolPay | undefined {
  return state.paytable.symbolPays.find((symbolPay) => symbolPay.symbolId === state.paytable.selectedSymbolId);
}

function getSelectedPayline(state: StudioState): StudioPayline | undefined {
  return state.paytable.paylines.find((payline) => payline.id === state.paytable.selectedPaylineId);
}

function getSelectedValue(event: Event): string {
  if (!(event.currentTarget instanceof HTMLSelectElement)) throw new Error('Expected select event target.');
  return event.currentTarget.value;
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', '&quot;');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
