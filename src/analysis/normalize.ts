const MAX_TITLE = 200;
const MAX_URL = 2048;
const SENSITIVE_QUERY_KEYS = /^(token|secret|key|auth|code|password|passwd|session|signature|sig|credential)$/i;

export function normalizeAnalysisText(value: string, max = MAX_TITLE): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function safeAnalysisInput(title: string, url: string): { title: string; url: string } {
  let safeUrl = url;
  try {
    const parsed = new URL(url);
    parsed.username = '';
    parsed.password = '';
    parsed.hash = '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEYS.test(key)) parsed.searchParams.delete(key);
      else parsed.searchParams.set(key, '[redacted]');
    }
    safeUrl = parsed.toString();
  } catch {
    safeUrl = '';
  }
  return { title: normalizeAnalysisText(title), url: normalizeAnalysisText(safeUrl, MAX_URL) };
}

export function tokenize(value: string): string[] {
  return normalizeAnalysisText(value, MAX_URL).toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1).slice(0, 64);
}
