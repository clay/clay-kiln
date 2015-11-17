var nprogress = require('nprogress'),
  dom = require('./dom'),
  barWrapper = dom.find('.kiln-progress-wrapper'),
  statusEl = dom.find('.kiln-status'),
  boxShadow = '0 0 10px 0',
  colors = {
    // these are taken from styleguide/_colors.scss
    blue: '#1782A9',
    green: '#149524',
    grey: '#888',
    red: '#DD2F1C'
  };

// configure nprogress
nprogress.configure({
  template: '<div class="bar" role="bar"></div>',
  showSpinner: false,
  parent: '.kiln-progress-wrapper',
  easing: 'linear',
  speed: 1000,
  trickleSpeed: 50,
  trickleRate: 0.01
});

/**
 * set color of a bar or status message
 * @param {Element} el
 * @param {string} color
 * @param {boolean} [hasShadow]
 */
function setColor(el, color, hasShadow) {
  el.style.backgroundColor = colors[color];

  if (hasShadow) {
    el.style.boxShadow = boxShadow + colors[color];
  }
}

/**
 * start progress bar
 * @param {string} color for the bar to be
 */
function start(color) {
  nprogress.start(); // note: .bar doesn't exist until nprogress.start() is called
  setColor(dom.find(barWrapper, '.bar'), color, true);
}

/**
 * end progress bar
 * @param {string} [color] optional, if you want to transition colors before it ends
 */
function done(color) {
  if (color) {
    setColor(dom.find(barWrapper, '.bar'), color, true);
  }
  nprogress.done();
}

/**
 * open status message
 * @param {string} color
 * @param {string} message (note: this can be a string of html)
 * @param {number} [timeout] optional timeout to automatically close status
 */
function open(color, message, timeout) {
  setColor(statusEl, color);
  statusEl.innerHTML = message;
  statusEl.classList.add('on');

  if (!!timeout) {
    setTimeout(close, timeout);
  }
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
