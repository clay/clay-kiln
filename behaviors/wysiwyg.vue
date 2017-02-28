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
      background-color: $blue-25;
    }
  }

  .wysiwyg-input *::selection {
    background-color: $blue-25;
  }

  .wysiwyg-input.styled {
    @include input();

    padding: 8.5px 10px; // align to buttons
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
  import sanitize from 'sanitize-html';
  import store from '../lib/core-data/store';
  import { getComponentName, refAttr, editAttr } from '../lib/utils/references';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { getPrevComponent, getNextComponent, getParentComponent, getComponentEl } from '../lib/utils/component-elements';
  import { isFirstField } from '../lib/forms/field-helpers';

  const Delta = Quill.import('delta'),
    Clipboard = Quill.import('modules/clipboard'),
    allowedInlineTags = ['strong', 'em', 'a', 'br', 'strike'],
    allowedBlockTags = allowedInlineTags.concat(['h1', 'h2', 'h3', 'h4', 'p', 'blockquote']),
    allowedAttributes = {
      a: ['href']
    },
    transformTags = {
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
   * note: removes any block-level tags
   * @param  {string} str
   * @return {string}
   */
  function sanitizeInlineHTML(str) {
    return sanitize(unescape(str), {
      allowedTags: allowedInlineTags,
      allowedAttributes,
      transformTags,
      parser
    });
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
      console.log('add ' + _.map(otherComponents, 'component').join(', '))
    } else if (quill.getLength() === 1) {
      // there's no text in the current component, so replace it with the pasted component
      console.log('replace with ' + firstComponent.component)
      console.log('then add ' + _.map(otherComponents, 'component').join(', '))
      delta = new Delta();
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
   * determine if the last delta insert already contains two newlines
   * @param  {object}  delta
   * @return {Boolean}
   */
  function hasNewline(delta) {
    return _.last(delta.ops) && _.includes(_.last(delta.ops).insert, '\n\n');
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

      return _.reduce(children, (delta, childNode, index) => {
        let childDelta = traverse(childNode, elementMatchers, textMatchers);

        // run element matchers for child node
        if (childNode.nodeType === childNode.ELEMENT_NODE) {
          childDelta = _.reduce(elementMatchers, (childDelta, matcher) => matcher(childNode, childDelta), childDelta);
        }

        // add newlines after paragraphs, unless we're the last paragraph (or there are already newlines)
        if (childNode.tagName === 'P' && index !== children.length - 1 && !hasNewline(delta)) {
          let newline = new Delta().insert('\n\n');

          return delta.concat(childDelta).concat(newline);
        } else {
          return delta.concat(childDelta);
        }
      }, new Delta());
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
        parent = getParentComponent(getComponentEl(_.get(store, 'state.ui.currentForm.el'))),
        formats = _.flatten(_.filter(buttons, (button) => button !== 'clean')).concat(['header', 'blockquote']),
        // some useful details about the current component, range, etc
        // to pass into handleMultiParagraphPaste()
        current = {
          component: getComponentName(_.get(store, 'state.ui.currentForm.uri')),
          uri: _.get(store, 'state.ui.currentForm.uri'),
          parentURI: parent.getAttribute(refAttr),
          parentPath: getComponentEl(_.get(store, 'state.ui.currentForm.el')).parentNode.getAttribute(editAttr)
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

          this.container.innerHTML = '';
          return delta;
        }
      }

      Quill.register('modules/clipboard', ClayClipboard, true); // need to do this before creating the editor

      // manually add data into element when mounting
      // note: we don't use v-html here because we don't want to update the html
      // when the form data changes (since quill is handling it)
      el.innerHTML = this.data;

      /**
       * navigate to the previous component on ↑ or ←
       * @param  {object} range
       * @return {boolean|undefined}
       */
      function navigatePrevious(range) {
        if (isMultiComponent && range.index === 0) {
          // we're at the beginning of the field! navigate to the previous component
          let prev = getPrevComponent(el, current.component);

          if (prev) {
            store.dispatch('select', prev);
            // note: this passes -1 as the offset, which will set the caret
            // at the end of the previous text
            store.dispatch('focus', {
              uri: prev.getAttribute(refAttr),
              path: name,
              el: prev,
              offset: -1
            });
          }
        } else {
          // default arrow behavior for single-line and multi-line
          return true;
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
          let next = getNextComponent(el, current.component);

          if (next) {
            store.dispatch('select', next);
            // note: since we're focusing at the beginning of the next
            // component, we don't need to pass an offset
            store.dispatch('focus', {
              uri: next.getAttribute(refAttr),
              path: name,
              el: next
            });
          }
        } else {
          // default arrow behavior for single-line and multi-line
          return true;
        }
      }

      editor = new Quill(el, {
        theme: 'bubble',
        formats,
        modules: {
          toolbar: buttons,
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
                    const text = renderDeltas(this.quill.getContents(range.index));

                    // if the caret is at the beginning of a new line, create a new component (sending the text after the caret to the new component)
                    this.quill.deleteText(range.index, this.quill.getLength() - range.index); // remove text after caret
                    return store.dispatch('createComponent', { name: current.component, defaultData: { [name]: text } }) // text after caret, as html string
                      .then((uri) => {
                        console.log('created', uri)
                        return store.dispatch('addComponent', {
                          currentURI: current.uri,
                          parentURI: current.parentURI,
                          path: current.parentPath,
                          uri
                        });
                      });
                    // note: removing the text kicks off the `text-change` event, so the form data is updated automatically while we create a new component
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
                    let prev = getPrevComponent(el, current.component);

                    if (prev) {
                      // we're at the start of the field (and don't have stuff highlighted),
                      // and there's a previous component to append text to,
                      // so merge the text after the caret with the previous component
                      console.log(`append to previous component: "${renderDeltas(this.quill.getContents(range.index))}"`)
                      store.dispatch('removeComponent', el);
                      // todo: actually append the text to the previous
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

      if (isFirstField(this.$el)) {
        const offset = _.get(this, '$store.state.ui.currentForm.initialOffset'),
          length = editor.getLength();

        this.$nextTick(() => {
          if (offset === -1) {
            // set caret at the end
            editor.setSelection(length - 1);
          } else {
            editor.setSelection(offset);
          }
        });
      }

      editor.on('text-change', () => {
        let html;

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
      });
    },
    slot: 'main'
  };
</script>
