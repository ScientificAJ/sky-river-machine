import { expect, test } from 'vitest';
import { BoundedAnalysisQueue } from '../src/analysis/queue';

test('analysis queue applies separate priority budgets and coalesces revisions', () => {
  const queue = new BoundedAnalysisQueue(1, 1);
  expect(queue.enqueue({ recordId: 'high-1', revision: 1, priority: 'high' })).toBe(true);
  expect(queue.enqueue({ recordId: 'high-2', revision: 1, priority: 'high' })).toBe(false);
  expect(queue.enqueue({ recordId: 'low-1', revision: 1, priority: 'low' })).toBe(true);
  expect(queue.enqueue({ recordId: 'high-1', revision: 2, priority: 'high' })).toBe(true);
  expect(queue.take()).toEqual({ recordId: 'high-1', revision: 2, priority: 'high' });
  expect(queue.take()).toEqual({ recordId: 'low-1', revision: 1, priority: 'low' });
});
