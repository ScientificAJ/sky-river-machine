const MAX_TITLE = 200;
const MAX_URL = 2048;

export function normalizeAnalysisText(value: string, max = MAX_TITLE): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function safeAnalysisInput(title: string, url: string): { title: string; url: string } {
  return { title: normalizeAnalysisText(title), url: normalizeAnalysisText(url, MAX_URL) };
}

export function tokenize(value: string): string[] {
  return normalizeAnalysisText(value, MAX_URL).toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1).slice(0, 64);
}
