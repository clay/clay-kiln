import { plainText, copyToClipboard, withCopy } from './copy';

describe('collab copy', () => {
  afterEach(() => {
    delete window.ClipboardItem;
    delete navigator.clipboard;
  });

  test('turns a field\'s value into text', () => {
    expect(plainText('Some <em>emphasis</em> and a <a href="x">link</a><br>next line')).toBe('Some emphasis and a link\nnext line');
  });

  test('copies formatted and plain text when the browser can', () => {
    const write = jest.fn(() => Promise.resolve());

    window.ClipboardItem = jest.fn(function (items) { this.items = items; });
    Object.defineProperty(navigator, 'clipboard', { value: { write }, configurable: true });

    return copyToClipboard(['one <strong>two</strong>', 'three']).then(() => {
      expect(write).toHaveBeenCalledTimes(1);
      expect(Object.keys(write.mock.calls[0][0][0].items)).toEqual(['text/html', 'text/plain']);
    });
  });

  test('offers the copy only when there is text to copy', () => {
    const store = { dispatch: jest.fn() };

    expect(withCopy(store, 'Gone', { title: '  ', checked: true })).toBe('Gone');
    expect(withCopy(store, 'Gone', { text: 'my words' })).toMatchObject({ message: 'Gone', action: 'Copy your text' });
  });

  test('says so when it could not copy', () => {
    const store = { dispatch: jest.fn() },
      notice = withCopy(store, 'Gone', { text: 'my words' });

    return notice.onActionClick().then(() => expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', 'Couldn\'t copy your text'));
  });
});
