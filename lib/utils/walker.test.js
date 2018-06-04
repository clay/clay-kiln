import { create } from '@nymag/dom';
import { refAttr, editAttr, placeholderAttr } from './references';
import * as lib from './walker';

describe('walker', () => {
  describe('getComponentNodes', () => {
    const fn = lib.getComponentNodes,
      el = create(`<div ${refAttr}="foo">
        <div ${refAttr}="bar">
          <span ${editAttr}="a"></span>
        </div>
        <span ${editAttr}="b"></span>
        <span ${placeholderAttr}="c"></span>
      </div>`);

    test('throws error if no type specified', () => {
      expect(() => fn(el)).toThrow(Error);
    });

    test('does not walk into child components', () => {
      expect(fn(el, 'editable').length).toBe(1);
    });

    test('includes editable attribute at root element', () => {
      expect(fn(create(`<div ${refAttr}="foo" ${editAttr}="a"></div>`), 'editable').length).toBe(1);
    });

    test('includes placeholder attribute at root element', () => {
      expect(fn(create(`<div ${refAttr}="foo" ${placeholderAttr}="a"></div>`), 'placeholder').length).toBe(1);
    });
  });
});
