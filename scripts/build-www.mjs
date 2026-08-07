// scripts/build-www.mjs
// Copies the static web app into `www/` — the folder Capacitor wraps into the
// native iOS/Android app. There is no bundler; this just mirrors the files.
// Usage: `npm run build`

import { cp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'www');

const ENTRIES = ['index.html', 'styles.css', 'src', 'assets'];

async function main() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  for (const entry of ENTRIES) {
    const from = join(root, entry);
    const to = join(out, entry);
    await cp(from, to, { recursive: true }).catch((err) => {
      if (err.code !== 'ENOENT') throw err; // assets/ may be empty — that's fine
    });
  }
  console.log('  ✅  Built static app into ./www');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
