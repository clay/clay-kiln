'use strict';

const path = require('path');
const kilnVue2 = require('./kiln-vue2');

const root = path.resolve(__dirname, '../..');
const plugin = kilnVue2({ root, isProduction: false });
const context = {
  error(message) {
    throw new Error(message);
  },
  warn() {}
};

/**
 * Run a .vue source through the plugin.
 * @param {string} source .vue file contents
 * @returns {string} the module code the bundler gets
 */
function transform(source) {
  return plugin.transform.call(context, source, path.join(root, 'lib/example.vue')).code;
}

/**
 * The line a marker is on, counting from 1.
 * @param {string} text file contents
 * @param {string} marker text to find
 * @returns {number}
 */
function lineOf(text, marker) {
  return text.slice(0, text.indexOf(marker)).split('\n').length;
}

describe('kiln-vue2 transform', () => {
  const template = '<template>\n  <div class="example">{{ label }}</div>\n</template>\n';
  const script = '\n<script>\n  const label = 1;\n\n  export default {\n    name: \'marker-script-line\'\n  };\n</script>\n';
  const style = (lang) => `\n<style lang="${lang}">\n  .example { color: red; }\n</style>\n`;

  // The transform returns no sourcemap, so the bundle's map assumes every line
  // of the module is where it was in the .vue file.
  test.each([
    ['no style blocks', template + script],
    ['one style block', template + script + style('sass')],
    ['two style blocks', template + style('scss') + script + style('sass')]
  ])('keeps the script on its original lines (%s)', (name, source) => {
    const code = transform(source);

    expect(lineOf(code, 'marker-script-line')).toBe(lineOf(source, 'marker-script-line'));
    expect(lineOf(code, 'const label')).toBe(lineOf(source, 'const label'));
  });

  test('still imports each style block', () => {
    const code = transform(template + script + style('sass') + style('scss'));

    expect(code).toMatch(/import ".*lib\/example\.vue\?vue&type=style&index=0&lang\.scss";/);
    expect(code).toMatch(/import ".*lib\/example\.vue\?vue&type=style&index=1&lang\.scss";/);
  });
});
