import _ from 'lodash';
import striptags from 'striptags';
import store from '../lib/core-data/store';
import logger from '../lib/utils/log';

const log = logger(__filename);

/**
 * determine if a paragraph contains a specified tag
 * @param  {string} tagName
 * @param  {string} graf
 * @return {boolean}
 */
function containsTag(tagName, graf) {
  return _.includes(graf, `<${tagName}`) || _.includes(graf, `</${tagName}>`);
}

/**
 * parse a specified tag, adding the text before, in, and after to a result array
 * @param  {string} tagName
 * @param  {string} graf
 * @returns {array} of items to add
 */
function parseTag(tagName, graf) {
  const start = graf.indexOf(`<${tagName}`),
    end = graf.indexOf(`</${tagName}>`) > -1 ? graf.indexOf(`</${tagName}>`) + tagName.length + 3 : graf.length, // length of closing tag
    before = graf.substring(0, start),
    mid = graf.substring(start, end),
    after = graf.substring(end);

  return _.compact([before, mid, after]);
}

/**
 * split innerHTML into paragraphs based on closing <p>/<div> and line breaks
 * trim the resulting strings to get rid of any extraneous whitespace
 * @param {string} str
 * @returns {array}
 */
export function splitParagraphs(str) {
  // because we're parsing out <p> tags, we can conclude that two <br> tags
  // means a "real" paragraph (e.g. the writer intended for this to be a paragraph break),
  // whereas a single <br> tag is intended to simply be a line break.
  let paragraphs = _.map(str.split(/<br\s?\/><br\s?\/>/ig), s => s.trim());

  // handle blocks and headers that should be parsed out as separate components
  return _.reduce(paragraphs, function (result, graf) {
    if (containsTag('blockquote', graf)) {
      result = result.concat(parseTag('blockquote', graf));
    } else if (containsTag('h1', graf)) {
      result = result.concat(parseTag('h1', graf));
    } else if (containsTag('h2', graf)) {
      result = result.concat(parseTag('h2', graf));
    } else if (containsTag('h3', graf)) {
      result = result.concat(parseTag('h3', graf));
    } else if (containsTag('h4', graf)) {
      result = result.concat(parseTag('h4', graf));
    } else {
      result = result.concat([graf]);
    }

    return result;
  }, []);
}

/**
 * clean characters from string
 * note: exported for testing
 * @param  {string} str
 * @return {string}
 */
export function cleanCharacters(str) {
  let cleanStr;

  // remove 'line separator' and 'paragraph separator' characters
  // (not visible in text editors, but get added when pasting from pdfs and old systems)
  cleanStr = str.replace(/(\u2028|\u2029)/g, '');
  // convert tab characters to spaces (pdfs looooove tab characters)
  cleanStr = cleanStr.replace(/(?:\t|\\t)/g, ' ');
  // assume newlines that AREN'T after a period are errors, while other newlines should actually be spaces
  // note: this fixes issues when pasting from pdfs or other sources that automatically
  // insert newlines at arbitrary places
  cleanStr = cleanStr.replace(/\.\n/g, '.<br />');
  cleanStr = cleanStr.replace(/\n/g, ' ');
  // trim the string to catch anything we converted to spaces above
  return cleanStr.trim();
}

/**
 * match components from strings of random pasted input
 * note: paragraphs (and other components with rules that specify sanitization)
 * will have their values returned as text models instead of strings
 * @param  {array} strings
 * @param {array} rules chain of responsibility for paste rules
 * @returns {array}
 */
export function matchComponents(strings, rules) {
  return _.filter(_.map(strings, function (str) {
    let cleanStr,
      matchedRule,
      matchedObj,
      matchedValue;

    // do some more post-splitting sanitization:
    cleanStr = cleanCharacters(str);
    // remove any opening line breaks
    cleanStr = cleanStr.replace(/^<br\s?\/?>/ig, '');
    // remove any other <p> or <div> tags, because you cannot put block-level tags inside paragraphs
    cleanStr = cleanStr.replace(/<\/?(?:p|div)>/ig, '');

    matchedRule = _.find(rules, function matchRule(rule) {
      return rule.match.exec(cleanStr);
    });

    if (!matchedRule) {
      store.dispatch('showSnackbar', `No paste rule for "${_.truncate(cleanStr, { length: 20, omission: '…' })}"`);
      throw new Error('No matching paste rule for ' + cleanStr);
    }

    // grab stuff from matched rule, incl. component and field
    matchedObj = _.assign({}, matchedRule);

    // find actual matched value for component
    // note: rules need to grab _some value_ from the string
    matchedValue = matchedRule.match.exec(cleanStr)[1];

    // finally, add the value into the matched obj
    matchedObj.value = matchedValue;

    return matchedObj;
  }), function filterMatches(component) {
    let val;

    try {
      val = striptags(component.value);
    } catch (e) {
      log.warn(`Cannot parse match: ${e.message}`, { action: 'filterMatches' });
      val = '';
    }

    // filter out any components that are blank (filled with empty spaces)
    // this happens when paragraphs really only contain <p> tags, <div>s, <br>s, or extra spaces

    // return true if the string contains text (not just tags), and isn't just whitespace
    return val.length && val.match(/\S/);
  });
}

/**
 * generate paste rules
 * note: optional arguments are only needed if generating default paste rule
 * @param  {array} pasteRules
 * @param {string} [currentComponent] name
 * @param {string} [currentField]
 * @throw {Error} if rule doesn't have a `match` property
 * @throw {Error} if rule.match isn't parseable as regex
 * @return {array}
 */
export function generatePasteRules(pasteRules, currentComponent, currentField) {
  // if no paste rules are defined for a multi-component wysiwyg,
  // new paragraphs should match the current component
  pasteRules = pasteRules || [{
    match: '(.*)',
    component: currentComponent,
    field: currentField
  }];

  return _.map(pasteRules, function (rawRule) {
    const pre = '^',
      preLink = '(?:<a(?:.*?)>)?',
      post = '$',
      postLink = '(?:</a>)?';

    let rule = _.assign({}, rawRule);

    // regex rule assumptions
    // 1. match FULL STRINGS (not partials), e.g. wrap rule in ^ and $
    if (!rule.match) {
      throw new Error('Paste rule needs regex! ', rule);
    }

    // if `rule.matchLink` is true, match rule AND a link with the rule as its text
    // this allows us to deal with urls that other text editors make into links automatically
    // (e.g. google docs creates links when you paste in urls),
    // but will only return the stuff INSIDE the link text (e.g. the url).
    // For embeds (where you want to grab the url) set matchLink to true,
    // but for components that may contain actual links set matchLink to false
    if (rule.matchLink) {
      rule.match = `${preLink}${rule.match}${postLink}`;
    }

    // create regex
    try {
      rule.match = new RegExp(`${pre}${rule.match}${post}`);
    } catch (e) {
      log.error(`Error creating regex for matching: ${e.message}`, { action: 'generatePasteRules' });
      throw e;
    }

    return rule;
  });
}
