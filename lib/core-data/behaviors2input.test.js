import * as lib from './behaviors2input';

describe('behaviors to input', () => {
  describe('hasBehaviors', () => {
    const fn = lib.hasBehaviors,
      behavior = { fn: 'text',  type: 'url' },
      input = { input: 'text', type: 'url' },
      schema = {
        displayField: { _display: 'overlay' },
        arrayField: { _has: [behavior] },
        objectField: { _has: behavior },
        oldStringField: { _has: 'textarea' },
        newStringField: { _has: 'text' },
        inputField: { _has: input },
        errorField: { foo: 'bar' },
        _groups: {
          displayGroup: { _display: 'overlay' },
          arrayGroup: { fields: ['arrayField'] },
          objectGroup: { fields: ['objectField'] },
          oldStringGroup: { fields: ['oldStringField'] },
          newStringGroup: { fields: ['newStringField'] },
          inputGroup: { fields: ['inputField'] },
          errorGroup: { foo: 'bar' }
        }
      };

    // fields

    it('returns true if field has _display', () => {
      expect(fn('displayField', schema)).to.equal(true);
    });

    it('returns true if field has behaviors array', () => {
      expect(fn('arrayField', schema)).to.equal(true);
    });

    it('returns true if field has behavior object', () => {
      expect(fn('objectField', schema)).to.equal(true);
    });

    it('returns true if field has behavior string (matches old behaviors)', () => {
      expect(fn('oldStringField', schema)).to.equal(true);
    });

    it('returns false if field has input string (matches new inputs)', () => {
      expect(fn('newStringField', schema)).to.equal(false);
    });

    it('returns false if field has input object', () => {
      expect(fn('inputField', schema)).to.equal(false);
    });

    it('throws error if field has no _has property', () => {
      expect(() => fn('errorField', schema)).to.throw(Error);
    });

    // groups

    it('returns true if group has _display', () => {
      expect(fn('displayGroup', schema)).to.equal(true);
    });

    it('returns true if group has fields with behaviors arrays', () => {
      expect(fn('arrayGroup', schema)).to.equal(true);
    });

    it('returns true if group has fields with behavior objects', () => {
      expect(fn('objectGroup', schema)).to.equal(true);
    });

    it('returns true if group has fields with behavior strings (matches old behaviors)', () => {
      expect(fn('oldStringGroup', schema)).to.equal(true);
    });

    it('returns false if group has fields with input strings (matches new inputs)', () => {
      expect(fn('newStringGroup', schema)).to.equal(false);
    });

    it('returns false if group has fields with input objects', () => {
      expect(fn('inputGroup', schema)).to.equal(false);
    });

    it('throws error if group has no fields property', () => {
      expect(() => fn('errorGroup', schema)).to.throw(Error);
    });
  });
});
