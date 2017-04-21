import { create } from '@nymag/dom';
import * as components from '../core-data/components';
import { refAttr, editAttr, placeholderClass, selectorClass } from './references';
import * as lib from './caret';

describe('caret', () => {
  let textNode = document.createTextNode('Hello World'),
    span = create(`<span ${editAttr}="foo"></span>`),
    el = create(`<div ${refAttr}="domain.com/components/hi"></div>`),
    sandbox;

  span.appendChild(textNode);
  el.appendChild(span);

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    if (document.caretPositionFromPoint) {
      sandbox.stub(document, 'caretPositionFromPoint').returns({ offsetNode: textNode, offset: 5 });
    } else if (document.caretRangeFromPoint) {
      sandbox.stub(document, 'caretRangeFromPoint').returns({ startContainer: textNode, startOffset: 5 });
    }
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getClickOffset', () => {
    const fn = lib.getClickOffset;

    it('gets the offset of clicked text', () => {
      sandbox.stub(components, 'getData').returns('Hello World');
      expect(fn({ clientX: 0, clientY: 0 })).to.equal(5);
    });

    it('gets the offset when clicking past text', () => {
      document.caretRangeFromPoint.returns({ startContainer: span, startOffset: 5 });
      sandbox.stub(components, 'getData').returns('Hello World');
      span.classList.add(selectorClass);
      expect(fn({ clientX: 0, clientY: 0 })).to.equal(11);
    });

    it('returns 0 for placeholders', () => {
      sandbox.stub(components, 'getData').returns('Hello World');
      span.classList.add(placeholderClass);

      expect(fn({ clientX: 0, clientY: 0 })).to.equal(0);
    });

    it('returns 0 if data is not in parent element', () => {
      sandbox.stub(components, 'getData').returns('Other Text');
      span.classList.remove(placeholderClass);

      expect(fn({ clientX: 0, clientY: 0 })).to.equal(0);
    });
  });
});
