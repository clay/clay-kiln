'use strict';

/**
 * Build kiln's browser bundles with Vite (replaces webpack 3, which hangs on
 * Node 17+ and pinned kiln to Node 12/14).
 *
 * Output contract — sites (via claycli) copies these files and loads them as
 * classic <script>/<link> tags, so they must not change shape:
 *   dist/clay-kiln-edit.js         dist/clay-kiln-edit.css
 *   dist/clay-kiln-view.js         dist/clay-kiln-view.css
 *   dist/clay-kiln-view-public.js  dist/clay-kiln-view-public.css
 * Each is a self-contained IIFE (no shared chunks, no ES modules, no globals
 * beyond what kiln itself sets on window).
 *
 *   node scripts/build.js           development build (unminified, Vue dev mode).
 *                                   This is what kiln 10.2.3 actually shipped, so
 *                                   it's the default for publishing too.
 *   node scripts/build.js --prod    minified, NODE_ENV=production (Vue prod mode)
 *   node scripts/build.js --watch   rebuild on change
 */

const path = require('path');
const kilnVue2 = require('./vite/kiln-vue2');
const webpackCompat = require('./vite/webpack-compat');
const buildDocs = require('./build-docs');
const { version } = require('../package.json');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const isProduction = args.includes('--prod');
const isWatch = args.includes('--watch');
const ENTRIES = ['edit', 'view', 'view-public'];

// Imports of names a module doesn't export. webpack 3 turned these into
// `undefined` without failing the build; Rollup errors. Known cases are shimmed
// to `undefined` so behaviour doesn't change; anything new fails the build.
//   CREATE_COMPONENTS: lib/validators/plugin.js lists it among the mutations
//   that re-run validation, but it was never exported, so creating components
//   has never triggered validation. Fixing it is a behaviour change, kept out
//   of the bundler migration on purpose.
const KNOWN_MISSING_EXPORTS = ['lib/component-data/mutationTypes.js:CREATE_COMPONENTS'];

// webpack's sass-loader `data` option prepended the Keen UI variables to every
// <style> block in .vue files (kiln's own `lang="sass"` blocks, which are really
// SCSS, and Keen UI's `lang="scss"` sources), but not to standalone .scss files.
// Same here.
const KEEN_VARIABLES = '@import "styleguide/keen-variables.scss";\n';

/**
 * Prepend the Keen UI variables to styles that come from .vue files.
 * @param {string} source stylesheet source
 * @param {string} filename file being compiled
 * @returns {string}
 */
function keenVariables(source, filename) {
  return filename.includes('.vue') ? KEEN_VARIABLES + source : source;
}

/**
 * Vite config for one entry.
 * @param {string} entry 'edit' | 'view' | 'view-public'
 * @param {object} nodePolyfills the vite-plugin-node-polyfills factory
 * @returns {object}
 */
function configFor(entry, nodePolyfills) {
  const sassOptions = {
    // libsass (node-sass) always searched the working directory, which is how
    // `@import "styleguide/keen-variables.scss"` resolved from any file
    includePaths: [root],
    // keep Keen UI's (third-party) deprecation warnings out of the build log
    quietDeps: true,
    // Dart Sass 2.0 deprecations (not behaviour changes in this sass version):
    // `/` division in Keen UI's sources, and declarations after nested rules in
    // kiln's mixins. Dropped from the log so real problems aren't buried (the
    // legacy sass API Vite 5 uses ignores `silenceDeprecations`); worth cleaning
    // up before ever moving to Sass 2.
    logger: {
      warn(message, options) {
        if (/slash-div|mixed-decls|declarations after nested rules|for division outside of calc|repetitive deprecation warnings omitted/i.test(message)) {
          return;
        }
        console.warn(typeof options.stack === 'string' ? `${message}\n${options.stack}` : message);
      }
    }
  };

  return {
    configFile: false,
    root,
    publicDir: false,
    logLevel: 'warn',
    mode: isProduction ? 'production' : 'development',
    define: {
      // webpack's DefinePlugin replaced the whole `process.env` object, so any
      // other key (including NODE_ENV outside --prod) read as undefined
      'process.env': JSON.stringify({ KILN_VERSION: version, LOG: 'trace' }),
      'process.env.NODE_ENV': isProduction ? '"production"' : 'undefined'
    },
    resolve: {
      // `import UiButton from 'keen/UiButton'` -> Keen UI's .vue sources
      alias: [
        { find: /^keen\//, replacement: `${path.join(root, 'node_modules/keen-ui/src')}/` },
        // sass-loader's `@import '~package/...'` (resolve from node_modules)
        { find: /^~(?=[\w@])/, replacement: '' }
      ],
      extensions: ['.mjs', '.js', '.json', '.vue'],
      // webpack 3's resolution order for web builds. Vite's default also tries
      // `jsnext:main`, which resolves moment to its ES source; chrono-node's
      // require('moment') then gets a namespace without .locale() and edit mode
      // crashes on load (and moment gets bundled twice).
      mainFields: ['browser', 'module', 'main']
    },
    css: {
      preprocessorOptions: {
        // every .vue style block is compiled as scss (see styleLang in kiln-vue2.js)
        scss: Object.assign({ additionalData: keenVariables }, sassOptions)
      }
      // postcss.config.js (autoprefixer) is picked up automatically
    },
    plugins: [
      kilnVue2({ root, isProduction }),
      // after kilnVue2, so it sees compiled .vue output too
      webpackCompat.lodashCherryPick({ root }),
      ...webpackCompat({ root }),
      // webpack 3 polyfilled Node built-ins for the browser automatically. These
      // are the ones kiln's dependencies pulled in under webpack (sanitize-html's
      // htmlparser2 stream, url/punycode, etc.).
      nodePolyfills({
        include: ['buffer', 'events', 'path', 'process', 'punycode', 'stream', 'string_decoder', 'timers', 'url', 'util'],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: false
      })
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      target: ['chrome87', 'edge88', 'firefox78', 'safari14'],
      minify: isProduction ? 'esbuild' : false,
      cssMinify: isProduction,
      // one CSS file per entry; with code splitting on, Vite would inline CSS
      // into IIFE bundles as a <style> injection instead of emitting the .css file
      cssCodeSplit: false,
      sourcemap: false,
      modulePreload: false,
      reportCompressedSize: false,
      copyPublicDir: false,
      commonjsOptions: {
        // a handful of older dependencies mix `import` and `module.exports`
        transformMixedEsModules: true,
        // 'auto' decides which CommonJS modules to wrap based on cycle detection
        // that varies between runs, so identical edit builds came out different.
        // Wrapping every required module (closer to webpack's lazy require)
        // makes the edit bundle reproducible for ~4% size. Not applied to the
        // smaller bundles, where it would grow view-public by ~40%.
        strictRequires: entry === 'edit' ? true : 'auto'
      },
      rollupOptions: {
        input: path.join(root, `${entry}.js`),
        // No tree-shaking for the editor bundles, like webpack's builds. Besides
        // matching what shipped, Rollup's tree-shaking drops function-level
        // "use strict" directives, and in non-strict code handlebars helpers
        // (clayhandlebars' compare/if/...) receive a boxed `this` (a String
        // object, not a string), which changes client-side re-renders.
        // view-public keeps tree-shaking: it's inlined into public pages and has
        // no such code.
        treeshake: entry === 'view-public',
        shimMissingExports: true,
        onwarn(warning, warn) {
          if (warning.code === 'SHIMMED_EXPORT') {
            const key = `${path.relative(root, warning.exporter)}:${warning.binding}`;

            if (KNOWN_MISSING_EXPORTS.includes(key)) {
              return;
            }
            throw new Error(`${key} is imported but not exported (${warning.message})`);
          }
          warn(warning);
        },
        output: {
          format: 'iife',
          // webpack ran CommonJS dependencies in sloppy mode; several rely on it
          // (caret-position and handlebars use top-level `this`, comma-it assigns
          // undeclared variables). A single IIFE can't mix modes, so no
          // "use strict" for the bundle. kiln's own ES modules don't depend on it.
          strict: false,
          // keep `import * as ns` namespace objects (e.g. the ones on
          // window.kiln.utils) plain and mutable like webpack's, not frozen
          freeze: false,
          inlineDynamicImports: true,
          entryFileNames: `clay-kiln-${entry}.js`,
          assetFileNames: info => (/\.css$/.test(info.name || '') ? `clay-kiln-${entry}.css` : 'media/[name][extname]')
        }
      },
      watch: isWatch ? {} : null
    }
  };
}

async function main() {
  const { build } = await import('vite');
  const { nodePolyfills } = await import('vite-plugin-node-polyfills');
  const started = Date.now();

  for (const entry of ENTRIES) {
    await build(configFor(entry, nodePolyfills));
    console.log(`built dist/clay-kiln-${entry}.{js,css}`);
  }

  buildDocs({ root });
  console.log(`kiln ${version} ${isProduction ? 'production' : 'development'} build done in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  if (!isWatch) {
    // vue-template-compiler loads Vue 2.5, whose nextTick MessageChannel keeps
    // Node (15+) alive after the build finishes
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
