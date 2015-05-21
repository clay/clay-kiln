'use strict';
var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references');

function send(options) {
  return new Promise(function (resolve, reject) {
    if (_.isString(options)) {
      options = {
        method: 'GET',
        url: options
      };
    }

    var request = new XMLHttpRequest();

    request.open(options.method, options.url, true);

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
 * Translate the response into what we expect
 * @returns {{}}
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
  return function (error, target) {
    if (error) {
      throw error;
    } else {
      var result, parent,
        statusCodeGroup = target.status.toString()[0];

      if (statusCodeGroup === '2') {
        parent = document.createElement('div');
        parent.innerHTML = target.responseText;
        result = dom.getFirstChildElement(parent);
        result.setAttribute(references.referenceAttribute, ref);
        return result;
      } else {
        return target;
      }
    }
  };
}

module.exports = {
  getSchemaFromReference: function (ref) {
    return send('/components/' + references.getComponentNameFromReference(ref) + '/schema')
      .then(expectJSONResult);
  },

  getComponentJSONFromReference: function (ref) {
    return send(ref).then(expectJSONResult);
  },

  getComponentHTMLFromReference: function (ref) {
    return send(ref + '.html').then(expectHTMLResult(ref));
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

  // for testing
  send: send
};