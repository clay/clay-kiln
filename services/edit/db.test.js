var lib = require('./db'),
  sinon = require('sinon'),
  site = require('./../site'),
  rest = require('./rest');

describe('db service', function () {
  var sandbox;

  function respond(data) {
    rest.send.returns(Promise.resolve({
      status: 200,
      json: () => Promise.resolve(JSON.parse(data)),
      text: () => Promise.resolve(data)
    }));
  }

  function respondError(code) {
    rest.send.returns(Promise.resolve({
      status: code,
      statusText: 'nope'
    }));
  }

  /**
   * Create tests that verify that bad uris are blocked
   *
   * @param {function} fn
   */
  function createUriBlockTests(fn) {
    it('throws on protocol', function () {
      expect(function () {
        fn('http://foo');
      }).to.throw();
    });

    it('throws on starting slash', function () {
      expect(function () {
        fn('/foo');
      }).to.throw();
    });

    it('throws on port', function () {
      expect(function () {
        fn('foo:8000');
      }).to.throw();
    });

    it('throws on 404', function (done) {
      respondError(404);

      fn('foo').then(function (result) {
        done('should throw: ' + require('util').inspect(result, {depth: 10}));
      }, function () {
        done();
      });
    });

    it('throws on 500', function (done) {
      respondError(500);

      fn('foo').then(function (result) {
        done('should throw: ' + require('util').inspect(result, {depth: 10}));
      }, function () {
        done();
      });
    });
  }

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub(rest, 'send');

    sandbox.stub(site);
    site.addProtocol.returnsArg(0);
    site.addPort.returnsArg(0);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getSchema', function () {
    var fn = lib[this.title];

    createUriBlockTests(fn);

    it('returns data with schema', function () {
      respond('{}');

      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({});
      });
    });

    it('throws on bad data', function (done) {
      var data = 'jkfdlsa';

      respond(data);

      fn('foo').then(function () {
        done('should throw');
      }, function () {
        done();
      });
    });
  });

  describe('get', function () {
    var fn = lib[this.title];

    createUriBlockTests(fn);

    it('returns data', function () {
      respond('{}');

      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({});
      });
    });

    it('throws on bad data', function (done) {
      var data = 'jkfdlsa';

      respond(data);

      fn('foo').then(function () {
        done('should throw');
      }, function () {
        done();
      });
    });
  });

  describe('getText', function () {
    var fn = lib[this.title];

    createUriBlockTests(fn);

    it('returns text', function () {
      var data = 'some text';

      respond(data);

      return fn('foo').then(function (result) {
        expect(result).to.equal(data);
      });
    });
  });

  describe('getHead', function () {
    var fn = lib[this.title];

    // test for things in createUriBlockTests, except for 4xx and 5xx responses
    it('throws on protocol', function () {
      expect(function () {
        fn('http://foo');
      }).to.throw();
    });

    it('throws on starting slash', function () {
      expect(function () {
        fn('/foo');
      }).to.throw();
    });

    it('throws on port', function () {
      expect(function () {
        fn('foo:8000');
      }).to.throw();
    });

    it('returns true if resource exists', function () {
      respond('some text');

      return fn('foo').then(function (result) {
        expect(result).to.equal(true);
      });
    });

    it('returns false if resource responds with 4xx error', function () {
      respondError(404);

      return fn('foo').then(function (result) {
        expect(result).to.equal(false);
      });
    });

    it('returns false if resource responds with 5xx error', function () {
      respondError(500);

      return fn('foo').then(function (result) {
        expect(result).to.equal(false);
      });
    });
  });

  describe('getHTML', function () {
    var fn = lib[this.title];

    createUriBlockTests(fn);

    it('returns html with data-uri', function () {
      var data = '<span></span>';

      respond(data);

      return fn('foo').then(function (result) {
        expect(result.getAttribute('data-uri')).to.deep.equal('foo');
      });
    });

    it('throws on bad html', function (done) {
      var data = '<spa';

      respond(data);

      fn('foo').then(function () {
        done('should throw');
      }, function () {
        done();
      });
    });
  });

  describe('getHTMLWithQuery', function () {
    var fn = lib[this.title];

    createUriBlockTests(fn);

    it('returns html with data-uri', function () {
      var data = '<span></span>';

      respond(data);

      return fn('foo').then(function (result) {
        expect(result.getAttribute('data-uri')).to.deep.equal('foo');
      });
    });

    it('throws on bad html', function (done) {
      var data = '<spa';

      respond(data);

      fn('foo').then(function () {
        done('should throw');
      }, function () {
        done();
      });
    });
  });

  describe('save', function () {
    var fn = lib[this.title];

    createUriBlockTests(fn);

    it('returns data with schema', function () {
      respond('{}');

      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({});
      });
    });

    it('throws on bad data', function (done) {
      var data = 'jkfdlsa';

      respond(data);

      fn('foo').then(function () {
        done('should throw');
      }, function () {
        done();
      });
    });
  });

  describe('saveForHTML', function () {
    var fn = lib[this.title];

    createUriBlockTests(fn);

    it('returns data with schema', function () {
      respond('<div>ok</div>');

      return fn('foo').then(function (data) {
        expect(data.getAttribute('data-uri')).to.deep.equal('foo');
      });
    });

    it('throws on bad data', function (done) {
      respond(new Error('bad data'));

      fn('foo').then(function () {
        done('should throw');
      }, function () {
        done();
      });
    });
  });

  describe('create', function () {
    var fn = lib[this.title];

    createUriBlockTests(fn);

    it('returns data with schema', function () {
      respond('{}');

      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({});
      });
    });

    it('throws on bad data', function (done) {
      var data = 'jkfdlsa';

      respond(data);

      fn('foo').then(function () {
        done('should throw');
      }, function () {
        done();
      });
    });
  });

  describe('remove', function () {
    var fn = lib[this.title];

    createUriBlockTests(fn);

    it('returns data with schema', function () {
      respond('{}');

      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({});
      });
    });

    it('throws on bad data', function (done) {
      var data = 'jkfdlsa';

      respond(data);

      fn('foo').then(function () {
        done('should throw');
      }, function () {
        done();
      });
    });
  });

  describe('isUri', function () {
    var fn = lib[this.title];

    it('returns true when uri', function () {
      expect(fn('domain/path')).to.equal(true);
    });

    it('returns false when not a uri', function () {
      expect(fn('//domain/path')).to.equal(false);
    });

    it('returns false when not a uri', function () {
      expect(fn('domain:3333/path')).to.equal(false);
    });
  });

  describe('isUrl', function () {
    var fn = lib[this.title];

    it('returns true when url has protocol and domain and path', function () {
      expect(fn('http://domain.com/some-path/')).to.equal(true);
    });

    it('returns true when url has protocol and domain', function () {
      expect(fn('http://domain.com/')).to.equal(true);
    });

    it('returns false when not a url', function () {
      expect(fn('')).to.equal(false);
    });

    it('returns false when not a url', function () {
      expect(fn('domain/path')).to.equal(false);
    });
  });

  describe('urlToUri', function () {
    var fn = lib[this.title];

    it('throws if not a valid url', function () {
      function result() {
        return fn('domain.com/some-path');
      }

      expect(result).to.throw(TypeError);
    });

    it('removes port and protocol', function () {
      expect(fn('http://domain.com:3001/some-path')).to.equal('domain.com/some-path');
    });
  });
});
