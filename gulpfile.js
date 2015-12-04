var gulp = require('gulp'),
  browserify = require('gulp-browserify-globs'),
  sourcemaps = require('gulp-sourcemaps'),
  babelify = require('babelify'),
  uglify = require('gulp-uglify'),
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
  ],
  scriptsGlob = [
    // used only for watching, since client.js references everything needed for browserify
    'client.js',
    'behaviors/*.js',
    'behaviors/*.test.js',
    'controllers/**',
    'decorators/**',
    'validators/**',
    'services/**',
  ];
  // sourcemaps = require('gulp-sourcemaps'),
  // uglify = require('gulp-uglify');

gulp.task('styles', function () {
  return gulp.src(stylesGlob)
    .pipe(sass().on('error', sass.logError))
    .pipe(rfn())
    .pipe(concat('clay-kiln.css'))
    .pipe(autoprefix(prefixOptions))
    .pipe(cssmin())
    .pipe(gulp.dest('dist'));
});

gulp.task('scripts', function () {
  return browserify(['client.js'], {
    debug: true,
    transform: babelify.configure({ presets: ['es2015'] }),
    outfile: 'clay-kiln.js'
  })
  // load sourcemaps from browserify
  .pipe(sourcemaps.init({ loadMaps: true }))
  .pipe(uglify())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('dist'));
});

// default task: run scripts and styles
gulp.task('default', ['styles', 'scripts']);

// recompile scripts and styles when editing them
gulp.task('watch', function () {
  // styles
  gulp.watch(stylesGlob, ['styles']);

  // scripts
  gulp.watch(scriptsGlob, ['scripts']);
});
