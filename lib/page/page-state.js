import _ from 'lodash';
import { getObject, getHead } from '../core-data/api';
import { urlToUri } from '../core-data/site';
import { replaceVersion } from '../utils/references';

/**
 * see if a page is scheduled to publish
 * @param {string} scheduledUri e.g. domain.com/pages/pageid@scheduled
 * @returns {Promise}
 */
function getScheduled(scheduledUri) {
  // note: no caching here
  return getObject(scheduledUri).then(function (data) {
    return {
      scheduled: true,
      scheduledAt: data.at
    };
  }).catch(function () {
    return {
      scheduled: false,
      scheduledAt: null
    };
  });
}

/**
 * make sure page url exists
 * and points to a real, published page
 * @param {object} pageData
 * @returns {Promise} url
 */
function getPageUrl(pageData) {
  var url = pageData.url;

  if (!url || !url.length) {
    throw new Error('Page has no url!');
  }

  return getHead(urlToUri(url)).then(function (res) {
    if (res) {
      return url;
    } else {
      throw new Error('Url isn\'t a real page!');
    }
  });
}

function isArticleReference(uri) {
  return _.isString(uri) && uri.indexOf('/components/article/instances/') > -1;
}

/**
 * Gets the first reference to an article component within a page (if it exists)
 * @param {object} page
 * @returns {string|undefined}
 */
function getArticleReference(page) {
  let found;

  _.forOwn(page, (val) => {
    if (isArticleReference(val)) {
      found = val;
      return false; // exit early
    } else if (_.isObject(val))  {
      let result = _.isArray(val) ? _.find(val, isArticleReference) : getArticleReference(val);

      if (result) {
        found = result;
        return false; // exit early
      }
    }
  });

  return found;
}

/**
 * get article date, if it exists
 * @param {object} pageData
 * @returns {Promise} date
 */
function getArticleDate(pageData) {
  var article = getArticleReference(pageData);

  if (!article) {
    return null;
  } else {
    // todo: this should pull from the state
    return getObject(article).then(res => res.date);
  }
}

/**
 * get custom url, if it exists
 * @param {object} pageData
 * @returns {string|undefined}
 */
function getCustomPageUrl(pageData) {
  return pageData.customUrl || null;
}

/**
 * get published state
 * @param {string} publishedUri
 * @returns {Promise}
 */
function getPublished(publishedUri) {
  return getObject(publishedUri)
    .then(function (pageData) {
      return Promise.all([
        getPageUrl(pageData),
        getArticleDate(pageData)
      ])
      .then(function (promises) {
        return {
          published: true,
          publishedUrl: promises[0],
          publishedAt: promises[1]
        };
      });
    })
    .catch(function () {
      // no url, or the page can't be loaded
      // or something else went wrong somewhere!
      return {
        published: false,
        publishedUrl: null,
        publishedAt: null
      };
    });
}

function getLatest(uri) {
  return getObject(uri)
    .then(function (pageData) {
      return {
        customUrl: getCustomPageUrl(pageData)
      };
    });
}

/**
 * get scheduled/published state of the page
 * used when toolbar inits and when publish pane is opened
 * @param {string} pageUri
 * @returns {Promise}
 */
export default function get(pageUri) {
  return Promise.all([
    getScheduled(replaceVersion(pageUri, 'scheduled')),
    getPublished(replaceVersion(pageUri, 'published')),
    getLatest(pageUri)
  ]).then(function (promises) {
    return _.assign({}, promises[0], promises[1], promises[2]);
  });
}
