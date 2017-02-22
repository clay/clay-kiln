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

    white-space: normal;
  }

  // quill overrides
  .ql-editor {
    padding: 0;
  }
</style>

<template>
  <div class="wysiwyg-input" :class="{ styled: isStyled }" :html="data"></div>
</template>

<script>
  import Quill from 'quill';
  import _ from 'lodash';

  const Delta = Quill.import('delta'),
    Clipboard = Quill.import('modules/clipboard');

    /**
   * split innerHTML into paragraphs based on closing <p>/<div> and line breaks
   * trim the resulting strings to get rid of any extraneous whitespace
   * @param {string} str
   * @returns {array}
   */
  function splitParagraphs(str) {
    // unescape manually-written tags
    let cleanStr = str.replace(/&lt;(.*?)&gt;/ig, '<$1>'),
      paragraphs;

    // </p>, </div>, </h1> through </h9>, or two (interchangeable) <br> or newlines
    // note: <br> tags may contain closing slashes, and there may be spaces around stuff
    // note: split on both </blockquote> and <blockquote>, since there may be text before/after the quote
    paragraphs = _.map(cleanStr.split(/(?:<\/(?:p|div|h[1-9])>|(?:\s?<br(?:\s?\/)?>\s?|\s?\n\s?){2})/ig), s => s.trim());

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
   * clean elements from strings
   * @param  {string} str
   * @return {string}
   */
  function cleanElements(str) {
    let cleanStr;

    // remove span, meta, script, style, object, iframe, and table tags
    cleanStr = str.replace(/<\/?(?:span|meta|script|style|object|iframe|table).*?>/ig, '');
    // remove extraneous opening <p>, <div>, and <br> tags
    // note: some google docs pastes might have `<p><br>`
    cleanStr = cleanStr.replace(/^\s?<(?:p><br|p|div|br)(?:.*?)>\s?/ig, '');
    // remove any other <p> or <div> tags, because you cannot put block-level tags inside paragraphs
    cleanStr = cleanStr.replace(/<(?:p|div).*?>/ig, '');
    return cleanStr;
  }

  /**
   * remove non-whitelisted attributes from string
   * @param  {string} str
   * @return {string}
   */
  function cleanAttributes(str) {
    let cleanStr;

    // remove any attributes that aren't href
    cleanStr = str.replace(/<(\S+)(\shref=".*?")?.*?>/ig, '<$1$2>');

    return cleanStr;
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
    // decode SPECIFIC html entities (not all of them, as that's a security hole)
    cleanStr = cleanStr.replace(/&amp;/ig, '&');
    cleanStr = cleanStr.replace(/&nbsp;/ig, ' ');
    cleanStr = cleanStr.replace(/&ldquo;/ig, '“');
    cleanStr = cleanStr.replace(/&rdguo;/ig, '”');
    cleanStr = cleanStr.replace(/&lsquo;/ig, '‘');
    cleanStr = cleanStr.replace(/&rsquo;/ig, '’');
    cleanStr = cleanStr.replace(/&hellip;/ig, '…');
    cleanStr = cleanStr.replace(/&mdash;/ig, '—');
    cleanStr = cleanStr.replace(/'&ndash;'/ig, '–');
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

      console.log('\n\nCLEANING STRING', str)
      cleanStr = cleanElements(str);
      console.log('elements:', cleanStr)
      cleanStr = cleanAttributes(cleanStr);
      console.log('attrs:', cleanStr)
      cleanStr = cleanCharacters(cleanStr);
      console.log('chars:', cleanStr)

      // FINALLY, trim the string to catch any of the stuff we converted to spaces above
      cleanStr = cleanStr.trim();

      console.log('\nclean:', cleanStr)

      matchedRule = _.find(rules, function matchRule(rule) {
        return rule.match.exec(cleanStr);
      });

      if (!matchedRule) {
        progress.open('error', `Error pasting text: No rule found for "${_.truncate(cleanStr, { length: 40, omission: '…' })}"`);
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
   * generate paste rules
   * @param  {array} pasteRules
   * @throw {Error} if rule doesn't have a `match` property
   * @throw {Error} if rule.match isn't parseable as regex
   * @return {array}
   */
  function generatePasteRules(pasteRules) {
    return _.map(pasteRules, function (rawRule) {
      const pre = '^',
        post = '\\n?$';

      let rule = _.assign({}, rawRule); // don't mutate the raw rule

      // regex rule assumptions
      // 1. match FULL STRINGS (not partials), e.g. wrap rule in ^ and $
      if (!rule.match) {
        throw new Error('Paste rule needs regex! ', rule);
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
   * completely remove element when pasting
   * @return {object} empty delta
   */
  function removeElement() {
    return new Delta();
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
        formats = _.flatten(_.filter(buttons, (button) => button !== 'clean')).concat(['header', 'blockquote']);

      let editor;

      class ClayClipboard extends Clipboard {
        convert(html) {
          let delta = new Delta();

          if (_.isString(html)) {
            this.container.innerHTML = html;
          }
          console.log('html', html)
          console.log('container', this.container.innerHTML)

          console.log('\nsplit', matchComponents(splitParagraphs(this.container.innerHTML), rules).map((m) => m.component))

          this.container.innerHTML = '';
          return delta
        }
      }

      Quill.register('modules/clipboard', ClayClipboard, true); // need to do this before creating the editor

      editor = new Quill(this.$el, {
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
                    console.log('close form');
                  } else if (isMultiComponent && context.collapsed && context.offset === 0) {
                    // if the caret is at the beginning of a new line, create a new component (sending the text after the caret to the new component)
                    console.log(`create new component with "${renderDeltas(this.quill.getContents(range.index))}"`) // text after caret, as html string
                    this.quill.deleteText(range.index, this.quill.getLength() - range.index); // remove text after caret
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
                    // we're at the start of the field (and don't have stuff highlighted),
                    // so merge the text after the caret with the previous component
                    console.log(`append to previous component: "${renderDeltas(this.quill.getContents(range.index))}"`)
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
              }
            }
          },
          clipboard: {
            matchers: [
              // completely remove certain elements
              ['META', removeElement],
              ['SCRIPT', removeElement],
              ['STYLE', removeElement],
              ['OBJECT', removeElement],
              ['IFRAME', removeElement],
              ['TABLE', removeElement],
              // [Node.ELEMENT_NODE, splitParagraphs(rules)]
            ]
          }
        }
      });

      editor.on('text-change', (delta, oldDelta, source) => {
        console.log(`\n[EDITOR] text change! "${editor.root.innerHTML}"`)
      });
    },
    slot: 'main'
  };
</script>
