// Quick diagnostic: does Next.js find our app dir?
import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

const cwd = process.cwd();
console.log('CWD:', cwd);

const candidates = [
  'app',
  'src/app',
  './app',
  './src/app',
];

for (const c of candidates) {
  const p = resolve(cwd, c);
  const exists = existsSync(p);
  console.log(`${c}: ${exists ? 'EXISTS' : 'missing'}`);
  if (exists) {
    const files = readdirSync(p);
    console.log('  files:', files.slice(0, 10));
    // Check for layout
    const layout = join(p, 'layout.tsx');
    console.log('  layout.tsx:', existsSync(layout) ? 'EXISTS' : 'MISSING');
  }
}

// Check next.config
const nc = resolve(cwd, 'next.config.js');
console.log('next.config.js:', existsSync(nc) ? 'EXISTS' : 'missing');

// Check package.json
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8'));
console.log('next version:', pkg.dependencies?.next);
