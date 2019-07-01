/**
 * polyfill for event.path on unsupported browsers
 * @param  {Event} event
 * @return {array} array of elements the event has bubbled through
 */
export function getEventPath(event) {
  let path = [],
    target = event.target;

  if (event.path) {
    // chrome supports this
    return event.path;
  }

  // firefox doesn't support this, so create it manually
  while (target.parentNode) {
    path.push(target);
    target = target.parentNode;
  }

  path.push(document, window);

  return path;
}

/**
 * Behaves the same as setTimeout except uses requestAnimationFrame() where possible for better performance
 * note: modified replacement for setTimeout, created by joelambert (MIT license)
 * original at https://gist.github.com/joelambert/1002116
 * @param {function} fn The callback function
 * @param {number} delay The delay in milliseconds
 * @returns {object}
 */
export function requestTimeout(fn, delay) {
  const start = new Date().getTime(),
    handle = {};

  if (!window.requestAnimationFrame) {
    return window.setTimeout(fn, delay);
  }

  function loop() {
    const current = new Date().getTime(),
      delta = current - start;

    delta >= delay ? fn.call() : handle.value = requestAnimationFrame(loop);
  }

  handle.value = requestAnimationFrame(loop);

  return handle;
}

/**
 * Behaves the same as clearTimeout except uses cancelRequestAnimationFrame() where possible for better performance
 * @param {object} handle
 */
export function clearRequestTimeout(handle) {
  handle = handle || {};
  window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) : clearTimeout(handle.value);
}
