const _ = require('lodash'),
  moment = require('moment'),
  edit = require('./edit'),
  db = require('./edit/db'),
  dom = require('./dom'),
  progress = require('./progress');


/**
 * see if a page is scheduled to publish
 * @param {string} scheduledUri e.g. domain.com/pages/pageid@scheduled
 * @returns {Promise}
 */
function getScheduled(scheduledUri) {
  // note: no caching here
  return db.get(scheduledUri).then(function (data) {
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

  return db.getHead(db.urlToUri(url)).then(function (res) {
    if (res) {
      return url;
    } else {
      throw new Error('Url isn\'t a real page!');
    }
  });
}

function isArticleReference(ref) {
  return _.isString(ref) && ref.indexOf('/components/article/instances/') > -1;
}

/**
 * Gets the first reference to an article component within a page (if it exists)
 * @param {object} page
 * @returns {string|undefined}
 */
function getArticleReference(page) {
  for (let key in page) {
    if (page.hasOwnProperty(key)) {
      let value = page[key];

      if (isArticleReference(value)) {
        return value;
      } else if (_.isObject(value))  {
        let result = _.isArray(value) ? _.find(value, isArticleReference) : getArticleReference(value);

        if (result) {
          return result;
        }
      }
    }
  }
}

/**
 * get article date
 * @param {object} pageData
 * @returns {Promise} date
 */
function getArticleDate(pageData) {
  var article = getArticleReference(pageData);

  if (!article) {
    throw new Error('No article in page!');
  }

  return edit.getDataOnly(article).then(res => res.date);
}

/**
 * get published state
 * @param {string} publishedUri
 * @returns {Promise}
 */
function getPublished(publishedUri) {
  return edit.getDataOnly(publishedUri)
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
      // no url, or the page can't be loaded, or the article has no date
      // or something else went wrong somewhere!
      return {
        published: false,
        publishedUrl: null,
        publishedAt: null
      };
    });
}

/**
 * get scheduled/published state of the page
 * used when toolbar inits and when publish pane is opened
 * @returns {Promise}
 */
function getPageState() {
  var pageUri = dom.pageUri();

  return Promise.all([
    getScheduled(pageUri + '@scheduled'),
    getPublished(pageUri + '@published')
  ]).then(function (promises) {
    return _.assign({}, promises[0], promises[1]);
  });
}

/**
 * update publish button when scheduled
 * @param {boolean} isScheduled
 */
function toggleScheduled(isScheduled) {
  var el = document.querySelector('.kiln-toolbar-inner .publish'),
    scheduledClass = 'scheduled';

  if (isScheduled) {
    el.classList.add(scheduledClass);
  } else {
    el.classList.remove(scheduledClass);
  }
}

/**
 * format timestamps in the past and future
 * @param {number} timestamp (unix timestamp)
 * @returns {string}
 */
function formatTime(timestamp) {
  var datetime = moment(timestamp);

  return datetime.calendar();
}

/**
 * do something at a certain time in the future
 * note: this is used to switch scheduled posts to published status message
 * if the user is on the page while it's published
 * @param {function} fn
 * @param {Moment} date (any date that can be parsed with moment)
 */
function timeout(fn, date) {
  var future = moment(date),
    offset = future.diff(moment()).valueOf();

  window.setTimeout(fn, offset);
}

// convenience method for dynamic schedule message
function openDynamicSchedule(time, url) {
  // open a schedule status message
  progress.open('schedule', `Scheduled to publish ${formatTime(time)}`);
  toggleScheduled(true);
  // set it to dynamically change to publish if the page is still open
  // (or if a new user opens the page) when it's set to publish
  timeout(function () {
    progress.close();
    // close the schedule status, wait a beat (drawing the eye of the user), then open the published status
    // Normally, transitions between status messages happen instantaneously,
    // because they're initiated by user actions (e.g. a published page being scheduled to re-publish).
    // Because this specific transition happens without user action (rather, it's on a timeout),
    // we need to draw the user's eye and allow them to grasp what's going on
    // (without being obtrusive)
    window.setTimeout(function () {
      progress.open('publish', `Published! <a href="${url}@published.html" target="_blank">View Page</a>`);
      // and remember to untoggle the button
      toggleScheduled(false);
    }, 250);
  }, time);
}

module.exports.get = getPageState;
module.exports.toggleScheduled = toggleScheduled;
module.exports.formatTime = formatTime;
module.exports.timeout = timeout;
module.exports.openDynamicSchedule = openDynamicSchedule;
