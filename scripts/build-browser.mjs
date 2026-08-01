import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const target = process.argv[2];
if (target !== 'chromium' && target !== 'firefox') {
  throw new Error('Usage: node scripts/build-browser.mjs <chromium|firefox>');
}

const result = spawnSync('npx', ['vite', 'build', '--mode', target], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);

const output = resolve('dist', target);
await cp(resolve(`manifests/${target}.json`), resolve(output, 'manifest.json'));
