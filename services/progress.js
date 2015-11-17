const nprogress = require('nprogress'),
  dom = require('./dom'),
  barWrapper = dom.find('.kiln-progress-wrapper'),
  statusEl = dom.find('.kiln-status'),
  colors = {
    // these are taken from styleguide/_colors.scss
    blue: '#1782A9',
    green: '#149524',
    grey: '#888'
  };

// configure nprogress
nprogress.configure({
  template: '<div class="bar" role="bar"><div class="peg"></div></div>',
  showSpinner: false,
  parent: '.kiln-progress-wrapper'
});

/**
 * start progress bar
 * @param {string} color for the bar to be
 */
function start(color) {
  // set color
  nprogress.start();
}

/**
 * end progress bar
 * @param {string} [color] optional, if you want to transition colors before it ends
 */
function done(color) {
  let bar = dom.find(barWrapper, '.bar');

  bar.style.backgroundColor = colors[color];
  nprogress.done();
}

/**
 * open status message
 * @param {string} color
 * @param {string} message (note: this can be a string of html)
 */
function open(color, message) {
  statusEl.style.backgroundColor = colors[color];
  statusEl.innerHTML = message;
  statusEl.classList.add('on');
}

/**
 * close status message
 */
function close() {
  statusEl.classList.remove('on');
}

// progress bars
module.exports.start = start;
module.exports.done = done;
// status messages
module.exports.open = open;
module.exports.close = close;
