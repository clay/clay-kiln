var gulp = require('gulp'),
  gutil = require('gulp-util'),
  chalk = require('chalk'),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer'),
  rename = require('gulp-rename'),
  // gulpif = require('gulp-if'),
  browserify = require('browserify'),
  rollupify = require('rollupify'),
  babelify = require('babelify'),
  es2015 = require('babel-preset-es2015'),
  watchify = require('watchify'),
  duration = require('gulp-duration'),
  // uglify = require('gulp-uglify'),
  concat = require('gulp-concat'),
  sass = require('gulp-sass'),
  rfn = require('responsive-filenames'),
  autoprefix = require('gulp-autoprefixer'),
  cssmin = require('gulp-cssmin'),
  prefixOptions = { browsers: ['last 2 versions', 'ie >= 9', 'ios >= 7', 'android >= 4.4.2'] },
  stylesGlob = [
    'styleguide/*.scss',
    'styleguide/*.css',
    'behaviors/*.scss',
    'behaviors/*.css'
  ];

gulp.task('styles', function () {
  return gulp.src(stylesGlob)
    .pipe(sass().on('error', sass.logError))
    .pipe(rfn())
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

gulp.task('scripts', function () {
  var b = browserify({
      entries: ['./client.js'],
      cache: {},
      packageCache: {}
    }),
    runOnce = process.argv.indexOf('--once') > -1;
  // for non-dev environments, use `gulp scripts --once` or `gulp --once`

  // plugins and transforms
  if (!runOnce) {
    // on dev environments (by default), add watchify plugin
    b.plugin(watchify, { ignoreWatch: ['**/node_modules/**', '**/dist/**'] });
  }
  b.transform(rollupify);
  b.transform(babelify, { presets: [es2015] });

  if (!runOnce) {
    // on dev environments (by default), re-bundle every time js changes
    b.on('update', bundle);
  }

  function bundle() {
    var bundleTimer = duration('Compile time');

    console.log(chalk.blue('Compiling scripts!'));
    return b.bundle()
      .on('error', mapError) // log bundling errors
      .pipe(source('client.js')) // Set source name
      .pipe(buffer()) // convert to vinyl buffer
      .pipe(rename('clay-kiln.js')) // rename the output file
      // .pipe(gulpif(runOnce, uglify()))
      .pipe(bundleTimer)
      .pipe(gulp.dest('dist'));
  }

  // always kick things off with a bundle()
  return bundle();
});

// default task: run scripts and styles
gulp.task('default', ['styles', 'scripts']);

// recompile scripts and styles when editing them
gulp.task('watch', function () {
  // styles
  gulp.watch(stylesGlob, ['styles']);
});
