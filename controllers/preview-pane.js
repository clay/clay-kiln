const dom = require('@nymag/dom'),
  previewSizes = {
    small: { w: 375, h: 660 },
    medium: { w: 768, h: 1024 },
    large: { w: 1024, h: 768 }
  };

import _ from 'lodash';

module.exports = function () {
  function Constructor(el) {
    // share elements
    this.link = dom.find(el, '.share-input');
    this.button = dom.find(el, '.share-copy');
  }

  Constructor.prototype = {
    events: {
      '.preview-link click': 'onPreview',
      '.share-copy click': 'onCopy',
    },

    onPreview: function (e) {
      var link = e.currentTarget,
        url = link.getAttribute('href'),
        size = _.find(Object.keys(previewSizes), (s) => link.classList.contains(s));

      e.preventDefault();
      window.open(url, `Preview${size}`, `resizable=yes,scrollbars=yes,width=${previewSizes[size].w},height=${previewSizes[size].h}`);
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
