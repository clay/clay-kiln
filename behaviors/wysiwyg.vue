<docs>
  # wysiwyg

  A multi-line text input which allows a rich editing experience. Uses [Quill](http://quilljs.com/).

  ## Arguments

  * **buttons** _(optional)_  array of button names (strings) or groups (arrays) for text styling, passed directly into Quill (defaults to "remove formatting")
  * **styled** _(optional)_   style the content editable element like our `text` and `textarea` inputs.
  * **type** _(optional)_ `single-line`, `multi-line`, or `multi-component`. (defaults to `single-line`)
  * **pseudoBullet** _(optional)_ boolean to enable <kbd>tab</kbd> to create pseudo bullet points
  * **paste** _(optional)_ array of paste rules for parsing pasted content and creating new components

  The buttons allowed in our wysiwyg behavior are [defined in Quill's documentation](http://quilljs.com/docs/modules/toolbar/)

  By default, wysiwyg fields will use the styles of the containing component. To use our kiln input styling, set `styled` to `true`.

  The default `type` -- `single-line` -- allows entering one line of rich text, but prevents users from creating new paragraphs or applying paste rules.

  `multi-line` is used for components like blockquotes or lists, and allows paste rules to create new block-level elements in the same component's field (but not create different components).

  `multi-component` enables more affordances, including:

  * keyboard navigation across components (up and down arrows)
  * <kbd>enter</kbd> creating new components (and splitting text in front of the cursor into them)
  * <kbd>delete</kbd> removing components (and merging text in front of the cursor into the previous component)
  * full paste rule affordances, including creating different components

  **Paste** is an optional array of pasting rules that's used for parsing and creating different components. This is useful for transforming pasted links into embeds, catching pasted blockquotes, etc. Rules have these properties:

  * `match` - regex to match the pasted content. all rules will be wrapped in `^` and `$` (so they don't match urls _inside_ links in the content)
  * `matchLink` - boolean to determine whether _links_ containing the regex should also match. Should be true for embeds, false for components that could potentially contain links inside them.
  * `component` - the name of the component that should be created
  * `field` - the name of the field that the captured data should be populated to on the new component. the (last) new component will focus this field after it's added (note: this is limited to a single regex capture group)
  * `group` - (optional) the group that should be focused when the (last) new component is added (instead of the specific field). this is useful for components with forms that contain both the specified field and other things, and preserves the same editing experience as editing that component normally

  ## Example

  ```
  text:
    _placeholder:
      height: 50px
      text: New Paragraph
      required: true
    _display: inline
    _has:
      -
        fn: wysiwyg
        type: 'multi-component'
        pseudoBullet: true
        styled: false
        buttons:
          - bold
          - italic
          - strikethrough
          - link
        paste:
          -
            match: (https?://twitter\.com/\w+?/status/\d+)
            matchLink: true
            component: clay-tweet
            field: url
          -
            match: (https?://www\.facebook\.com/.+?/posts/\d+)
            matchLink: true
            component: clay-facebook-post
            field: url
            group: inlineForm
          -
            match: <blockquote>(.*?)(?:</blockquote>)?
            component: blockquote
            field: text
          -
            match: (.*)
            component: clay-paragraph
            field: text
  ```
</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/inputs';
  @import '~quill/dist/quill.core.css';
  @import '~quill/dist/quill.bubble.css';

  .wysiwyg-input {
    @include normal-text();

    cursor: text;
    min-height: 19px;
    outline: none;
    text-align: left;
    white-space: normal;

    &::selection {
      background-color: $text-selection;
    }
  }

  .wysiwyg-input *::selection {
    background-color: $text-selection;
  }

  .wysiwyg-input.styled {
    @include input();

    padding: 13.5px 10px; // align to buttons
    white-space: normal;
  }

  // quill overrides
  .ql-editor {
    padding: 0;
  }
</style>

<template>
  <div class="wysiwyg-input" :class="{ styled: isStyled }"></div>
</template>

<script>
  import Quill from 'quill';
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import sanitize from 'sanitize-html';
  import striptags from 'striptags';
  import store from '../lib/core-data/store';
  import { getComponentName, refAttr, editAttr } from '../lib/utils/references';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { getPrevComponent, getNextComponent, getParentComponent, getComponentEl } from '../lib/utils/component-elements';
  import { isFirstField } from '../lib/forms/field-helpers';

  const Delta = Quill.import('delta'),
    Clipboard = Quill.import('modules/clipboard'),
    allowedInlineTags = ['strong', 'em', 'a', 'br', 'strike', 'p'], // note: p gets parsed out in sanitizeInlineHTML
    allowedBlockTags = allowedInlineTags.concat(['h1', 'h2', 'h3', 'h4', 'blockquote']),
    allowedAttributes = {
      a: ['href']
    },
    transformTags = {
      div: sanitize.simpleTransform('p'),
      b: sanitize.simpleTransform('strong'),
      i: sanitize.simpleTransform('em'),
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
        } else {
          // spans will be cleaned up later, since they're
          // not allowed in the sanitized output
          return { tagName, attribs };
        }
      }
    },
    parser = {
      decodeEntities: true,
      lowerCaseTags: true
    };

  // store references for multi-paragraph paste here.
  // this way, the paste function can set these, and they can be checked
  // AFTER the generated deltas have been pasted in.
  let firstComponentToUpdate, otherComponentsToUpdate;

  /**
   * unescape manually-written tags before running through sanitizer
   * @param  {string} str
   * @return {string}
   */
  function unescape(str) {
    return str.replace(/&lt;(.*?)&gt;/ig, '<$1>');
  }

  /**
   * sanitize inline html
   * then convert <p> into <br />
   * note: removes any block-level tags
   * @param  {string} str
   * @return {string}
   */
  function sanitizeInlineHTML(str) {
    const sanitized = sanitize(unescape(str), {
      allowedTags: allowedInlineTags,
      allowedAttributes,
      transformTags,
      parser
    });

    return sanitized.split('</p>')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        return line.replace('<p>', '');
      }).join('<br />');
  };

  /**
   * sanitize block html
   * note: allows block-level tags
   * @param  {string} str
   * @return {string}
   */
  function sanitizeBlockHTML(str) {
    return sanitize(unescape(str), {
      allowedTags: allowedBlockTags,
      allowedAttributes,
      transformTags,
      parser
    });
  };

    /**
   * split innerHTML into paragraphs based on closing <p>/<div> and line breaks
   * trim the resulting strings to get rid of any extraneous whitespace
   * @param {string} str
   * @returns {array}
   */
  function splitParagraphs(str) {
    // </p>, </div>, </h1> through </h9>, or two (interchangeable) <br> or newlines
    // note: <br> tags may contain closing slashes, and there may be spaces around stuff
    // note: split on both </blockquote> and <blockquote>, since there may be text before/after the quote
    let paragraphs = _.map(str.split(/(?:<\/(?:p|div|h[1-9])>|(?:\s?<br(?:\s?\/)?>\s?|\s?\n\s?){2})/ig), s => s.trim());

    // splitting on the closing p/div/header allows us to grab ALL the paragraphs from
    // google docs, since when you paste from there the last paragraph
    // isn't wrapped in a <p> tag. weird, right?
    // splitting on closing <div> tags allows us to support some weird
    // google docs situations (lots of line breaks with embedded media),
    // as well as "plaintext" editors like IA Writer
    // splitting on double line breaks/<br> tags allows us to catch a few edge cases in other editors

    // handle inline blockquotes (and, in the future, other inline things)
    // that should be parsed out as separate components
    return _.reduce(paragraphs, function (result, graf) {
      if (_.includes(graf, '<blockquote') || _.includes(graf, '</blockquote')) {
        let start = graf.indexOf('<blockquote'),
          end = graf.indexOf('</blockquote>') + 13, // length of that closing tag
          before = graf.substring(0, start),
          quote = graf.substring(start, end),
          after = graf.substring(end);

        result.push(before);
        result.push(quote); // pass this through so it gets picked up by rules
        result.push(after);
      } else {
        result.push(graf);
      }
      return result;
    }, []);
  }

  /**
   * clean characters from string
   * @param  {string} str
   * @return {string}
   */
  function cleanCharacters(str) {
    let cleanStr;

    // remove 'line separator' and 'paragraph separator' characters
    // (not visible in text editors, but get added when pasting from pdfs and old systems)
    cleanStr = str.replace(/(\u2028|\u2029)/g, '');
    // convert tab characters to spaces (pdfs looooove tab characters)
    cleanStr = cleanStr.replace(/(?:\t|\\t)/g, ' ');
    // assume newlines that AREN'T between a period and a capital letter (or number) are errors
    // note: this fixes issues when pasting from pdfs or other sources that automatically
    // insert newlines at arbitrary places
    cleanStr = cleanStr.replace(/\.\n[A-Z0-9]/g, '<br>');
    cleanStr = cleanStr.replace(/\n/g, ' ');
    return cleanStr;
  }

  /**
   * match components from strings of random pasted input
   * note: paragraphs (and other components with rules that specify sanitization)
   * will have their values returned as text models instead of strings
   * @param  {array} strings
   * @param {array} rules chain of responsibility for paste rules
   * @returns {array}
   */
  function matchComponents(strings, rules) {
    return _.filter(_.map(strings, function (str) {
      let cleanStr, matchedRule, matchedObj, matchedValue;

      // do some more post-splitting sanitization:

      // remove extraneous opening <p>, <div>, and <br> tags
      // note: some google docs pastes might have `<p><br>`
      cleanStr = str.replace(/^\s?<(?:p><br|p|div|br)(?:.*?)>\s?/ig, '');
      // remove any other <p> or <div> tags, because you cannot put block-level tags inside paragraphs
      cleanStr = cleanStr.replace(/<(?:p|div).*?>/ig, '');
      // remove other characters
      cleanStr = cleanCharacters(cleanStr);
      // FINALLY, trim the string to catch any of the stuff we converted to spaces above
      cleanStr = cleanStr.trim();

      matchedRule = _.find(rules, function matchRule(rule) {
        return rule.match.exec(cleanStr);
      });

      if (!matchedRule) {
        store.dispatch('showStatus', { type: 'error', message: `Error pasting text: No rule found for "${_.truncate(cleanStr, { length: 40, omission: '…' })}"`});
        throw new Error('No matching paste rule for ' + cleanStr);
      }

      // grab stuff from matched rule, incl. component, field, sanitize
      matchedObj = _.assign({}, matchedRule);

      // find actual matched value for component
      // note: rules need to grab _some value_ from the string
      matchedValue = matchedRule.match.exec(cleanStr)[1];

      // finally, add the potentially-sanitized value into the matched obj
      matchedObj.value = matchedValue;

      return matchedObj;
    }), function filterMatches(component) {
      var val = component.value;

      // filter out any components that are blank (filled with empty spaces)
      // this happens a lot when paragraphs really only contain <p> tags, <div>s, or extra spaces
      // we filter AFTER generating text models because the generation gets rid of tags that paragraphs can't handle

      // return true if the string contains words (anything that isn't whitespace, but not just a single closing tag),
      // or if it's a text-model that contains words (anything that isn't whitespace, but not just a single closing tag)
      return _.isString(val) && val.match(/\S/) && !val.match(/^<\/.*?>$/);
    });
  }

  /**
   * handle multi-paragraph paste
   * @param  {array} components      of matched components
   * @param  {object} quill
   * @param  {object} current
   * @param  {array} elementMatchers
   * @param  {array} textMatchers
   * @return {object}                 delta of changes to current component, saved automatically
   */
  function handleMultiParagraphPaste(components, { quill, current, elementMatchers, textMatchers }) {
    const firstComponent = _.head(components),
      otherComponents = _.tail(components);

    let delta;

    if (_.isEmpty(components)) {
      // after sanitizing, there's nothing to paste! cool. (⌐■_■)
      return new Delta();
    }

    if (firstComponent.component === current.component) {
      // paste this text into the current component
      delta = generateDeltas(firstComponent.value, elementMatchers, textMatchers);
      firstComponentToUpdate = null;
      otherComponentsToUpdate = otherComponents;
    } else if (quill.getLength() === 1) {
      // there's no text in the current component, so replace it with the pasted component
      firstComponentToUpdate = firstComponent;
      otherComponentsToUpdate = otherComponents;
      delta = new Delta().insert(' '); // add a single space, to trigger text-update so we can replace the current component
    }

    return delta;
  }

  /**
   * generate paste rules
   * @param  {array} pasteRules
   * @throw {Error} if rule doesn't have a `match` property
   * @throw {Error} if rule.match isn't parseable as regex
   * @return {array}
   */
  function generatePasteRules(pasteRules) {
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
        console.error(e);
        throw e;
      }

      return rule;
    });
  }

  /**
   * parse out paragraphs into line breaks,
   * then remove extraneous opening/closing tags and other line breaks
   * @param  {string} html
   * @return {string}
   */
  function removeParagraphs(html) {
    return html.replace(/<\/p><p>/ig, '<br />').replace(/<\/?p>/ig, '').replace(/<br>/ig, '');
  }

  /**
   * render deltas as html string
   * @param  {object} deltas
   * @return {string}
   */
  function renderDeltas(deltas) {
    const temp = document.createElement('div'),
      tempQuill = new Quill(temp);

    tempQuill.setContents(deltas);
    return removeParagraphs(tempQuill.root.innerHTML);
  }

  /**
   * traverse nodes, calling matchers
   * @param  {Node} node
   * @param  {array} elementMatchers
   * @param  {array} textMatchers
   * @return {object}
   */
  function traverse(node, elementMatchers, textMatchers) {  // Post-order
    if (node.nodeType === node.TEXT_NODE) {
      // run text matchers for node
      return _.reduce(textMatchers, (delta, matcher) => matcher(node, delta), new Delta());
    } else if (node.nodeType === node.ELEMENT_NODE) {
      let children = node.childNodes || [];

      return _.reduce(children, (delta, childNode) => {
        let childDelta = traverse(childNode, elementMatchers, textMatchers),
          childMatchers = childNode['__ql-matcher'] || [];

        // run element matchers for child node
        if (childNode.nodeType === childNode.ELEMENT_NODE) {
          childDelta = _.reduce(elementMatchers, (childDelta, matcher) => matcher(childNode, childDelta), childDelta);
          childDelta = _.reduce(childMatchers, (childDelta, matcher) => matcher(childNode, childDelta), childDelta);
        }
        return delta.concat(childDelta);
      }, new Delta());
    } else {
      return new Delta();
    }
  }

  /**
   * generate deltas from html
   * note: this is the opposite of renderDeltas
   * @param  {string} html
   * @param {array} elementMatchers
   * @param {array} textMatchers
   * @return {object}
   */
  function generateDeltas(html, elementMatchers, textMatchers) {
    const temp = document.createElement('div');

    temp.innerHTML = html;
    return traverse(temp, elementMatchers, textMatchers);
  }

  /**
   * determine if a delta ends with certain text
   * note: pulled from quill/modules/clipboard
   * @param  {object} delta
   * @param  {string} text
   * @return {boolean}
   */
  function deltaEndsWith(delta, text) {
    let endText = '',
      i = delta.ops.length - 1;

    for (; i >= 0 && endText.length < text.length; --i) {
      let op  = delta.ops[i];

      if (typeof op.insert !== 'string') {
        break;
      } else {
        endText = op.insert + endText;
      }
    }
    return endText.slice(-1 * text.length) === text;
  }

  /**
   * match line breaks
   * @param  {Node} node
   * @param  {object} delta
   * @return {object}
   */
  function matchLineBreak(node, delta) {
    if (node.tagName === 'BR' && !deltaEndsWith(delta, '\n')) {
      delta.insert('\n');
    }
    return delta;
  }

  /**
   * insert newline between paragraphs
   * @param {Node} node
   * @param {object} delta
   * @returns {object}
   */
  function matchParagraphs(node, delta) {
    if (node.tagName === 'P' && !deltaEndsWith(delta, '\n') && node.textContent.length > 0) {
      delta.insert('\n');
    }
    return delta;
  }

  /**
   * get the number of newlines before the caret,
   * so we can accurately set the caret offset when clicking into multiline wysiwyg fields
   * @param  {string} data
   * @param  {number} offset
   * @return {number}
   */
  function getNewlinesBeforeCaret(data, offset) {
    const text = (data || '').replace(/(<\/p><p>|<br \/>)/ig, '\u00B6'), // convert to ¶ so we have something to count
      plainText = striptags(text);

    let i = 0,
      realOffset = offset;

    // go through each character (up to the real offset),
    // increasing the real offset every time we hit a paragraph
    for (; i <= realOffset; i++) {
      if (plainText[i] === '\u00B6') {
        realOffset++; // also increase the temp offset, since paragraph breaks didn't count in the initial offset
      }
    }

    return realOffset;
  }

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      isStyled() {
        return this.args.styled;
      },
      isSingleLine() {
        return this.args.type === 'single-line' || !this.args.type; // single-line is the default
      },
      isMultiLine() {
        return this.args.type === 'multi-line';
      },
      isMultiComponent() {
        return this.args.type === 'multi-component';
      }
    },
    watch: {
      // we need to watch the data, in case some other behavior needs to modify it
      // e.g. magic button, drop-image, autocomplete, etc
      data(val) {
        let [elementMatchers, textMatchers] = this.editor.clipboard.prepareMatching(),
          rawHTML = this.editor.root.innerHTML,
          html;

        if (this.isSingleLine || this.isMultiComponent) {
          html = sanitizeInlineHTML(rawHTML);
        } else {
          html = sanitizeBlockHTML(rawHTML);
        }

        if (val !== html) {
          // something else is updating our data! (e.g. magic button)
          this.editor.setContents(generateDeltas(val, elementMatchers, textMatchers));
        }
      }
    },
    mounted() {
      const isSingleLine = this.isSingleLine,
        isMultiLine = this.isMultiLine,
        isMultiComponent = this.isMultiComponent,
        pseudoBullet = this.args.pseudoBullet,
        rules = generatePasteRules(this.args.paste),
        buttons = this.args.buttons.concat(['clean']),
        store = this.$store,
        name = this.name,
        el = this.$el,
        appendText = _.get(store, 'state.ui.currentForm.appendText'),
        parent = _.get(store, 'state.ui.currentForm.el') && getParentComponent(getComponentEl(_.get(store, 'state.ui.currentForm.el'))),
        formats = _.flatten(_.filter(buttons, (button) => button !== 'clean')).concat(['header', 'blockquote']),
        // some useful details about the current component, range, etc
        // to pass into handleMultiParagraphPaste()
        current = {
          component: getComponentName(_.get(store, 'state.ui.currentForm.uri')),
          uri: _.get(store, 'state.ui.currentForm.uri'),
          parentURI: parent && parent.getAttribute(refAttr),
          parentPath:  _.get(store, 'state.ui.currentForm.el') && getComponentEl(_.get(store, 'state.ui.currentForm.el')).parentNode.getAttribute(editAttr)
        };

      let editor;

      class ClayClipboard extends Clipboard {
        convert(html) {
          let [elementMatchers, textMatchers] = this.prepareMatching(),
            sanitized, delta, components;

          if (_.isString(html)) {
            this.container.innerHTML = html;
          }

          if (isSingleLine) {
            // in single-line mode, sanitize and remove paragraph tags
            sanitized = sanitizeInlineHTML(this.container.innerHTML);
            // note: the generated delta may contain formats the current editor doesn't support,
            // e.g. if there's no bold allowed, that'll be inserted as plain text
            delta = generateDeltas(sanitized, elementMatchers, textMatchers);
          } else if (isMultiLine) {
            // in multi-line mode, allow multiple paragraphs but don't run through the paste rules
            sanitized = sanitizeBlockHTML(this.container.innerHTML);
            delta = generateDeltas(sanitized, elementMatchers, textMatchers);
          } else if (isMultiComponent) {
            // in multi-component mode, split up paragraphs and run them through the paste rules.
            // asynchronously trigger component creation if they match things
            // note: this may also replace the current paragraph if the entirety of the paragraph
            // is something that matches another component
            components = matchComponents(splitParagraphs(sanitizeBlockHTML(this.container.innerHTML)), rules);
            delta = handleMultiParagraphPaste(components, {
              quill: this.quill,
              current,
              elementMatchers,
              textMatchers
            });
          }

          // Remove trailing newline
          if (deltaEndsWith(delta, '\n') && delta.ops[delta.ops.length - 1].attributes == null) {
            delta = delta.compose(new Delta().retain(delta.length() - 1).delete(1));
          }

          this.container.innerHTML = '';
          return delta;
        }
      }

      Quill.register('modules/clipboard', ClayClipboard, true); // need to do this before creating the editor

      // manually add data into element when mounting
      // note: we don't use v-html here because we don't want to update the html
      // when the form data changes (since quill is handling it)
      if (appendText) {
        el.innerHTML = this.data + appendText;
        // trigger text-change here, so the form data is updated
        store.commit(UPDATE_FORMDATA, {
          path: name,
          data: isSingleLine || isMultiComponent ? sanitizeInlineHTML(el.innerHTML) : sanitizeBlockHTML(el.innerHTML)
        });
      } else {
        el.innerHTML = this.data;
      }

      /**
       * focus on the previous component, optionally specifying an explicit element and text to append
       * @param  {number} offset
       * @param  {element} [prev]
       * @param  {string} [textAfterCaret]
       */
      function focusPreviousComponent(offset, prev, textAfterCaret) {
        prev = prev || getPrevComponent(el, current.component);

        if (prev) {
          store.dispatch('select', prev);
          // note: if you pass -1 as the offset, it will set the caret
          // at the end of the previous text
          store.dispatch('focus', {
            uri: prev.getAttribute(refAttr),
            path: name,
            el: prev,
            offset,
            appendText: textAfterCaret
          });
        }
      }

      /**
       * navigate to the previous component on ↑ or ←
       * @param  {object} range
       * @return {boolean|undefined}
       */
      function navigatePrevious(range) {
        if (isMultiComponent && range.index === 0) {
          // we're at the beginning of the field! navigate to the previous component
          focusPreviousComponent(-1);
        } else {
          // default arrow behavior for single-line and multi-line
          return true;
        }
      }

      function focusNextComponent(next, path) {
        next = next || getNextComponent(el, current.component);
        path = path || name;

        if (next) {
          store.dispatch('select', next);
          // note: since we're focusing at the beginning of the next
          // component, we don't need to pass an offset
          store.dispatch('focus', {
            uri: next.getAttribute(refAttr),
            path,
            el: next
          });
        }
      }

      /**
       * navigate to the next component on ↓ or →
       * @param  {object} range
       * @return {boolean|undefined}
       */
      function navigateNext(range) {
        if (isMultiComponent && range.index === this.quill.getLength() - 1) {
          // we're at the beginning of the field! navigate to the previous component
          focusNextComponent();
        } else {
          // default arrow behavior for single-line and multi-line
          return true;
        }
      }

      /**
       * add / replace components if we've pasted text that should generate new components
       * @return {Promise}
       */
      function updatePastedComponents() {
        const first = firstComponentToUpdate ? [firstComponentToUpdate] : [],
          components = first.concat(otherComponentsToUpdate || []),
          shouldReplace = !_.isEmpty(firstComponentToUpdate); // should the current component be replaced?

        return store.dispatch('unfocus')
          .then(() => store.dispatch('addComponents', {
            currentURI: current.uri,
            parentURI: current.parentURI,
            path: current.parentPath,
            replace: shouldReplace,
            components: _.map(components, (component) => {
              // create default data for each new component
              return {
                name: component.component,
                data: { [component.field]: sanitizeInlineHTML(component.value) }
              };
            })
          }))
          .then((newComponent) => {
            // focus on the BEGINNING of the last element (before any text we may have split into it)
            focusNextComponent(newComponent, _.last(otherComponentsToUpdate).field);
            firstComponentToUpdate = null;
            otherComponentsToUpdate = null;
          });
      }

      editor = new Quill(el, {
        theme: 'bubble',
        formats,
        modules: {
          toolbar: buttons,
          clipboard: {
            matchers: [
              [Node.ELEMENT_NODE, matchLineBreak],
              [Node.ELEMENT_NODE, matchParagraphs]
            ]
          },
          keyboard: {
            bindings: {
              enter: {
                key: 'enter',
                shiftKey: null, // don't care if shift is pressed or not
                shortKey: null, // don't care if ctrl/⌘ is pressed or not
                handler(range, context) {
                  if (isSingleLine) {
                    // single-line: never allow newlines, always just close the form
                    store.dispatch('unfocus');
                  } else if (isMultiComponent && context.collapsed && context.offset === 0) {
                    const textAfterCaret = renderDeltas(this.quill.getContents(range.index));

                    // if the caret is at the beginning of a new line, create a new component (sending the text after the caret to the new component)
                    this.quill.deleteText(range.index, this.quill.getLength() - range.index); // remove text after caret
                    return store.dispatch('unfocus').then(() => {
                      return store.dispatch('addComponents', {
                        currentURI: current.uri,
                        parentURI: current.parentURI,
                        path: current.parentPath,
                        components: [{
                          name: current.component,
                          data: { [name]: textAfterCaret }
                        }]
                      });
                    }).then((newComponent) => {
                      // focus on the BEGINNING of the new element (before any text we may have split into it)
                      focusNextComponent(newComponent);
                    });
                  } else if (isMultiComponent || isMultiLine) {
                    // multi-component: allow ONE new line before splitting into a new component
                    // multi-line: allow any number of newlines inside the current field
                    return true; // create new line
                  }
                }
              },
              backspace: {
                key: 'backspace',
                shiftKey: null,
                shortKey: null,
                handler(range, context) {
                  if (isMultiComponent && context.collapsed && range.index === 0) {
                    let prev = getPrevComponent(el, current.component),
                      textAfterCaret = renderDeltas(this.quill.getContents(range.index));

                    if (prev) {
                      // we're at the start of the field (and don't have stuff highlighted),
                      // and there's a previous component to append text to,
                      // so merge the text after the caret with the previous component
                      store.dispatch('unfocus')
                        .then(() => find(`[${refAttr}="${current.uri}"]`)) // find the (updated) component in the dom
                        .then((currentComponentEl) => store.dispatch('removeComponent', currentComponentEl))
                        .then((prevComponent) => focusPreviousComponent(-1, prevComponent, textAfterCaret));
                    } // if there isn't a previous component, don't do ANYTHING
                  } else {
                    // normal delete behavior
                    return true;
                  }
                }
              },
              tab: {
                key: 'tab',
                shiftKey: null,
                shortKey: null,
                handler(range, context) {
                  if (pseudoBullet && context.offset === 0) {
                    // if pseudoBullet is enabled and we're at the start of a line,
                    // add a bullet followed by a space
                    this.quill.insertText(range.index, '• ');
                    // then set the cursor after the space
                    this.quill.setSelection(range.index + 2);
                  } else {
                    // otherwise, do the default tab behavior
                    return true;
                  }
                }
              },
              upArrow: {
                key: 'up',
                handler: navigatePrevious
              },
              leftArrow: {
                key: 'left',
                handler: navigatePrevious
              },
              downArrow: {
                key: 'down',
                handler: navigateNext
              },
              rightArrow: {
                key: 'right',
                handler: navigateNext
              }
            }
          }
        }
      });

      this.editor = editor; // save reference to the editor

      if (isFirstField(this.$el)) {
        const offset = _.get(this, '$store.state.ui.currentForm.initialOffset');

        this.$nextTick(() => {
          if (offset === -1 && appendText) {
            // set caret near the end, but BEFORE the appended text
            editor.setSelection(editor.getLength() - sanitizeInlineHTML(appendText).length - 1);
          } else if (offset === -1) {
            // set caret at the end
            editor.setSelection(editor.getLength() - 1);
          } else {
            // if the data of this form has paragraphs, quill is inserting newlines (which count towards the offset)
            editor.setSelection(getNewlinesBeforeCaret(this.data, offset));
          }
        });
      }

      editor.on('text-change', function onTextChange() {
        let html;

        // convert / sanitize output to save
        if (isSingleLine || isMultiComponent) {
          html = sanitizeInlineHTML(editor.root.innerHTML);
        } else if (isMultiLine) {
          html = sanitizeBlockHTML(editor.root.innerHTML);
        }

        if (html === '<br />') {
          // empty fields will have a single line break
          store.commit(UPDATE_FORMDATA, { path: name, data: '' });
        } else {
          store.commit(UPDATE_FORMDATA, { path: name, data: html });
        }

        // AFTER updating the data, check to see if there are components to paste
        if (!_.isEmpty(firstComponentToUpdate) || !_.isEmpty(otherComponentsToUpdate)) {
          return updatePastedComponents(store);
        }
      });
    },
    slot: 'main'
  };
</script>
