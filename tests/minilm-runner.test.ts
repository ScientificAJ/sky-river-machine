import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { MiniLmEmbeddingRunner } from '../src/analysis/minilm-runner';

test('the bundled MiniLM runner returns validated local groups', async () => {
  const runner = new MiniLmEmbeddingRunner({ modelPath: resolve('public/models/minilm'), device: 'cpu' });
  const recordIds = ['browser-build', 'browser-api', 'pasta'];
  const result = await runner.run({
    task: 'relateTabs',
    schemaVersion: 1,
    input: [
      { recordId: recordIds[0], title: 'Browser extension build', url: 'https://example.test/browser-extension' },
      { recordId: recordIds[1], title: 'WebExtension API integration', url: 'https://example.test/browser-extension-api' },
      { recordId: recordIds[2], title: 'Pasta recipe with tomatoes', url: 'https://example.test/recipes/pasta' },
    ],
    recordIds,
    revisions: [1, 1, 1],
    modelId: 'local-unavailable',
    modelVersion: 'none',
    artifactChecksum: 'none',
    strategyVersion: 'metadata-v1',
    timeBudgetMs: 1500,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.metadata.modelId).toBe('Xenova/all-MiniLM-L6-v2');
  const groups = result.output as { groups: Array<{ recordIds: string[] }> };
  expect(groups.groups.flatMap((group) => group.recordIds).sort()).toEqual(recordIds.sort());
});
