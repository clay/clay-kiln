var gulp = require('gulp'),
  map = require('vinyl-map'),
  browserify = require('browserify'),
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
    'publishing-rules/**',
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
  return gulp.src('client.js') // browserify will pull in all required() scripts
    // .pipe(sourcemaps.init({includeContent: true}))
    .pipe(map(function (code, filename, done) {
      var b, compiled;

      if (code.indexOf('require(') > -1) {
        // this bit of code is written in node format. browserify it!
        b = browserify({
          entries: filename,
          debug: true
        });
        compiled = '';

        b.bundle().on('data', function (chunk) {
          compiled += chunk;
        }).on('end', function () {
          done(null, compiled);
        });
      } else {
        done(null, code);
      }
    }))
    .pipe(concat('clay-kiln.js'))
    // .pipe(uglify()).on('error', gutil.log)
    // .pipe(sourcemaps.write('./'))
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
