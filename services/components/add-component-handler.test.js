var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./add-component-handler'),
  dom = require('@nymag/dom');

describe(dirname, function () {
  describe(filename, function () {
    it('adds handler for list', function () {
      var button = lib(dom.create('<button>+</button>'), {
        list: {
          include: ['foo', 'bar']
        }
      });

      expect(button.getAttribute('data-components')).to.equal('foo,bar');
    });

    it('adds handler for property', function () {
      var button = lib(dom.create('<button>+</button>'), {
        prop: {
          include: ['foo', 'bar']
        }
      });

      expect(button.getAttribute('data-components')).to.equal('foo,bar');
    });


    describe('getParentEditableElement', function () {
      var fn = lib[this.title];

      it('finds list when list is parent el', function () {
        var el = dom.create('<div data-editable="content"></div>');

        expect(fn(el, 'content')).to.equal(el);
      });

      it('finds list inside parent el', function () {
        var el = dom.create('<div><div class="inner" data-editable="content"></div></div>');

        expect(fn(el, 'content')).to.equal(el.querySelector('.inner'));
      });
    });
  });
});
