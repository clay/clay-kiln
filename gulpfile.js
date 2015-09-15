var gulp = require('gulp'),
  map = require('vinyl-map'),
  browserify = require('browserify'),
  concat = require('gulp-concat');
  // sourcemaps = require('gulp-sourcemaps'),
  // uglify = require('gulp-uglify');

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
