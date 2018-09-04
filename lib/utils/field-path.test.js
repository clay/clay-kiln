import * as lib from './field-path';

describe('field-path', () => {
  describe('fromDotNotation', () => {
    const fn = lib.fromDotNotation;

    test('converts array indices to bracket notation', () => {
      expect(fn('foo.0.bar')).toBe('foo[0].bar');
    });

    test('works with leaf array indices', () => {
      expect(fn('foo.26')).toBe('foo[26]');
    });

    test('works with multiple arrays', () => {
      expect(fn('foo.10.bar.20')).toBe('foo[10].bar[20]');
    });

    test('works with multiple sequential arrays', () => {
      expect(fn('foo.10.20')).toBe('foo[10][20]');
    });

    test('passes through brackets (idempotent)', () => {
      expect(fn('foo[0].bar')).toBe('foo[0].bar');
    });
  });

  describe('toDotNotation', () => {
    const fn = lib.toDotNotation;

    test('converts array indices to dot notation', () => {
      expect(fn('foo[0].bar')).toBe('foo.0.bar');
    });

    test('works with leaf array indices', () => {
      expect(fn('foo[26]')).toBe('foo.26');
    });

    test('works with multiple arrays', () => {
      expect(fn('foo[10].bar[20]')).toBe('foo.10.bar.20');
    });

    test('works with multiple sequential arrays', () => {
      expect(fn('foo[10][20]')).toBe('foo.10.20');
    });

    test('passes through dots (idempotent)', () => {
      expect(fn('foo.0.bar')).toBe('foo.0.bar');
    });
  });
});
