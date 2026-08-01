import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const forbidden = [/fetch\s*\(/, /XMLHttpRequest/, /host_permissions/, /content_scripts/];
const inferenceRuntime = /[\\/]assets[\\/](?:transformers\.web|ort-wasm)/;

async function files(root) {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]))).flat();
}

for (const target of ['chromium', 'firefox']) {
  const root = resolve('dist', target);
  const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.permissions) || !manifest.permissions.includes('tabs')) throw new Error(`${target}: missing tabs permission`);
  if (manifest.host_permissions || manifest.content_scripts) throw new Error(`${target}: broad access found`);
  for (const file of await files(root)) {
    const source = await readFile(file, 'utf8');
    for (const pattern of forbidden) {
      if (inferenceRuntime.test(file) && (pattern === forbidden[0] || pattern === forbidden[1])) continue;
      if (pattern.test(source)) throw new Error(`${target}: forbidden artifact pattern ${pattern} in ${file}`);
    }
    if (file.endsWith('/background.js') && !source.includes('allowRemoteModels=!1')) throw new Error(`${target}: background does not disable remote model loading`);
  }
}
console.log('build audit: manifests and bundled artifacts pass local-only safety checks');
