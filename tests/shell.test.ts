import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('the first-run shell stays truthful and mutation-free', () => {
  const page = readFileSync(resolve('extension.html'), 'utf8');
  const app = readFileSync(resolve('src/ui/main.tsx'), 'utf8');
  const firefoxManifest = JSON.parse(readFileSync(resolve('manifests/firefox.json'), 'utf8')) as { background?: { type?: string } };

  expect(page).toContain('Sky River Machine');
  expect(app).toContain('under construction');
  expect(app).toContain("'workspaces'");
  expect(app).toContain("'recovery'");
  expect(app).toContain('Local semantic model: MiniLM embeddings');
  expect(app).toContain('disabled');
  expect(app).not.toMatch(/tabs\.(remove|discard|move)/);
  expect(firefoxManifest.background?.type).toBe('module');
});
