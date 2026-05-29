import type { SpinResult } from '@iluvcoconut/contracts';

export function assertSpinMatrixSize(result: SpinResult, reels: number, rows: number): void {
  if (result.matrix.length !== rows) {
    throw new Error(`Expected ${rows} rows, received ${result.matrix.length}.`);
  }
  for (const [rowIndex, row] of result.matrix.entries()) {
    if (row.length !== reels) {
      throw new Error(`Expected ${reels} reels at row ${rowIndex}, received ${row.length}.`);
    }
  }
}
