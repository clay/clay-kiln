import _ from 'lodash';
import sanitize from 'sanitize-html';

const allowedInlineTags = ['strong', 'em', 'a', 'br', 's', 'span', 'sup', 'sub', 'p'], // note: p gets parsed out in sanitizeInlineHTML
  allowedBlockTags = allowedInlineTags.concat(['h1', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li']),
  allowedAttributes = {
    a: ['href']
  },
  allowedClasses = {
    span: [
      // whitelisted phrase classes we allow
      // note: we can convert this to a wildcard (thus allowing many more classes for phrases)
      // once https://github.com/punkave/sanitize-html/pull/84 is merged
      'kiln-phrase',
      'clay-annotated',
      'clay-designed'
    ]
  },
  transformTags = {
    div: 'p',
    b: 'strong',
    i: 'em',
    strike: 's',
    span(tagName, attribs) {
      const style = attribs.style;

      // we need to convert certain spans to <strong> / <em>,
      // since google docs uses inline styles instead of semantic tags
      if (style && _.includes(style, 'font-weight: 700')) {
        return {
          tagName: 'strong',
          attribs: {}
        };
      } else if (style && _.includes(style, 'font-style: italic')) {
        return {
          tagName: 'em',
          attribs: {}
        };
      } else if (attribs.class && _.includes(attribs.class, 'kiln-phrase')) {
        // phrases are whitelisted (and can have additional classes if they're added above)
        return { tagName, attribs };
      } else {
        // remove any other spans
        return {};
      }
    }
  },
  parser = {
    decodeEntities: true,
    lowerCaseTags: true
  };

/**
 * unescape manually-written tags before running through sanitizer
 * @param  {string} str
 * @return {string}
 */
function unescape(str) {
  return str.replace(/&lt;(.*?)&gt;/ig, '<$1>');
}

/**
 * remove line breaks at the beginning or end of text
 * @param  {string} str
 * @return {string}
 */
function trimLinebreaks(str) {
  let trimmed = str.replace(/^(<br \/><br \/>|<br \/>)/i, '');

  trimmed = trimmed.replace(/(<br \/><br \/>|<br \/>)$/i, '');

  return trimmed;
}

/**
 * sanitize inline html
 * then convert <p> into <br />
 * then trim opening and closing line breaks
 * note: removes any block-level tags
 * @param  {string} str
 * @return {string}
 */
export function sanitizeInlineHTML(str) {
  const sanitized = sanitize(unescape(str), {
    allowedTags: allowedInlineTags,
    allowedAttributes,
    allowedClasses,
    transformTags,
    parser
  });

  // all text coming out of Quill will have each line wrapped in <p>,
  // so we need to convert those to <br> line breaks
  return trimLinebreaks(sanitized.split('</p>')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace('<p>', ''))
    .join('<br />'));
};

/**
 * determine if pasted text has well-formed paragraphs
 * 'well-formed paragraphs' means the text is separated by <p> tags
 * (e.g. when pasting from a website),
 * rather than being separated by <p><br> tags
 * (e.g. when pasting from a text editor that doesn't differentiate
 * between soft linebreaks and separate paragraphs)
 * @param  {string}  str
 * @return {Boolean}
 */
function hasWellFormedParagraphs(str) {
  // malformed paragraphs will use <p><br></p> as their paragraph separator,
  // because each line will technically be a new paragraph.
  // well-formed paragraphs will just use <p>, and will use <br> by itself
  // to designate soft linebreaks
  return !_.includes(str, '<p><br /></p>');
}

/**
 * similar to sanitizeInlineHTML, but allowing block-level tags
 * since they'll be parsed out after paragraphs are split
 * @param  {string} str
 * @return {string}
 */
export function sanitizeMultiComponentHTML(str) {
  const sanitized = sanitize(unescape(str), {
    allowedTags: allowedBlockTags,
    allowedAttributes,
    allowedClasses,
    transformTags,
    parser
  });

  if (hasWellFormedParagraphs(sanitized)) {
    return trimLinebreaks(sanitized.split('</p>')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace('<p>', ''))
      .join('<br /><br />'));
  } else {
    // non-wellformed paragraphs must be split on paragraph tags,
    // and non-graf tags must have extra line breaks because google docs
    // decided to stop wrapping them in <p> tags
    let result = trimLinebreaks(sanitized.split('</p>')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace('<p>', ''))
      .join('<br />'));

    return result.replace(/<\/(blockquote|h1|h2|h3|h4)><br\s?\/>/ig, '</$1><br /><br />');
  }
}

/**
 * sanitize block html
 * note: allows block-level tags
 * @param  {string} str
 * @return {string}
 */
export function sanitizeBlockHTML(str) {
  return trimLinebreaks(sanitize(unescape(str), {
    allowedTags: allowedBlockTags,
    allowedAttributes,
    allowedClasses,
    transformTags,
    parser
  }));
};
