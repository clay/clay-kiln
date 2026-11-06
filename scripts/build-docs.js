'use strict';

/**
 * Regenerate docs/inputs.md from the <docs> blocks in inputs/*.vue.
 *
 * The webpack build did this as a side effect (vue-loader + ExtractTextPlugin),
 * concatenating blocks in module order: inputs in require.context key order,
 * with an input's own imports (e.g. inline.vue -> wysiwyg.vue) emitted before it.
 * This reproduces that order so the generated file stays byte-identical.
 */

const fs = require('fs');
const path = require('path');
// same parser vue-loader 13 used, so block contents are de-indented identically
const { parseComponent } = require('vue-template-compiler');

const IMPORT = /^\s*import\s+(?:[^'"]+\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/gm;

/**
 * Relative imports from a .vue file's <script> block that point at other inputs.
 * @param {string} file absolute path of an input .vue file
 * @param {string} inputsDir absolute path of inputs/
 * @returns {string[]} absolute paths of imported input .vue files, in source order
 */
function inputImports(file, inputsDir) {
  const source = fs.readFileSync(file, 'utf8');
  const script = (source.match(/<script[^>]*>([\s\S]*?)<\/script>/) || [])[1] || '';
  const found = [];

  for (const match of script.matchAll(IMPORT)) {
    const base = path.resolve(path.dirname(file), match[1]);
    const candidate = base.endsWith('.vue') ? base : `${base}.vue`;

    if (path.dirname(candidate) === inputsDir && fs.existsSync(candidate)) {
      found.push(candidate);
    }
  }

  return found;
}

/**
 * Write docs/inputs.md.
 * @param {object} options
 * @param {string} options.root project root
 * @returns {string} the generated markdown
 */
function buildDocs({ root }) {
  const inputsDir = path.join(root, 'inputs');
  const files = fs.readdirSync(inputsDir).filter(f => f.endsWith('.vue')).sort().map(f => path.join(inputsDir, f));
  const visited = new Set();
  const blocks = [];

  /**
   * Post-order walk: an input's imported inputs are emitted before the input.
   * @param {string} file absolute path
   */
  function visit(file) {
    if (visited.has(file)) {
      return;
    }
    visited.add(file);
    inputImports(file, inputsDir).forEach(visit);

    parseComponent(fs.readFileSync(file, 'utf8')).customBlocks
      .filter(block => block.type === 'docs')
      .forEach(block => blocks.push(block.content));
  }

  files.forEach(visit);

  const markdown = blocks.join('');

  fs.writeFileSync(path.join(root, 'docs', 'inputs.md'), markdown);

  return markdown;
}

module.exports = buildDocs;

if (require.main === module) {
  buildDocs({ root: path.resolve(__dirname, '..') });
  // vue-template-compiler loads Vue 2.5 to check versions, and Vue opens a
  // MessageChannel for nextTick that keeps Node (15+) running forever
  process.exit(0);
}
