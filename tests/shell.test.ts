import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('the first-run shell stays truthful and mutation-free', () => {
  const page = readFileSync(resolve('extension.html'), 'utf8');
  const app = readFileSync(resolve('src/ui/main.tsx'), 'utf8');

  expect(page).toContain('Sky River Machine');
  expect(app).toContain('under construction');
  expect(app).toContain('Workspaces');
  expect(app).toContain('Recovery');
  expect(app).toContain('disabled');
  expect(app).not.toMatch(/tabs\.(remove|discard|move)/);
});
