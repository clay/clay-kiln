import { toObject } from './csv';

// each expected value is what csvjson 4.3's toObject() returned for the same input,
// the library this replaces
describe('csv', () => {
  describe('toObject', () => {
    test.each([
      ['basic rows', 'name,age\nAda,36\nGrace,45', {}, [{ name: 'Ada', age: '36' }, { name: 'Grace', age: '45' }]],
      ['windows line endings and blank lines', 'a,b\r\n1,2\r\n\r\n3,4\r\n', {}, [{ a: '1', b: '2' }, { a: '3', b: '4' }]],
      ['quoted cells keep their delimiter', 'name,note\n"Hopper, Grace","says ""hi"""', { quote: '"' }, [{ name: 'Hopper, Grace', note: '' }]],
      ['escaped quote inside a quoted cell', "a,b\n\"it\\'s\",\"x\\\"y\"", { quote: '"' }, [{ a: "it's", b: 'x\\"y' }]],
      ['cells are trimmed', ' a , b \n  1  ,  2  ', {}, [{ ' a ': '1', ' b ': '2' }]],
      ['short rows get empty cells', 'a,b,c\n1\n1,2', {}, [{ a: '1', b: '', c: '' }, { a: '1', b: '2', c: '' }]],
      ['extra cells are dropped', 'a\n1,2,3', {}, [{ a: '1' }]],
      ['trailing delimiter is an empty cell', 'a,b\n1,', { quote: '"' }, [{ a: '1', b: '' }]],
      ['custom delimiter', 'a;b\n1;2', { delimiter: ';' }, [{ a: '1', b: '2' }]],
      ['tab delimiter', 'a\tb\n1\t2', { delimiter: '\t' }, [{ a: '1', b: '2' }]],
      ['single quote character', "a,b\n'x, y',z", { quote: "'" }, [{ a: 'x, y', b: 'z' }]],
      ['duplicate headers keep the last', 'a,a\n1,2', {}, [{ a: '2' }]],
      ['header only', 'a,b', {}, []],
      ['__proto__ header does not pollute', '__proto__,b\nx,y', { quote: '"' }, [{ b: 'y' }]]
    ])('%s', (name, csv, opts, expected) => {
      expect(toObject(csv, opts)).toEqual(expected);
    });

    test('a header called __proto__ does not change Object.prototype', () => {
      toObject('__proto__,b\nx,y', { quote: '"' });
      expect({}.x).toBeUndefined();
      expect(Object.keys(Object.prototype)).toEqual([]);
    });

    test('treats a quote of true as a double quote', () => {
      expect(toObject('a,b\n"x, y",z', { quote: true })).toEqual([{ a: 'x, y', b: 'z' }]);
    });

    test('throws if the input is not a string', () => {
      expect(() => toObject(5)).toThrow('Invalid input, input data should be a string');
    });
  });
});
