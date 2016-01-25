/**
 * scroll to an element
 * @param {number} scrollTargetY
 * @param {number} speed (in pixels per second)
 * @param {string} easing equation to use
 */
function scrollToY(scrollTargetY, speed, easing) {
  const scrollY = window.scrollY,
    easingEquations = {
      easeOutSine: function (pos) {
        return Math.sin(pos * (Math.PI / 2));
      },
      easeInOutSine: function (pos) {
        return (-0.5 * (Math.cos(Math.PI * pos) - 1));
      },
      easeInOutQuint: function (pos) {
        if ((pos /= 0.5) < 1) {
          return 0.5 * Math.pow(pos, 5);
        } else {
          return 0.5 * (Math.pow((pos - 2), 5) + 2);
        }
      }
    };

  // min time .1, max time .8 seconds
  let time = Math.max(0.1, Math.min(Math.abs(scrollY - scrollTargetY) / speed, 0.8)),
    currentTime = 0;

  // defaults
  scrollTargetY = scrollTargetY || 0;
  speed = speed || 2000;
  easing = easing || 'easeOutSine';

  function stopAutoScroll() {
    window.autoScroll = false;
    window.removeEventListener('wheel', stopAutoScroll);
    window.removeEventListener('mousewheel', stopAutoScroll);
    window.removeEventListener('touchmove', stopAutoScroll);
  }

  // set a scroll handler so we can stop tick()'ing if the user manually scrolls
  window.autoScroll = true;
  window.addEventListener('wheel', stopAutoScroll); // firefox
  window.addEventListener('mousewheel', stopAutoScroll); // chrome, safari, etc
  window.addEventListener('touchmove', stopAutoScroll); // ios, android

  // recursive animation loop
  function tick() {
    let p, t;

    currentTime += 1 / 60;
    p = currentTime / time;
    t = easingEquations[easing](p);

    if (p < 1 && window.autoScroll) {
      // keep scrolling
      window.requestAnimationFrame(tick);
      window.scrollTo(0, scrollY + ((scrollTargetY - scrollY) * t));
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

module.exports.toY = scrollToY;
