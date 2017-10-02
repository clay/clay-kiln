import _ from 'lodash';
import clayLog from 'clay-log';

clayLog.init({
  name: 'kiln',
  meta: {
    kilnVersion: process.env.KILN_VERSION, // compile-time added
    browserVersion: window.navigator.userAgent
  }
});

/**
 * log informational messages
 * @param  {function} logger
 * @returns {function}
 */
function info(logger) {
  return (message, logObj) => logger('info', message, logObj);
}

/**
 * log trace messages (with stack traces)
 * @param  {function} logger
 * @returns {function}
 */
function trace(logger) {
  return (message, logObj) => logger('trace', message, logObj);
}

/**
 * log debug messages (without stack traces)
 * @param  {function} logger
 * @returns {function}
 */
function debug(logger) {
  return (message, logObj) => logger('debug', message, logObj);
}

/**
 * log warning messages
 * @param  {function} logger
 * @returns {function}
 */
function warn(logger) {
  return (message, logObj) => logger('warn', message, logObj);
}

/**
 * log error messages
 * note: you can simply pass in an Error and it will print nicely
 * @param  {function} logger
 * @returns {function}
 */
function error(logger) {
  return (message, logObj) => {
    if (_.isString(message)) {
      logger('error', message, logObj);
    } else {
      logger('error', message); // pass in error object directly
    }
  };
}

/**
 * instantiate a logger for your file
 * note for plugin authors: when using the log service, please make use of the
 * file-specific log metadata to provide additional info when debugging, e.g.
 * plugin (plugin name), action (intended action of the code calling the logger), etc
 * @param  {string|object} [filename] or file-specific log metadata
 * @return {object}
 */
export default function (filename) {
  let logger;

  if (_.isString(filename)) {
    logger = clayLog.meta({ file: filename });
  } else if (_.isObject(filename)) {
    logger = clayLog.meta(filename);
  } else {
    logger = clayLog.meta({}); // empty object for file-specific meta, maintains the syntax for other logs
  }

  return {
    info: info(logger),
    trace: trace(logger),
    debug: debug(logger),
    warn: warn(logger),
    error: error(logger)
  };
}
