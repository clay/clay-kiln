import * as lib from './index';
import { overlayClass } from '../utils/references';

/**
 * jsdom has no layout engine, so every element reports offsetParent === null.
 * stub it to simulate an iframe that is (or is not) in a rendered subtree.
 * @param {Element} el
 * @param {Element|null} offsetParent
 */
function setOffsetParent(el, offsetParent) {
  Object.defineProperty(el, 'offsetParent', { value: offsetParent, configurable: true });
}

/**
 * build a component element containing one iframe
 * the element is attached to the document because getComputedStyle only resolves
 * to real values for in-document elements — and decorators always run on
 * attached elements, since reactive-render replaces the element before
 * decorating it
 * @param {string} [parentStyle] inline style for the iframe's wrapper
 * @returns {object} the component el, its wrapper, and the iframe
 */
function stubComponent(parentStyle = '') {
  const el = document.createElement('div');

  el.innerHTML = `<div class="embed" style="${parentStyle}"><iframe src="https://example.com/embed"></iframe></div>`;
  document.body.appendChild(el);

  return { el, parent: el.querySelector('.embed'), iframe: el.querySelector('iframe') };
}

describe('decorators', () => {
  describe('addIframeOverlays', () => {
    const fn = lib.addIframeOverlays;

    afterEach(() => {
      document.body.innerHTML = '';
    });

    test('adds an overlay after a rendered iframe', () => {
      const { el, iframe } = stubComponent();

      setOffsetParent(iframe, document.body);
      fn(el);

      expect(iframe.nextElementSibling.className).toBe('iframe-overlay-div');
      expect(iframe.nextElementSibling.hasAttribute('data-ignore')).toBe(true);
      expect(iframe.classList.contains(overlayClass)).toBe(true);
    });

    test('does not add a second overlay to an already-overlaid iframe', () => {
      const { el, iframe } = stubComponent();

      setOffsetParent(iframe, document.body);
      fn(el);
      fn(el);

      expect(el.querySelectorAll('.iframe-overlay-div')).toHaveLength(1);
    });

    test('skips iframes that are not rendered', () => {
      // analytics components ship iframes inside <noscript> and ad/tracking
      // components ship display:none iframes. both report a null offsetParent,
      // cannot capture a click, and only leave stray markup if overlaid
      const { el, iframe } = stubComponent();

      setOffsetParent(iframe, null);
      fn(el);

      expect(el.querySelector('.iframe-overlay-div')).toBeNull();
      expect(iframe.classList.contains(overlayClass)).toBe(false);
    });

    test('positions a static parent so the overlay cannot escape it', () => {
      // the overlay is absolute at 100%/100%. with a static parent it would fill
      // whatever distant ancestor happens to be positioned, covering unrelated
      // parts of the page and swallowing every click on them
      const { el, iframe, parent } = stubComponent();

      setOffsetParent(iframe, document.body);
      fn(el);

      expect(parent.style.position).toBe('relative');
    });

    test('leaves an already-positioned parent alone', () => {
      const { el, iframe, parent } = stubComponent('position: absolute');

      setOffsetParent(iframe, document.body);
      fn(el);

      expect(parent.style.position).toBe('absolute');
    });
  });
});
