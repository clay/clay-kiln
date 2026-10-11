'use strict';

const fs = require('fs');
const path = require('path');

/**
 * The require.context() calls kiln's source makes. Kept as an explicit table on
 * purpose: a new or changed require.context() fails the build instead of
 * silently matching a different set of files.
 *
 * Each call is expanded into static imports of the matching files (in key
 * order), placed right after the module's own imports. That keeps webpack's
 * evaluation order: the context modules ran after everything the module
 * imported (an eager import.meta.glob would be hoisted above them, which runs
 * inputs/*.vue before the store exists and crashes on an import cycle).
 *
 * The calls stay in the source because kiln's Jest 23 / Babel 6 test setup
 * can't parse the alternatives (`import.meta`).
 */
const REQUIRE_CONTEXTS = [
  {
    // edit.js — every input component, registered by file name
    call: /require\.context\(\s*'\.\/inputs'\s*,\s*false\s*,\s*\/\\\.vue\$\/\s*\)/,
    dir: './inputs',
    recursive: false,
    filter: /\.vue$/
  },
  {
    // edit.js and view.js — side-effect import of every styleguide stylesheet
    call: /require\.context\(\s*'\.\/styleguide'\s*,\s*true\s*,\s*\/\^\.\*\\\.\(scss\|css\)\$\/\s*\)/,
    dir: './styleguide',
    recursive: true,
    filter: /^.*\.(scss|css)$/
  },
  {
    // lib/validators/index.js — built-in validators. Tests live in the same
    // folder; webpack bundled them without running them, but a static import
    // would execute them, so they're left out (init() skips them anyway).
    call: /require\.context\(\s*'\.\/built-in'\s*,\s*false\s*,\s*\/\.\*\\\.js\$\/\s*\)/,
    dir: './built-in',
    recursive: false,
    filter: /.*\.js$/,
    exclude: /\.test\.js$/
  }
];

// a top-level import statement (single- or multi-line, optionally followed by a
// `// comment`), used to find where the module's own imports end
const TOP_LEVEL_IMPORT = /^import\s[^;]*?['"][^'"]+['"]\s*;?[ \t]*(?:\/\/[^\n]*)?$/gm;

/**
 * List a require.context's keys the way webpack did: './relative/path' for every
 * file under `dir` (recursively if asked) that matches `filter`, sorted.
 * @param {string} absDir absolute directory
 * @param {object} context entry from REQUIRE_CONTEXTS
 * @returns {string[]}
 */
function contextKeys(absDir, context) {
  const keys = [];

  (function walk(dir, prefix) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const key = `${prefix}/${entry.name}`;

      if (entry.isDirectory()) {
        if (context.recursive) {
          walk(path.join(dir, entry.name), key);
        }
      } else if (context.filter.test(key) && !(context.exclude && context.exclude.test(key))) {
        keys.push(key);
      }
    });
  }(absDir, '.'));

  return keys.sort();
}

// Runtime shim with webpack's require.context() shape: a function that takes a
// key like './checkbox.vue' and has a .keys() method listing every key.
const CONTEXT_RUNTIME = `
function __kilnRequireContext(byKey) {
  function req(key) {
    var mod = byKey[key];

    if (!mod) {
      throw new Error("Cannot find module '" + key + "'");
    }

    // vue-loader ran with esModule: false, so require.context handed back the
    // component object itself; everything else came back as its exports object
    return /\\.vue$/.test(key) ? mod.default : Object.assign({}, mod);
  }

  req.keys = function () {
    return Object.keys(byKey);
  };

  return req;
}
`;

/**
 * Webpack-only behaviours kiln's source depends on, reproduced for Vite:
 * - `__filename` (webpack `node.__filename: true`): the module's path relative
 *   to the project root. clay-log uses it to label every log line.
 * - `require.context()`: see REQUIRE_CONTEXTS.
 * - `import x from './icon.svg'` (webpack raw-loader): the SVG markup as a string.
 * @param {object} options
 * @param {string} options.root project root
 * @returns {object[]} vite plugins
 */
function webpackCompat({ root }) {
  const isProjectSource = id => !id.includes('\0') && !id.includes('?') && id.startsWith(root) && !id.includes(`${path.sep}node_modules${path.sep}`);

  return [{
    name: 'kiln-webpack-filename',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('\0') || id.includes('?') || !/\.(js|vue)$/.test(id) || !code.includes('__filename')) {
        return null;
      }

      const relative = JSON.stringify(path.relative(root, id));

      // free identifier only: skip `obj.__filename` and `__filename_x`
      return { code: code.replace(/(?<![\w$.])__filename(?![\w$])/g, relative), map: null };
    }
  }, {
    name: 'kiln-webpack-require-context',
    enforce: 'pre',
    transform(code, id) {
      if (!isProjectSource(id) || !code.includes('require.context')) {
        return null;
      }

      const imports = [];
      let out = code;
      let firstCall = -1;

      REQUIRE_CONTEXTS.forEach((context) => {
        out = out.replace(new RegExp(context.call.source, 'g'), (match, offset) => {
          const absDir = path.resolve(path.dirname(id), context.dir);
          const n = imports.length;
          const entries = contextKeys(absDir, context).map((key, i) => {
            const local = `__kilnCtx${n}_${i}`;

            imports.push(`import * as ${local} from ${JSON.stringify(context.dir + key.slice(1))};`);

            return `${JSON.stringify(key)}: ${local}`;
          });

          this.addWatchFile(absDir);
          firstCall = firstCall === -1 ? offset : Math.min(firstCall, offset);

          return `__kilnRequireContext({ ${entries.join(', ')} })`;
        });
      });

      if (out.includes('require.context')) {
        this.error(`${path.relative(root, id)}: unrecognised require.context() call; add it to REQUIRE_CONTEXTS in scripts/vite/webpack-compat.js`);
      }

      // insert the generated imports right after the last import statement that
      // comes before the first require.context() call
      let insertAt = 0;

      for (const match of out.matchAll(TOP_LEVEL_IMPORT)) {
        if (firstCall !== -1 && match.index > firstCall) {
          break;
        }
        insertAt = match.index + match[0].length;
      }

      out = `${out.slice(0, insertAt)}\n${imports.join('\n')}\n${out.slice(insertAt)}\n${CONTEXT_RUNTIME}`;

      return { code: out, map: null };
    }
  }, {
    name: 'kiln-webpack-raw-svg',
    enforce: 'pre',
    load(id) {
      if (!isProjectSource(id) || !id.endsWith('.svg')) {
        return null;
      }

      return `export default ${JSON.stringify(fs.readFileSync(id, 'utf8'))};`;
    }
  }];
}

/**
 * Cherry-pick lodash the way the webpack build did (babel-plugin-lodash), so
 * `import _ from 'lodash'` + `_.get(...)` bundles only the lodash functions
 * actually used instead of all of lodash. This matters most for
 * clay-kiln-view-public.js, which sites inline into every public page.
 *
 * Only this one Babel plugin runs; Vite/esbuild handles everything else. Applied
 * to the same files webpack's babel-loader covered: kiln's own source plus the
 * few node_modules it transpiled (keen-ui, clayutils, striptags).
 * @param {object} options
 * @param {string} options.root project root
 * @returns {object} vite plugin
 */
function lodashCherryPick({ root }) {
  const babel = require('@babel/core');
  const lodashPlugin = require.resolve('babel-plugin-lodash');
  const TRANSPILED_DEPS = /[\\/]node_modules[\\/](keen-ui|clayutils|striptags)[\\/]/;

  return {
    name: 'kiln-lodash-cherry-pick',
    async transform(code, id) {
      if (id.includes('\0') || id.includes('?') || !/\.(js|vue)$/.test(id) || !id.startsWith(root)) {
        return null;
      }
      if (id.includes(`${path.sep}node_modules${path.sep}`) && !TRANSPILED_DEPS.test(id)) {
        return null;
      }
      if (!/from\s+['"]lodash['"]/.test(code)) {
        return null;
      }

      const result = await babel.transformAsync(code, {
        babelrc: false,
        configFile: false,
        filename: id,
        sourceType: 'module',
        retainLines: true,
        // babel-plugin-lodash resolves `lodash` from its cwd option; pin it to the
        // project so building from another directory still cherry-picks
        plugins: [[lodashPlugin, { cwd: root }]]
      });

      return { code: result.code, map: null };
    }
  };
}

module.exports = webpackCompat;
module.exports.lodashCherryPick = lodashCherryPick;
