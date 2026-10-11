module.exports = {
  plugins: [
    // autoprefixer 10 (PostCSS 8, which Vite bundles) renamed `browsers` to
    // `overrideBrowserslist`. Same target list as the old webpack build.
    require('autoprefixer')({ overrideBrowserslist: ['last 2 versions', 'ie >= 9', 'ios >= 7', 'android >= 4.4.2'] })
  ]
};
