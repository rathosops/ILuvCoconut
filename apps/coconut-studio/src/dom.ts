export function getCanvasContext(canvas: HTMLCanvasElement, willReadFrequently = false): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', { alpha: true, willReadFrequently });
  if (!context) throw new Error('Unable to create 2D canvas context.');
  return context;
}

export function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id} element.`);
  return element as T;
}

export function getInputTarget(event: Event): HTMLInputElement {
  if (!(event.currentTarget instanceof HTMLInputElement)) throw new Error('Expected input event target.');
  return event.currentTarget;
}
