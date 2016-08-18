var dom = require('@nymag/dom');

module.exports = function () {
  function Constructor(el) {
    this.link = dom.find(el, '.share-input');
    this.button = dom.find(el, '.share-copy');
  }

  Constructor.prototype = {
    events: {
      '.share-copy click': 'onCopy',
    },

    onCopy: function () {
      var link = this.link,
        button = this.button,
        success;

      try {
        link.select();
        success = document.execCommand('copy');

        if (success) {
          button.classList.remove('error');
          button.classList.add('success');
        } else {
          button.classList.remove('success');
          button.classList.add('error');
        }
      } catch (e) {
        // some browsers can't do this.
        button.classList.remove('success');
        button.classList.add('error');
        console.error(e.message, e.stack);
      }
    }
  };
  return Constructor;
};
