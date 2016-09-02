var gulp = require('gulp'),
  gutil = require('gulp-util'),
  chalk = require('chalk'),
  concat = require('gulp-concat'),
  sass = require('gulp-sass'),
  sassImport = require('sass-import-modules').importer,
  gulpSassError  = require('gulp-sass-error').gulpSassError,
  autoprefix = require('gulp-autoprefixer'),
  cssmin = require('gulp-cssmin'),
  prefixOptions = { browsers: ['last 2 versions', 'ie >= 9', 'ios >= 7', 'android >= 4.4.2'] },
  stylesGlob = [
    'node_modules/codemirror/lib/codemirror.css',
    'node_modules/flatpickr/dist/flatpickr.min.css',
    'styleguide/*.scss',
    'styleguide/*.css',
    'behaviors/*.scss',
    'behaviors/*.css'
  ];

gulp.task('styles', function () {
  return gulp.src(stylesGlob)
    .pipe(sass({ importer: sassImport({ resolvers: ['local', 'partial', 'node']}) }).on('error', gulpSassError(true)))
    .pipe(concat('clay-kiln.css'))
    .pipe(autoprefix(prefixOptions))
    .pipe(cssmin())
    .pipe(gulp.dest('dist'));
});

// Error reporting function
function mapError(err) {
  if (err.fileName) {
    // Regular error
    gutil.log(chalk.red(err.name)
      + ': ' + chalk.yellow(err.fileName.replace(__dirname, ''))
      + ': ' + 'Line ' + chalk.magenta(err.lineNumber)
      + ' & ' + 'Column ' + chalk.magenta(err.columnNumber || err.column)
      + ': ' + chalk.blue(err.description));
  } else {
    // Browserify error..
    gutil.log(chalk.red(err.name)
      + ': '
      + chalk.yellow(err.message));
  }
}

// default task: run scripts and styles
gulp.task('default', ['styles']);

// recompile scripts and styles when editing them
gulp.task('watch', function () {
  // styles
  gulp.watch(stylesGlob, ['styles']);
});
