#!/usr/bin/env node
/**
 * Pre-commit helper: build dist/ and stage it for the commit.
 *
 * Webpack 3 hangs on Node 17+. When a developer is on an incompatible Node
 * version, we skip the build and print a warning instead of hanging. The
 * GitHub Actions "Build and commit dist" workflow (running Node 14) acts as
 * the safety net and will rebuild + push the dist automatically after the
 * push lands.
 *
 * Remove this wrapper once clay-kiln is migrated to Vite (roadmap Phase 6.15),
 * at which point `build:dist` can go back to a simple inline command.
 */

'use strict';

const { execSync, spawnSync } = require('child_process');

const [major] = process.versions.node.split('.').map(Number);

// Webpack 3 is known to hang on Node 17+
if (major >= 17) {
  console.warn(
    `\n⚠️  clay-kiln pre-commit: skipping dist build on Node ${process.version}.\n` +
    `   Webpack 3 is incompatible with Node 17+. The CI "Build and commit dist"\n` +
    `   workflow will rebuild dist/ after your push (or use Node 14 locally).\n`
  );
  process.exit(0);
}

console.log(`clay-kiln pre-commit: building dist on Node ${process.version}…`);

const build = spawnSync(
  'npm',
  ['run', 'build'],
  {
    stdio: 'inherit',
    env: { ...process.env, BABEL_ENV: 'build' },
    shell: true
  }
);

if (build.status !== 0) {
  console.error('clay-kiln pre-commit: dist build failed — aborting commit.');
  process.exit(build.status || 1);
}

try {
  execSync('git add -f dist/', { stdio: 'inherit' });
  console.log('clay-kiln pre-commit: dist/ staged successfully.');
} catch (err) {
  console.error('clay-kiln pre-commit: git add dist/ failed —', err.message);
  process.exit(1);
}
