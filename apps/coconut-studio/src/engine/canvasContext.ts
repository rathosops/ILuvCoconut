export function getCanvasContext(canvas: HTMLCanvasElement, willReadFrequently = false): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', { alpha: true, willReadFrequently });
  if (!context) throw new Error('Unable to create 2D canvas context.');
  return context;
}
