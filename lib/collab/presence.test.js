import ctx from './context';
import { editors, focuses, describe as doing } from './presence';

const uri = 'site/_components/paragraph/instances/a',
  NOW = 1000000,
  ada = { id: 'a', name: 'Ada Lovelace' };

function store(others) {
  return { state: { collab: { others } } };
}

describe('collab presence', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    ctx.clock = 0;
  });

  afterEach(() => jest.restoreAllMocks());

  test('draws what people have open, but not for a tab that stopped checking in', () => {
    const here = {
        tab: 't1', user: ada, focus: { uri }, seen: NOW - 2000
      },
      gone = {
        tab: 't2', user: ada, focus: { uri }, seen: NOW - 20000
      };

    expect(focuses(store([here, gone]))).toEqual([here]);
  });

  test('says someone is not connected rather than editing', () => {
    const [person] = editors(store([{
      tab: 't2', user: ada, focus: { uri, label: 'Paragraph' }, state: 'active', seen: NOW - 20000
    }]));

    expect(person.away).toBe(true);
    expect(doing(person)).toBe('Not connected right now');
    expect(doing({ focus: { uri, label: 'Paragraph' }, state: 'active' })).toBe('Editing Paragraph');
  });
});
