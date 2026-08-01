import type { TabRecord } from '../shared/types';
import { tokenize } from './normalize';

export function overlap(left: string[], right: string[]): number {
  const b = new Set(right);
  const shared = left.filter((token) => b.has(token)).length;
  return shared / Math.max(1, new Set([...left, ...right]).size);
}

export function duplicateScore(left: TabRecord, right: TabRecord): number {
  if (left.url === right.url) return 1;
  const titleOverlap = overlap(tokenize(left.title), tokenize(right.title));
  if (left.domain !== right.domain) return titleOverlap * 0.5;
  return titleOverlap;
}

export function relatedScore(left: TabRecord, right: TabRecord): number {
  const titleScore = overlap(tokenize(left.title), tokenize(right.title));
  const pathScore = left.url.split('/').slice(0, 4).join('/') === right.url.split('/').slice(0, 4).join('/') ? 0.25 : 0;
  return Math.min(1, titleScore * 0.75 + pathScore);
}
