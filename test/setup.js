const testsContext = require.context('../', true, /^\.\/(behaviors|decorators|services|validators)\/.*?\.test\.js$/);

// stub global events
window.kiln = window.kiln || { trigger: function () {} };
sinon.stub(console);

// run all tests
testsContext.keys().forEach(testsContext);
