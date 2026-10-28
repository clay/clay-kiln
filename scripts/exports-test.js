'use strict';

/**
 * Check the package the way a site installs it: pack it, unpack the tarball
 * into a node_modules folder, and resolve paths from a consumer next to it.
 *
 *   npm run test:dist      (runs after `npm run build`; publishing runs both)
 *
 * - every file in the tarball that a consumer is meant to reach is exported,
 *   and every "exports" target is in the tarball
 * - what consumers load today still resolves: claycli copies
 *   clay-kiln/dist/clay-kiln-{edit,view}.js, sites reads clay-kiln/package.json,
 *   and `require('clay-kiln')` is model.js
 * - a path that isn't exported throws, so the public surface is what's listed
 *
 * Needs `npm run build` first (dist/ is part of the tarball).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { createRequire } = require('module');

const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');
const failures = [];

/**
 * Record a failed check.
 * @param {boolean} ok condition
 * @param {string} message failure message
 */
function check(ok, message) {
  if (!ok) {
    failures.push(message);
  }
}

/**
 * Every file under a folder, as paths relative to it.
 * @param {string} dir folder
 * @param {string} [prefix] path of the folder being read, relative to the first
 * @returns {string[]}
 */
function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);

    return entry.isDirectory() ? listFiles(path.join(dir, entry.name), relative) : [relative];
  });
}

/**
 * Pack the package and unpack the tarball as <tmp>/node_modules/clay-kiln.
 * @param {string} tmp scratch folder
 * @returns {string} the unpacked package folder
 */
function install(tmp) {
  const output = execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', tmp], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  });
  const [{ filename }] = JSON.parse(output);
  const installed = path.join(tmp, 'node_modules', pkg.name);

  fs.mkdirSync(installed, { recursive: true });
  execFileSync('tar', ['-xzf', path.join(tmp, filename), '-C', installed, '--strip-components=1']);

  return installed;
}

/**
 * The paths a pattern like "./dist/*" covers in the unpacked package, as
 * specifiers a consumer would use.
 * @param {string} key "exports" key with a `*`
 * @param {string} installed unpacked package folder
 * @returns {string[]}
 */
function expand(key, installed) {
  const [before] = key.split('*');
  const folder = path.join(installed, before);

  return fs.existsSync(folder) ? listFiles(folder).map(file => `${pkg.name}/${before.slice(2)}${file}`) : [];
}

/**
 * Resolve a specifier from the consumer, returning the file or the error code.
 * @param {Function} consumerRequire require of a file next to the package
 * @param {string} specifier what the consumer asks for
 * @returns {{file: string|null, code: string|null}}
 */
function resolve(consumerRequire, specifier) {
  try {
    return { file: consumerRequire.resolve(specifier), code: null };
  } catch (e) {
    return { file: null, code: e.code };
  }
}

function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kiln-exports-'));

  try {
    const installed = install(tmp);
    const consumerRequire = createRequire(path.join(tmp, 'consumer', 'package.json'));
    const real = fs.realpathSync(installed);
    const exported = Object.keys(pkg.exports);

    // exported, and the file is there
    exported.forEach((key) => {
      const specifiers = key.includes('*') ? expand(key, installed) : [key === '.' ? pkg.name : `${pkg.name}/${key.slice(2)}`];

      check(specifiers.length > 0, `"${key}" matches no files in the package`);
      specifiers.forEach((specifier) => {
        const { file, code } = resolve(consumerRequire, specifier);

        check(file && fs.realpathSync(file).startsWith(real) && fs.existsSync(file), `${specifier} does not resolve to a file in the package (${code || 'outside it'})`);
      });
    });

    // what consumers load today
    [
      pkg.name,
      `${pkg.name}/package.json`,
      `${pkg.name}/dist/clay-kiln-edit.js`,
      `${pkg.name}/dist/clay-kiln-view.js`
    ].forEach((specifier) => {
      const { code } = resolve(consumerRequire, specifier);

      check(!code, `${specifier} is used by sites or claycli and does not resolve (${code})`);
    });

    // every entry in "files" is reachable, so adding one without exporting it fails here
    pkg.files.forEach((entry) => {
      const isFolder = fs.statSync(path.join(installed, entry)).isDirectory();

      check(exported.includes(isFolder ? `./${entry}/*` : `./${entry}`), `"files" lists ${entry}, which "exports" doesn't`);
    });

    // not exported: the file exists, but the package doesn't offer it
    ['README.md', 'LICENSE'].forEach((file) => {
      const { code } = resolve(consumerRequire, `${pkg.name}/${file}`);

      check(code === 'ERR_PACKAGE_PATH_NOT_EXPORTED', `${pkg.name}/${file} is not exported but resolves or fails differently (${code})`);
    });

    // loading the package gives kiln's model, with the version from package.json
    const model = consumerRequire(pkg.name);

    check(typeof model.render === 'function', `require('${pkg.name}') is not kiln's model.js`);
    check(model.render('kiln.test/_components/clay-kiln/instances/general', {}).kilnVersion === pkg.version, 'model.js does not report the package version');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (failures.length) {
    console.error(`package exports test failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }

  console.log('package exports test passed (packed, unpacked and resolved like a site installs it)');
}

main();
