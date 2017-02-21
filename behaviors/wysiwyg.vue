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

  const Delta = Quill.import('delta');

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

      let rule = _.assign({}, rawRule); // don't mutate the raw rule

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
   * completely remove element when pasting
   * @return {object} empty delta
   */
  function removeElement() {
    return new Delta();
  }

  /**
   * check if op is two newlines
   * @param  {object}  op
   * @return {Boolean}
   */
  function hasTwoNewlines(op) {
    return op && op.insert === '\n\n';
  }

  /**
   * check if op is newline
   * @param  {object}  op
   * @return {Boolean}
   */
  function hasOneNewline(op) {
    return op && op.insert === '\n';
  }

  /**
   * check if op and prev op are both newlines
   * @param  {array}  ops
   * @param  {object}  op
   * @return {Boolean}
   */
  function hasPrevNewline(ops, op) {
    const index = _.indexOf(ops, op);

    return hasOneNewline(op) && hasOneNewline(ops[index - 1]);
  }

  /**
   * check if op and next op are both newlines
   * @param  {array}  ops
   * @param  {object}  op
   * @return {Boolean}
   */
  function hasNextNewline(ops, op) {
    const index = _.indexOf(ops, op);

    return hasOneNewline(op) && hasOneNewline(ops[index + 1]);
  }

  /**
   * check ops for paragraph breaks
   * a paragraph break is two newlines OR two ops next to each other with single newlines
   * @param  {array}  ops
   * @return {Boolean}
   */
  function hasParagraphBreak(ops) {
    if (_.find(ops, hasTwoNewlines)) {
      return true;
    } else if (_.find(ops, hasPrevNewline.bind(null, ops))) {
      return true;
    } else if (_.find(ops, hasNextNewline.bind(null, ops))) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * split paragraphs if we encounter two newlines
   * @param  {element} node
   * @param  {object} delta
   * @return {object}
   */
  function splitParagraphs(node, delta) {
    if (hasParagraphBreak(delta.ops)) {
      console.log('!!! new paragraph!', delta, node.innerHTML)
      return new Delta();
    } else {
      console.log('same paragraph', delta)
      return delta;
    }
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
        formats = _.flatten(_.filter(buttons, (button) => button !== 'clean')),
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
                [Node.ELEMENT_NODE, splitParagraphs]
              ]
            }
          }
        });

      editor.on('text-change', (delta, oldDelta, source) => {
        if (isSingleLine || isMultiComponent) {
          let str = removeParagraphs(editor.root.innerHTML)

          console.log(`\n[EDITOR] text change! "${str}"`)
        } else {
          // update form data without parsing
          console.log(`\n[EDITOR] text change! "${editor.root.innerHTML}"`)
        }
      });
    },
    slot: 'main'
  };
</script>
