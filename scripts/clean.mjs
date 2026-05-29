import { rm } from 'node:fs/promises';

for (const path of ['dist', 'build', '.turbo']) {
  await rm(path, { recursive: true, force: true });
}
