export function validateSuggestionOutput(output: unknown, allowedRecordIds: Set<string>): { ok: true; groups: Array<{ name: string; recordIds: string[]; confidence: number }> } | { ok: false; reason: string } {
  if (!output || typeof output !== 'object' || !Array.isArray((output as { groups?: unknown }).groups)) return { ok: false, reason: 'Expected a groups array.' };
  const groups = (output as { groups: unknown[] }).groups;
  if (groups.length > 32) return { ok: false, reason: 'Too many groups.' };
  const result: Array<{ name: string; recordIds: string[]; confidence: number }> = [];
  for (const group of groups) {
    if (!group || typeof group !== 'object') return { ok: false, reason: 'Malformed group.' };
    const value = group as { name?: unknown; recordIds?: unknown; confidence?: unknown };
    if (typeof value.name !== 'string' || value.name.length > 80 || !Array.isArray(value.recordIds) || typeof value.confidence !== 'number') return { ok: false, reason: 'Malformed group fields.' };
    const recordIds = value.recordIds.filter((id): id is string => typeof id === 'string');
    if (recordIds.length !== value.recordIds.length || recordIds.some((id) => !allowedRecordIds.has(id)) || value.confidence < 0 || value.confidence > 1) return { ok: false, reason: 'Group contains invalid records or confidence.' };
    result.push({ name: value.name.trim(), recordIds, confidence: value.confidence });
  }
  return { ok: true, groups: result };
}
