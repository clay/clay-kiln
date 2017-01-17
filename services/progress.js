var _ = require('lodash'),
  nprogress = require('nprogress'),
  dom = require('@nymag/dom'),
  boxShadow = '0 0 10px 0',
  colors = {
    // these are taken from styleguide/_colors.scss
    draft: '#c8b585',
    schedule: '#d29c31',
    publish: '#599f61',
    offline: '#888',
    error: '#a86667',
    save: '#229ed3'
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
 * @param {string} message on the left (note: this can be html)
 * @param {string} [action] on the right (note: this can be html)
 * @param {boolean} [permanent] disable the timeout in special circumstances
 */
function open(color, message, action, permanent) {
  var statusEl = getStatusEl();

  statusEl.innerHTML = ''; // clear any message/action from before

  // set status message and/or action
  if (message) {
    statusEl.appendChild(dom.create(`<div class="kiln-status-message">${message}</div>`));
  }

  if (action) {
    statusEl.appendChild(dom.create(`<div class="kiln-status-action">${action}</div>`));
  }

  // set the color and show status message
  setColor(statusEl, color);
  statusEl.classList.add('on');

  // if permanent is undefined or otherwise falsy, set the timeout
  if (permanent !== true) {
    setTimeout(close, timeoutMilliseconds);
  }
}

/**
 * close status message
 */
function close() {
  var statusEl = getStatusEl();

  statusEl.innerHTML = ''; // clear any message/action from before
  statusEl.classList.remove('on');
}

/**
 * convenience function to close the progress bar and display an error message
 * @param  {string} message
 * @return {function}
 */
function error(message) {
  return function (e) {
    // centralize error logging right here
    console.error(e);
    done('error');
    open('error', `${message}: ${e.message}`);
    // note: "Failed to fetch" is a common error message which means an API call failed.
    // check the console to see which calls are giving issues.
    return Promise.reject(e); // reject error rather than returning it
  };
}

// progress bars
module.exports.start = start;
module.exports.done = done;
// status messages
module.exports.open = open;
module.exports.close = close;
module.exports.error = error;

// for testing
module.exports.timeoutMilliseconds = timeoutMilliseconds;

_.set(window, 'kiln.services.progress', module.exports); // export for plugins
