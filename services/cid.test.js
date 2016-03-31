import cid from './cid';

describe('cid', function () {

  it('returns unique ids', function () {

    var firstId = cid(),
      secondId = cid();

    expect(firstId).to.not.equal(secondId);

  });

});
