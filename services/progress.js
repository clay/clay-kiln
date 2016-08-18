var _ = require('lodash'),
  nprogress = require('nprogress'),
  dom = require('@nymag/dom'),
  boxShadow = '0 0 10px 0',
  colors = {
    // these are taken from styleguide/_colors.scss
    draft: '#a17355',
    publish: '#149524',
    offline: '#888',
    error: '#DD2F1C',
    schedule: '#cc8e28',
    page: '#1782A9',
    layout: '#694C79'
  },
  timeoutMilliseconds = 3500; // should be the same timeout for every status message

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
 * get progress bar wrapper
 * @returns {Element}
 */
function getWrapper() {
  return dom.find('.kiln-progress-wrapper');
}

/**
 * get status element
 * @returns {Element}
 */
function getStatusEl() {
  return dom.find('.kiln-status');
}

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
  setColor(dom.find(getWrapper(), '.bar'), color, true);
}

/**
 * end progress bar
 * @param {string} [color] optional, if you want to transition colors before it ends
 */
function done(color) {
  var bar = dom.find(getWrapper(), '.bar');

  if (color && bar) {
    setColor(bar, color, true);
  }
  nprogress.done();
}

/**
 * open status message
 * @param {string} color
 * @param {string} message (note: this can be a string of html)
 * @param {boolean} [timeout] optional timeout to automatically close status
 */
function open(color, message, timeout) {
  var statusEl = getStatusEl();

  setColor(statusEl, color);
  statusEl.innerHTML = message;
  statusEl.classList.add('on');

  if (timeout) {
    setTimeout(close, timeoutMilliseconds);
  }
}

/**
 * close status message
 */
function close() {
  getStatusEl().classList.remove('on');
}

// progress bars
module.exports.start = start;
module.exports.done = done;
// status messages
module.exports.open = open;
module.exports.close = close;

// for testing
module.exports.timeoutMilliseconds = timeoutMilliseconds;

_.set(window, 'kiln.services.progress', module.exports); // export for plugins
