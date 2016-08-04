// defaults for chai
chai.config.showDiff = true;
chai.config.truncateThreshold = 0;
// stub global events
window.kiln = window.kiln || { trigger: function () {} };
sinon.stub(window.kiln, 'trigger');
