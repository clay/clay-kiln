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

    it('throws error if no type specified', () => {
      expect(() => fn(el)).to.throw(Error);
    });

    it('does not walk into child components', () => {
      expect(fn(el, 'editable').length).to.equal(1);
    });

    it('includes editable attribute at root element', () => {
      expect(fn(create(`<div ${refAttr}="foo" ${editAttr}="a"></div>`), 'editable').length).to.equal(1);
    });

    it('includes placeholder attribute at root element', () => {
      expect(fn(create(`<div ${refAttr}="foo" ${placeholderAttr}="a"></div>`), 'placeholder').length).to.equal(1);
    });
  });
});
