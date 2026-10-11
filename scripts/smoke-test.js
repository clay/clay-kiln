'use strict';

/**
 * Smoke-test the built dist/ bundles the way sites load them, so a bundling
 * regression fails here instead of in a newsroom's edit mode.
 *
 *   npm run test:dist      (runs after `npm run build`; publishing runs both)
 *
 * For each bundle it builds a page with kiln's template.handlebars scaffolding,
 * loads the bundle as a classic script (view-public is inlined, as the template
 * does), registers site-style extensions after kiln's script and before
 * DOMContentLoaded (when sites' kiln plugins register theirs), then checks:
 * - no error is thrown while the bundle loads or at DOMContentLoaded
 * - built-in inputs/validators and the site-registered ones are all there
 * - site toolbar buttons, modals, nav buttons/content and selector buttons
 *   reach the components that merge them in
 * - site plugins are called with kiln's store
 * - shift+C-L-A-Y on a public page shows the Clay logo
 * plus static guards for problems found during the webpack -> Vite migration.
 *
 * No network: fetch is stubbed, so kiln's preload requests fail. That's
 * expected; only thrown errors fail the test.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole, requestInterceptor } = require('jsdom');
const htmlTags = require('html-tags');

const root = path.resolve(__dirname, '..');
// DIST=<dir> runs the same checks against another build (e.g. a webpack one)
const dist = path.resolve(process.env.DIST || path.join(root, 'dist'));
const ORIGIN = 'http://kiln.test';
const failures = [];

// view-public.js and .css are inlined into every page sites render with kiln's
// template, so they have to stay small. webpack's build was ~27KB.
const VIEW_PUBLIC_JS_BUDGET = 32 * 1024;

/**
 * Record a failed check.
 * @param {string} bundle which bundle
 * @param {string} message what went wrong
 */
function fail(bundle, message) {
  failures.push(`${bundle}: ${message}`);
}

/**
 * Assert a condition for a bundle.
 * @param {string} bundle which bundle
 * @param {boolean} ok condition
 * @param {string} message failure message
 */
function check(bundle, ok, message) {
  if (!ok) {
    fail(bundle, message);
  }
}

/**
 * Read a built file.
 * @param {string} name file name in dist/
 * @returns {string}
 */
function distFile(name) {
  return fs.readFileSync(path.join(dist, name), 'utf8');
}

// --- page scaffolding -------------------------------------------------------

const site = { slug: 'smoke', host: 'kiln.test', path: '', prefix: 'kiln.test', name: 'Smoke', protocol: 'http', assetPath: '' };
const user = { username: 'smoke@kiln.test', auth: 'admin', provider: 'google', name: 'Smoke Test' };
const pageUri = 'kiln.test/_pages/smoke';
const layoutUri = 'kiln.test/_layouts/smoke';
const componentUri = 'kiln.test/_components/smoke/instances/a';

// the template's `stringify` helper escapes `</script>` the same way
const stringify = obj => JSON.stringify(obj).replace(/<\/script>/g, '<"+"/script>');

// installed before kiln: record thrown errors, stub fetch (kiln's rest.js binds
// window.fetch when it loads), and fill in browser APIs jsdom lacks
const HARNESS = `<script>
  window.__smoke = { errors: [], requests: [], pluginStore: null };
  document.execCommand = document.execCommand || function () { return false; };
  window.addEventListener('error', function (e) {
    window.__smoke.errors.push(String((e.error && e.error.stack) || e.message));
  });
  window.fetch = function (url) {
    window.__smoke.requests.push(String(url));
    return Promise.resolve({
      ok: false, status: 404, statusText: 'Not Found', url: String(url),
      headers: { get: function () { return null; } },
      json: function () { return Promise.resolve({}); },
      text: function () { return Promise.resolve(''); }
    });
  };
</script>`;

// what sites' kiln plugins do: register into window.kiln after kiln's script ran,
// before DOMContentLoaded
const SITE_EXTENSIONS = `
  (function () {
    function component(name) {
      return { name: name, render: function (h) { return h('span', { 'class': 'smoke-' + name }, name); } };
    }
    var kiln = window.kiln;

    kiln.toolbarButtons['smoke-toolbar-button'] = component('smoke-toolbar-button');
    kiln.selectorButtons['smoke-selector-button'] = component('smoke-selector-button');
    kiln.modals = kiln.modals || {};
    kiln.modals['smoke-modal'] = component('smoke-modal');
    kiln.navButtons = kiln.navButtons || {};
    kiln.navButtons['smoke-nav-button'] = component('smoke-nav-button');
    kiln.navContent = kiln.navContent || {};
    kiln.navContent['smoke-nav-content'] = component('smoke-nav-content');
    kiln.inputs['smoke-input'] = component('smoke-input');
    kiln.validators['smoke-validator'] = { label: 'Smoke', description: 'smoke', type: 'warning', validate: function () { return []; } };
    kiln.plugins = kiln.plugins || {};
    kiln.plugins['smoke-plugin'] = function (store) { window.__smoke.pluginStore = store; };
  }());
`;

/**
 * Edit-mode page, mirroring template.handlebars.
 * @returns {string}
 */
function editPage() {
  const locals = { site, user, edit: 'true', url: `${ORIGIN}/smoke.html?edit=true`, query: { edit: 'true' } };
  const data = {
    _self: pageUri,
    _layoutData: { uri: layoutUri, name: 'smoke-layout' },
    main: [{ _ref: componentUri, title: 'Hello' }],
    locals
  };

  return `<!DOCTYPE html><html data-uri="${pageUri}" data-layout-uri="${layoutUri}"><head>${HARNESS}</head><body>
    <main data-editable="main"><div data-uri="${componentUri}"><h1 data-editable="title">Hello</h1></div></main>
    <div data-uri="kiln.test/_components/clay-kiln/instances/edit" class="clay-kiln">
      <script>
        window.kiln = window.kiln || {};
        // sites provide component models either here or (legacy pipeline) on window.modules
        window.modules = window.modules || {};
        window.kiln.componentModels = { smoke: { render: function (uri, data) { return data; } } };
        window.kiln.componentTemplates = window.kiln.componentTemplates || {};
        window.kiln.preloadSchemas = { smoke: { title: { _label: 'Title', _has: 'text' } } };
        window.kiln.layout = ${stringify(data._layoutData)};
        window.kiln.layout.schema = {};
        window.kiln.preloadData = ${stringify(data)};
        window.kiln.locals = ${stringify(locals)};
        window.process = window.process || {};
        window.process.env = {};
      </script>
      <div id="kiln-app"></div>
      <script src="${ORIGIN}/dist/clay-kiln-edit.js"></script>
    </div>
    <script>${SITE_EXTENSIONS}</script>
  </body></html>`;
}

/**
 * Logged-in view-mode page, mirroring template.handlebars.
 * @returns {string}
 */
function viewPage() {
  return `<!DOCTYPE html><html data-uri="${pageUri}"><head>${HARNESS}</head><body>
    <div data-uri="kiln.test/_components/clay-kiln/instances/view" class="clay-kiln">
      <script>
        window.kiln = window.kiln || {};
        window.kiln.preloadSite = ${stringify(site)};
        window.kiln.preloadUser = ${stringify(user)};
      </script>
      <div id="kiln-app"></div>
      <script src="${ORIGIN}/dist/clay-kiln-view.js"></script>
      <div class="clay-kiln-logo"></div>
    </div>
    <script>${SITE_EXTENSIONS.replace(/kiln\.(inputs|validators)\[[^\n]*\n/g, '')}</script>
  </body></html>`;
}

/**
 * Public page: view-public.js and .css inlined, exactly as the template does.
 * @returns {string}
 */
function publicPage() {
  return `<!DOCTYPE html><html><head>${HARNESS}</head><body>
    <style>${distFile('clay-kiln-view-public.css')}</style>
    <div class="clay-kiln-logo"></div>
    <script>${distFile('clay-kiln-view-public.js')}</script>
  </body></html>`;
}

// --- running pages -----------------------------------------------------------

/**
 * Serve dist/ files to jsdom; nothing ever reaches the network.
 */
const serveDist = requestInterceptor((request) => {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith('/dist/')) {
    return new Response(fs.readFileSync(path.join(dist, path.basename(pathname))), {
      headers: { 'Content-Type': pathname.endsWith('.css') ? 'text/css' : 'application/javascript' }
    });
  }

  return new Response('', { status: 404 });
});

/**
 * Load a page in jsdom and wait until it has settled after `load`.
 * @param {string} html page markup
 * @returns {Promise<object>} the jsdom window plus collected console errors
 */
function run(html) {
  const consoleErrors = [];
  const virtualConsole = new VirtualConsole();

  virtualConsole.on('jsdomError', err => consoleErrors.push(err.message));

  const dom = new JSDOM(html, {
    url: `${ORIGIN}/smoke.html`,
    runScripts: 'dangerously',
    resources: { interceptors: [serveDist] },
    pretendToBeVisual: true,
    virtualConsole
  });

  return new Promise((resolve) => {
    dom.window.addEventListener('load', () => setTimeout(() => resolve({ window: dom.window, consoleErrors }), 300));
  });
}

/**
 * Keys of a Vue component definition's `components` option (definitions may be
 * plain option objects or constructors).
 * @param {object|function} definition
 * @returns {string[]}
 */
function componentKeys(definition) {
  const options = typeof definition === 'function' ? definition.options : definition;

  return options && options.components ? Object.keys(options.components) : [];
}

/**
 * Errors thrown while the page loaded, including jsdom-reported script errors
 * (but not jsdom's "not implemented" notices).
 * @param {object} result from run()
 * @returns {string[]}
 */
function thrown(result) {
  return result.window.__smoke.errors.concat(result.consoleErrors.filter(m => !/Not implemented/.test(m)));
}

async function testEdit() {
  const bundle = 'clay-kiln-edit.js';
  const result = await run(editPage());
  const { window } = result;
  const kiln = window.kiln;
  const errors = thrown(result);

  check(bundle, !errors.length, `threw while loading:\n    ${errors.join('\n    ')}`);
  check(bundle, kiln && kiln.utils && typeof kiln.utils === 'object', 'window.kiln.utils was not set');

  const expectedInputs = fs.readdirSync(path.join(root, 'inputs'))
    .filter(f => f.endsWith('.vue'))
    .map(f => f.replace(/\.vue$/, ''))
    .map(name => (htmlTags.includes(name) || name === 'text' ? `input-${name}` : name));
  const missingInputs = expectedInputs.concat('smoke-input').filter(name => !(kiln.inputs || {})[name]);

  check(bundle, !missingInputs.length, `inputs missing from window.kiln.inputs: ${missingInputs.join(', ')}`);

  const expectedValidators = fs.readdirSync(path.join(root, 'lib/validators/built-in'))
    .filter(f => f.endsWith('.js') && !f.endsWith('.test.js'))
    .map(f => f.replace(/\.js$/, ''));
  const missingValidators = expectedValidators.concat('smoke-validator').filter(name => !(kiln.validators || {})[name]);

  check(bundle, !missingValidators.length, `validators missing from window.kiln.validators: ${missingValidators.join(', ')}`);
  check(bundle, window.__smoke.pluginStore && typeof window.__smoke.pluginStore.dispatch === 'function', 'site plugin was not called with the store');

  const wrapper = window.document.querySelector('.kiln-wrapper');
  const Vue = wrapper && wrapper.__vue__ && wrapper.__vue__.constructor;

  check(bundle, !!wrapper, 'the edit toolbar did not mount (.kiln-wrapper missing)');
  if (!Vue) {
    return;
  }

  const kilnVue = require(path.join(root, 'node_modules/vue/package.json')).version;

  check(bundle, Vue.version === kilnVue, `bundled Vue is ${Vue.version}, expected kiln's vue ${kilnVue}`);

  const toolbar = Vue.options.components['edit-toolbar'];
  const toolbarParts = (toolbar && toolbar.options.components) || {};
  const expectations = [
    ['edit toolbar', toolbar, 'smoke-toolbar-button'],
    ['simple-modal', toolbarParts['simple-modal'], 'smoke-modal'],
    ['nav-menu', toolbarParts['nav-menu'], 'smoke-nav-button'],
    ['nav-content', toolbarParts['nav-content'], 'smoke-nav-content'],
    ['overlay form', toolbarParts.overlay, 'smoke-selector-button']
  ];

  expectations.forEach(([label, definition, name]) => {
    check(bundle, componentKeys(definition).includes(name), `site-registered "${name}" is missing from the ${label}'s components`);
  });
}

async function testView() {
  const bundle = 'clay-kiln-view.js';
  const result = await run(viewPage());
  const errors = thrown(result);

  check(bundle, !errors.length, `threw while loading:\n    ${errors.join('\n    ')}`);
  check(bundle, !!result.window.document.querySelector('.kiln-wrapper'), 'the view toolbar did not mount (.kiln-wrapper missing)');
}

async function testViewPublic() {
  const bundle = 'clay-kiln-view-public.js';
  const result = await run(publicPage());
  const { window } = result;
  const errors = thrown(result);

  check(bundle, !errors.length, `threw while loading:\n    ${errors.join('\n    ')}`);

  ['c', 'l', 'a', 'y'].forEach((key) => {
    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: key.toUpperCase(), keyCode: key.toUpperCase().charCodeAt(0), which: key.toUpperCase().charCodeAt(0), shiftKey: true, bubbles: true }));
  });
  check(bundle, window.document.querySelector('.clay-kiln-logo').classList.contains('show'), 'shift+C-L-A-Y did not show the Clay logo');
}

/**
 * Checks on the built files themselves, for problems found while moving off
 * webpack that a page load alone might not catch.
 */
function staticChecks() {
  ['edit', 'view', 'view-public'].forEach((entry) => {
    const bundle = `clay-kiln-${entry}.js`;
    const js = distFile(bundle);

    // webpack ran CommonJS dependencies in sloppy mode and some rely on it
    check(bundle, !/^\s*(\(function\s*\(\)\s*\{\s*)?["']use strict["']/.test(js.slice(0, 200)), 'bundle starts with "use strict" (see output.strict in scripts/build.js)');
    check(bundle, !js.includes('import.meta'), 'bundle contains import.meta, which throws in a classic script');
  });

  const publicJs = distFile('clay-kiln-view-public.js');
  const publicCss = distFile('clay-kiln-view-public.css');

  check('clay-kiln-view-public.js', publicJs.length <= VIEW_PUBLIC_JS_BUDGET, `is ${publicJs.length} bytes, over the ${VIEW_PUBLIC_JS_BUDGET}-byte budget for code inlined into every public page`);
  check('clay-kiln-view-public.js', !/<\/script/i.test(publicJs), 'contains "</script", which would end the inline <script> it is rendered into');
  check('clay-kiln-view-public.css', !/<\/style/i.test(publicCss), 'contains "</style", which would end the inline <style> it is rendered into');

  // chrono-node needs moment's UMD build; a second (ESM) copy means module
  // resolution regressed (see resolve.mainFields in scripts/build.js)
  const momentVersion = require(path.join(root, 'node_modules/moment/package.json')).version;
  const momentCopies = (distFile('clay-kiln-edit.js').match(new RegExp(`(['"])${momentVersion.replace(/\./g, '\\.')}\\1`, 'g')) || []).length;

  check('clay-kiln-edit.js', momentCopies === 1, `moment ${momentVersion} is bundled ${momentCopies} times, expected once`);
}

async function main() {
  // promise rejections from kiln's (stubbed, failing) preload requests are
  // expected; don't let them crash the run
  process.on('unhandledRejection', () => {});

  staticChecks();
  await testViewPublic();
  await testView();
  await testEdit();

  if (failures.length) {
    console.error(`dist smoke test failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }

  console.log('dist smoke test passed (edit, view, view-public)');
  // Vue 2.5 opens a MessageChannel for nextTick that keeps Node alive
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
