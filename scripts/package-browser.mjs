import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const target = process.argv[2];
if (target !== 'chromium' && target !== 'firefox') throw new Error('Usage: node scripts/package-browser.mjs <chromium|firefox>');

const output = resolve('dist', target);
const extension = target === 'firefox' ? 'xpi' : 'zip';
const archive = resolve(`dist/sky-river-machine-${target}.${extension}`);
await mkdir(resolve('dist'), { recursive: true });
await rm(archive, { force: true });
const result = spawnSync('zip', ['-qr9', archive, '.'], { cwd: output, stdio: 'inherit' });
if (result.status !== 0) throw new Error(`Could not create ${archive}`);
console.log(`Created ${archive}`);
