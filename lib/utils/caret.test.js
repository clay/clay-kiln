import { create } from '@nymag/dom';
import * as components from '../core-data/components';
import {
  refAttr, editAttr, placeholderClass, selectorClass
} from './references';
import * as lib from './caret';

jest.mock('../core-data/components');

describe('caret', () => {
  let textNode = document.createTextNode('Hello World'),
    span = create(`<span ${editAttr}="foo"></span>`),
    el = create(`<div ${refAttr}="domain.com/_components/hi"></div>`);

  span.appendChild(textNode);
  el.appendChild(span);

  describe('getClickOffset', () => {
    const fn = lib.getClickOffset;

    test('gets the offset of clicked text', () => {
      let doc = { caretPositionFromPoint: jest.fn(), createElement: document.createElement.bind(document) };

      doc.caretPositionFromPoint.mockReturnValue({ offsetNode: textNode, offset: 5 });
      components.getData.mockReturnValue('Hello World');
      expect(fn({ clientX: 0, clientY: 0 }, doc)).toBe(5);
    });

    test('gets the offset when clicking past text', () => {
      let doc = { caretRangeFromPoint: jest.fn(), createElement: document.createElement.bind(document) };

      doc.caretRangeFromPoint.mockReturnValue({ startContainer: span, startOffset: 5 });
      components.getData.mockReturnValue('Hello World');
      span.classList.add(selectorClass);
      expect(fn({ clientX: 0, clientY: 0 }, doc)).toBe(11);
    });

    test('returns 0 for placeholders', () => {
      let doc = { caretRangeFromPoint: jest.fn(), createElement: document.createElement.bind(document) };

      doc.caretRangeFromPoint.mockReturnValue({ startContainer: span, startOffset: 5 });
      components.getData.mockReturnValue('Hello World');
      span.classList.add(placeholderClass);

      expect(fn({ clientX: 0, clientY: 0 }, doc)).toBe(0);
    });

    test('returns 0 if data is not in parent element', () => {
      let doc = { caretPositionFromPoint: jest.fn(), createElement: document.createElement.bind(document) };

      doc.caretPositionFromPoint.mockReturnValue({ offsetNode: textNode, offset: 5 });
      components.getData.mockReturnValue('Other Text');
      span.classList.remove(placeholderClass);

      expect(fn({ clientX: 0, clientY: 0 }, doc)).toBe(0);
    });
  });
});
