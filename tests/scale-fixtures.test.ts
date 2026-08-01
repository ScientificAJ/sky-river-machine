import { expect, test } from 'vitest';
import { syntheticRecords } from '../src/core/fixtures';
import { searchMetadata } from '../src/core/search';

test.each([12, 100, 1000, 10000])('synthetic fixture stays deterministic and searchable at %i records', (count) => {
  const records = syntheticRecords(count);
  expect(records).toHaveLength(count);
  expect(new Set(records.map((record) => record.recordId)).size).toBe(count);
  expect(searchMetadata(records, [], `fictional tab ${count - 1}`)).toHaveLength(1);
});
