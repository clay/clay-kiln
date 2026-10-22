'use strict';

/**
 * Babel is only used by the Jest tests. The Vite build compiles kiln with
 * Oxc and runs Babel for one plugin with `configFile: false`
 * (scripts/vite/webpack-compat.js), so it never reads this file.
 *
 * This is a project-wide config (not .babelrc) on purpose: Jest also
 * transforms keen-ui's .vue sources from node_modules (see
 * transformIgnorePatterns), and file-relative .babelrc configs don't apply
 * to other packages.
 *
 * @param {object} api Babel config API
 * @returns {object} config
 */
module.exports = function (api) {
  const isTest = api.env('test');

  api.cache.using(() => isTest);

  if (!isTest) {
    return {};
  }

  return {
    presets: [
      // tests run in Node; compile ESM to CommonJS so jest.mock() hoisting works
      ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]
    ]
  };
};
