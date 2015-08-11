var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  site = require('./site');

/**
 * add port and protocol to uris
 * @param  {string} uri
 * @return {string} uri with port and protocol added, if applicable
 */
function createUrl(uri) {
  return site.addProtocol(site.addPort(uri));
}

function send(options) {
  return new Promise(function (resolve, reject) {
    var request = new XMLHttpRequest();

    if (_.isString(options)) {
      options = {
        method: 'GET',
        url: createUrl(options)
      };
    }

    request.open(options.method, createUrl(options.url), true);

    _.each(options.headers, function (value, key) {
      request.setRequestHeader(key, value);
    });

    if (_.isObject(options.data)) {
      options.data = JSON.stringify(options.data);
    }

    request.send(options.data);

    request.onreadystatechange = function (e) {
      var target = e.currentTarget || e.target;

      if (target.readyState === 4) {
        try {
          resolve(target);
        } catch (err) {
          reject(err);
        }
      }
    };
  });
}

/**
 *
 * @param {Element} target
 * @returns {string|Element}
 */
function expectTextResult(target) {
  var statusCodeGroup = target.status.toString()[0];

  if (statusCodeGroup === '2') {
    return target.responseText;
  } else {
    return target;
  }
}

/**
 * Translate the response into what we expect
 * @param {Element} target
 * @returns {{}|Element}
 */
function expectJSONResult(target) {
  var statusCodeGroup = target.status.toString()[0];

  if (statusCodeGroup === '2') {
    return JSON.parse(target.responseText);
  } else {
    return target;
  }
}

/**
 * Translate the response into what we expect
 * @param {string} ref  The returned object probably won't have this because it would be referencing itself, so
 *   we need to remember it and add it.
 * @returns {function}
 */
function expectHTMLResult(ref) {
  var container, componentEl, statusCodeGroup;

  return function (target, error) {
    if (error) {
      throw error;
    } else {
      statusCodeGroup = target.status.toString()[0];
      if (statusCodeGroup === '2') {
        container = document.createElement('div');
        container.innerHTML = target.responseText;
        // The first element in a component always has the referenceAttribute.
        componentEl = dom.getFirstChildElement(container);
        componentEl.setAttribute(references.referenceAttribute, ref);
        return componentEl;
      } else {
        return target;
      }
    }
  };
}

module.exports = {
  getSchemaFromReference: function (ref) {
    return send(site.get('prefix') + '/components/' + references.getComponentNameFromReference(ref) + '/schema')
      .then(expectJSONResult);
  },

  getComponentJSONFromReference: function (ref) {
    return send(ref).then(expectJSONResult);
  },

  getTextFromReference: function (ref) {
    return send(ref).then(expectTextResult);
  },

  getComponentHTMLFromReference: function (ref) {
    var ext = '.html';

    return send(ref + ext).then(expectHTMLResult(ref));
  },

  putToReference: function (ref, data) {
    var options = {
      method: 'PUT',
      url: ref,
      data: data,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      }
    };

    return send(options);
  },

  postToReference: function (ref, data) {
    var options = {
      method: 'POST',
      url: ref,
      data: data,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      }
    };

    return send(options).then(expectJSONResult);
  },

  deleteReference: function (ref) {
    var options = {
      method: 'DELETE',
      url: ref,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      }
    };

    return send(options);
  },

  // for testing
  send: send
};
