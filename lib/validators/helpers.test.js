import * as lib from './helpers';

describe('validation helpers', () => {
  describe('getPreviewText', () => {
    const fn = lib.getPreviewText;

    it('returns the full text if short', () => {
      expect(fn('hello', 0, 0)).to.equal('hello');
    });

    it('truncates text', () => {
      expect(fn('O brave new world, that has such people in\'t!', 21, 0)).to.equal('… brave new world, that has such people i…');
    });
  });
});
