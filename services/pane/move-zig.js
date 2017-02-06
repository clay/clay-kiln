import _ from 'lodash';

const dom = require('@nymag/dom'),
  site = require('../site'),
  pane = require('./');

function takeOffEveryZig() {
  var header = '<span class="ayb-header">HOW ARE YOU GENTLEMEN <em>!!</em></span>',
    messageEl = dom.create(`
      <img class="cats-ayb" src="${site.get('assetPath')}/media/components/clay-kiln/cats.png" />
      <div class="error-message ayb">ALL YOUR BASE ARE BELONG TO US</div>
    `),
    errorsEl = dom.create(`<div class="publish-error">
      <div class="label">YOU ARE ON THE WAY TO DESTRUCTION</div>
      <div class="description ayb">YOU HAVE NO CHANCE TO SURVIVE MAKE YOUR TIME</div>
    </div>`),
    innerEl = document.createDocumentFragment();

  innerEl.appendChild(messageEl);
  innerEl.appendChild(errorsEl);

  pane.open([{header: header, content: innerEl}]);
}

module.exports = takeOffEveryZig;
_.set(window, 'kiln.services.panes.takeOffEveryZig', module.exports);
