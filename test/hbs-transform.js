/**
 * Jest transform for Handlebars templates.
 *
 * clayhandlebars registers its partials with `require('<partial>.hbs')` and
 * expects the template source back as a string, which is what kiln's bundler
 * provides (a raw import). Jest would otherwise try to run the .hbs file as
 * JavaScript and fail on the first `{{#each}}`.
 */
module.exports = {
  /**
   * @param {string} src template source
   * @returns {object} CommonJS module exporting the source string
   */
  process(src) {
    return { code: `module.exports = ${JSON.stringify(src)};` };
  }
};
