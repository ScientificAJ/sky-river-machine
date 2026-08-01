import { describe, expect, test } from 'vitest';
import { clusterEmbeddings, cosineSimilarity } from '../src/analysis/embeddings';

describe('embedding grouping', () => {
  test('calculates cosine similarity without dividing by zero', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
  });

  test('keeps semantically separated vectors in separate groups', () => {
    expect(clusterEmbeddings([[1, 0], [0.99, 0.01], [0, 1], [0.01, 0.99]], 0.8)).toEqual([[0, 1], [2, 3]]);
  });

  test('does not create an empty or duplicate record assignment', () => {
    const groups = clusterEmbeddings([[1, 0], [], [0, 1]], 0.8);
    expect(groups.flat()).toEqual([0, 1, 2]);
    expect(new Set(groups.flat()).size).toBe(3);
  });
});
