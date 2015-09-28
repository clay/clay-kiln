var lib = require('./site');

describe('site service', function () {
  describe('get', function () {
    var fn = lib[this.title];

    it('gets things', function () {
      lib.set({
        protocol: 'http:'
      });

      expect(fn('protocol')).to.equal('http:');
    });
  });

  describe('addProtocol', function () {
    var fn = lib[this.title],
      uri = 'google.com/foo.html';

    it('adds protocol to uris', function () {
      lib.set({
        protocol: 'http:'
      });
      expect(fn(uri)).to.equal('http://google.com/foo.html');
    });

    it('doesn\'t add extra protocol to urls that already have protocol', function () {
      lib.set({
        protocol: 'http:'
      });
      expect(fn('http://' + uri)).to.equal('http://google.com/foo.html');
    });
  });

  describe('addPort', function () {
    var fn = lib[this.title],
      uri = 'google.com/foo.html';

    it('adds port to uris', function () {
      lib.set({
        host: 'google.com',
        port: '3000'
      });
      expect(fn(uri)).to.equal('google.com:3000/foo.html');
    });

    it('doesn\'t add port to uris on port 80', function () {
      lib.set({
        host: 'google.com',
        port: '80'
      });
      expect(fn(uri)).to.equal(uri);
    });

    it('doesn\'t add port to uris that already have a port', function () {
      lib.set({
        host: 'google.com',
        port: '3000'
      });
      expect(fn('google.com:3000/foo.html')).to.equal('google.com:3000/foo.html');
    });
  });
});
