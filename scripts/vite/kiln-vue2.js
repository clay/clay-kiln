'use strict';

const fs = require('fs');
const path = require('path');
const compilerUtils = require('@vue/component-compiler-utils');
// Always kiln's own compiler, so templates are compiled by the exact Vue 2.x
// version kiln bundles as its runtime (vue and vue-template-compiler must match).
const compiler = require('vue-template-compiler');

// <style> blocks become their own modules so Vite's normal CSS pipeline handles
// them (sass, postcss/autoprefixer, extraction into clay-kiln-<entry>.css).
// The `lang.<ext>` suffix is what Vite's CSS plugin keys on to pick sass vs scss.
const STYLE_QUERY = /\?vue&type=style&index=(\d+)&lang\.(\w+)$/;

/**
 * Compile Vue 2 single-file components the way webpack's vue-loader 13 did for
 * kiln, without changing what ships to sites:
 * - the component is the module's default export (vue-loader `esModule: false`
 *   gave CommonJS consumers the component object; ESM consumers get it as default)
 * - templates compile with vue-template-compiler defaults (whitespace preserved)
 *   and `with(this)` stripped, like vue-loader's buble pass
 * - <style> blocks are imported first, so the extracted CSS keeps vue-loader's
 *   "component's own styles before its children's" order
 * - custom blocks (<docs>) are dropped from the bundle; scripts/build-docs.js
 *   writes docs/inputs.md from them instead
 * @param {object} options
 * @param {string} options.root project root, used for relative `__file` paths
 * @param {boolean} options.isProduction production build (drops dev-only hints)
 * @returns {object} vite plugin
 */
function kilnVue2({ root, isProduction }) {
  const descriptors = new Map();

  /**
   * Parse (and cache) a .vue file's blocks.
   * @param {string} filename absolute path
   * @param {string} [source] file contents, read from disk when omitted
   * @returns {object} SFC descriptor
   */
  function getDescriptor(filename, source) {
    if (source === undefined && descriptors.has(filename)) {
      return descriptors.get(filename);
    }

    const descriptor = compilerUtils.parse({
      source: source === undefined ? fs.readFileSync(filename, 'utf8') : source,
      filename,
      compiler,
      needMap: false
    });

    descriptors.set(filename, descriptor);

    return descriptor;
  }

  return {
    name: 'kiln-vue2',

    resolveId(id) {
      // style sub-modules carry an absolute path already; keep the query intact
      return STYLE_QUERY.test(id) ? id : null;
    },

    load(id) {
      const match = id.match(STYLE_QUERY);

      if (!match) {
        return null;
      }

      const filename = id.slice(0, id.indexOf('?'));
      const style = getDescriptor(filename).styles[Number(match[1])];

      return style ? style.content : '';
    },

    transform(code, id) {
      if (!id.endsWith('.vue')) {
        return null;
      }

      const descriptor = getDescriptor(id, code);
      const relative = path.relative(root, id);
      const parts = [];
      let styleImports = '';

      descriptor.styles.forEach((style, index) => {
        if (style.scoped || style.module) {
          this.error(`${relative}: scoped/module styles are not supported by the kiln build`);
        }
        if (style.content.trim()) {
          styleImports += `import ${JSON.stringify(`${id}?vue&type=style&index=${index}&lang.${styleLang(style.lang)}`)};`;
        }
      });

      // The style imports share a line with the start of the script, which Vue's
      // parser pads with newlines so it keeps its line numbers from the .vue
      // file. Imports on lines of their own would shift every script line, and
      // with no sourcemap for this transform the bundle's map would point that
      // many lines off.
      parts.push(styleImports + normalizeScript(descriptor.script && descriptor.script.content));

      if (descriptor.template) {
        if (descriptor.template.attrs && descriptor.template.attrs.functional) {
          this.error(`${relative}: functional templates are not supported by the kiln build`);
        }

        const result = compilerUtils.compileTemplate({
          source: descriptor.template.content,
          filename: id,
          compiler,
          isProduction,
          isFunctional: false,
          // no template in kiln or keen-ui uses relative asset URLs; turning this off
          // guarantees no stray require() calls end up in render functions
          transformAssetUrls: false,
          prettify: false
        });

        result.tips.forEach(tip => this.warn(`${relative}: ${tip}`));
        if (result.errors.length) {
          this.error(`${relative}: template errors:\n${result.errors.join('\n')}`);
        }

        parts.push(result.code);
        parts.push('__sfc__.render = render;', '__sfc__.staticRenderFns = staticRenderFns;');
      }

      if (!isProduction) {
        // vue-loader set this in dev builds; Vue uses it to name components in warnings
        parts.push(`__sfc__.__file = ${JSON.stringify(relative)};`);
      }

      parts.push('export default __sfc__;');

      return { code: parts.join('\n'), map: null };
    }
  };
}

/**
 * Which stylesheet syntax a <style> block is compiled as.
 *
 * kiln's webpack config replaced vue-loader's `sass` loader with a plain
 * sass-loader that never set `indentedSyntax`, so kiln's `<style lang="sass">`
 * blocks have always been compiled as SCSS (they all use braces and semicolons).
 * Keep compiling them that way.
 * @param {string} [lang] the block's lang attribute
 * @returns {string} file extension Vite's CSS pipeline keys on
 */
function styleLang(lang) {
  if (!lang) {
    return 'css';
  }

  return lang === 'sass' ? 'scss' : lang;
}

/**
 * Turn the component's <script> into code that leaves the options object in
 * `__sfc__`, so the template's render functions can be attached to it.
 * @param {string} [script] <script> block contents
 * @returns {string}
 */
function normalizeScript(script) {
  if (!script || !script.trim()) {
    return 'const __sfc__ = {};';
  }

  if (/\bexport\s+default\b/.test(script)) {
    return script.replace(/\bexport\s+default\b/, 'const __sfc__ =');
  }

  if (/\bmodule\.exports\s*=/.test(script)) {
    return script.replace(/\bmodule\.exports\s*=/, 'const __sfc__ =');
  }

  // a script with no default export still yields an (empty) component
  return `${script}\nconst __sfc__ = {};`;
}

module.exports = kilnVue2;
