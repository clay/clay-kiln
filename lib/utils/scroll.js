const easingEquations = {
  easeOutSine: function (pos) {
    return Math.sin(pos * (Math.PI / 2));
  },
  easeInOutSine: function (pos) {
    return -0.5 * (Math.cos(Math.PI * pos) - 1);
  },
  easeInOutQuint: function (pos) {
    if ((pos /= 0.5) < 1) {
      return 0.5 * Math.pow(pos, 5);
    } else {
      return 0.5 * (Math.pow(pos - 2, 5) + 2);
    }
  }
};

/**
 * add event listeners for manual scrolling
 * @param {function} fn to call
 */
function addListeners(fn) {
  window.addEventListener('wheel', fn); // firefox
  window.addEventListener('mousewheel', fn); // chrome, safari, etc
  window.addEventListener('touchmove', fn); // ios, android
}

/**
 * remove event listeners for manual scrolling
 * @param {function} fn to remove
 */
function removeListeners(fn) {
  window.removeEventListener('wheel', fn); // firefox
  window.removeEventListener('mousewheel', fn); // chrome, safari, etc
  window.removeEventListener('touchmove', fn); // ios, android
}

/**
 * scroll to an element
 * @param {number} scrollTargetY
 * @param {number} speed (in pixels per second)
 * @param {string} easing equation to use
 */
export function scrollToY(scrollTargetY, speed, easing) {
  const scrollY = window.scrollY;

  // min time .1, max time .8 seconds
  let time = Math.max(0.1, Math.min(Math.abs(scrollY - scrollTargetY) / speed, 0.8)),
    currentTime = 0;

  // defaults
  scrollTargetY = scrollTargetY || 0;
  speed = speed || 2000;
  easing = easing || 'easeOutSine';

  function stopAutoScroll() {
    window.autoScroll = false;
    removeListeners(stopAutoScroll);
  }

  // set a scroll handler so we can stop tick()'ing if the user manually scrolls
  window.autoScroll = true;
  addListeners(stopAutoScroll);

  // recursive animation loop
  function tick() {
    let p,
      t;

    currentTime += 1 / 60;
    p = currentTime / time;
    t = easingEquations[easing](p);

    if (p < 1 && window.autoScroll) {
      // keep scrolling
      window.requestAnimationFrame(tick);
      window.scrollTo(0, scrollY + (scrollTargetY - scrollY) * t);
      window.autoScroll = true;
    } else if (!window.autoScroll) {
      // user manually stopped the scroll animation
    } else {
      // scroll the rest of the way to the top
      window.scrollTo(0, scrollTargetY);
    }
  }

  // call it once to get started
  tick();
}
