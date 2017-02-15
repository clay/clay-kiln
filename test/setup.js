const testsContext = require.context('../', true, /^\.\/(lib|behaviors)\/.*?\.test\.js$/);

// don't write to console
sinon.stub(console);

// run all tests
testsContext.keys().forEach(testsContext);
