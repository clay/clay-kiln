// this is a tiny little service that instantiates date pickers for browsers that
// don't natively support them
import _ from 'lodash';
import Flatpickr from 'flatpickr';
import { find } from '@nymag/dom';

/**
 * do user agent check to determine if the current browser supports native date pickers
 * note: we need to do the UA sniffing because not all browsers that support
 * <input type="date|time|datetime-local|etc"> actually use the native picker
 * (here's looking at you, Firefox (ง •̀_•́)ง)
 * @returns {boolean}
 */
export function hasNativePicker() {
  // note:
  // IE11 returns undefined for window.chrome
  // Opera 30 outputs true for window.chrome
  // IE Edge outputs to true for window.chrome
  const isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf('OPR') > -1,
    isIEedge = winNav.userAgent.indexOf('Edge') > -1,
    isIOSChrome = !!winNav.userAgent.match('CriOS'),
    isMobileSafari = !!winNav.userAgent.match(/(iPod|iPhone|iPad)/) && !!winNav.userAgent.match(/AppleWebKit/),
    isDesktopChrome = isChromium !== null && isChromium !== undefined && vendorName === 'Google Inc.' && isOpera === false && isIEedge === false;

  return isIOSChrome || isDesktopChrome || isMobileSafari;
}

/**
 * instantiate a non-native datepicker on an element
 * @param {Element} el
 * @param {object} [options] get merged with type-specific options
 * @returns {object|undefined}
 */
export function init(el, options) {
  var type = el.getAttribute('type'),
    enableTime, noCalendar, finalOptions; // options that change depending on input type

  if (type === 'datetime-local') {
    enableTime = true;
    noCalendar = false;
  } else if (type === 'date') {
    enableTime = false;
    noCalendar = false;
  } else if (type === 'time') {
    enableTime = true;
    noCalendar = true;
  } else {
    return; // don't init a datepicker for any other type of input
  }

  // merge passed-in options with type-specific options
  finalOptions = _.assign({ enableTime, noCalendar }, options);

  if (!hasNativePicker()) {
    let fp = new Flatpickr(el, finalOptions);

    // make sure clicks on the flatpickr calendar don't propagate events up to the document
    // (because that'll close forms + panes and unselect components)
    find('.flatpickr-calendar').addEventListener('click', (e) => e.stopPropagation());
    return fp;
  }
}
