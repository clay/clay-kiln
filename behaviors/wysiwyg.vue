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
          - strike
          - link
          -
            script: sub
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
  @import '../styleguide/typography';
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
    overflow: visible;
    padding: 0;
  }

  .ql-container.ql-bubble:not(.ql-disabled) a {
    white-space: inherit;
  }

  .ql-bubble .ql-editor a {
    text-decoration: inherit;
  }

  // link preview tooltip
  .ql-container.ql-bubble:not(.ql-disabled) a::before {
    @include kiln-copy();

    color: $tooltip-text;
    font-size: 12px;
  }

  // toolbar phrase button
  .kiln-phrase-button {
    @include normal-text();

    color: #ccc;
    font-size: 13px;
    font-weight: 700;
  }

  // all phrases should have some sort of highlight, so users can
  // reason about them in edit mode. for now, we're doing different colors
  // for different kiln phrase classes
  .ql-editor .kiln-phrase {
    background-color: #fff2a8;
  }

  .ql-editor .clay-annotated {
    background-color: #a8d1ff;
  }

  .ql-editor .clay-designed {
    background-color: #ffb7b7;
  }
</style>

<template>
  <div class="wysiwyg-input" :class="{ styled: isStyled }"></div>
</template>

<script>
  import Quill from 'quill';
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { getComponentName, refAttr, editAttr } from '../lib/utils/references';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { getPrevComponent, getNextComponent, getParentComponent, getComponentEl } from '../lib/utils/component-elements';
  import { isFirstField } from '../lib/forms/field-helpers';
  import { sanitizeInlineHTML, sanitizeMultiComponentHTML, sanitizeBlockHTML } from './wysiwyg-sanitize';
  import { splitParagraphs, matchComponents, generatePasteRules } from './wysiwyg-paste';
  import { renderDeltas, generateDeltas, deltaEndsWith, matchLineBreak, matchParagraphs } from './wysiwyg-deltas';
  import { getNewlinesBeforeCaret, getLastOffsetWithNewlines } from './wysiwyg-caret';
  import { parsePhraseButton, parseFormats, createPhraseBlots } from './wysiwyg-phrase';

  const Delta = Quill.import('delta'),
    Clipboard = Quill.import('modules/clipboard'),
    Link = Quill.import('formats/link'),
    originalLinkSanitize = Link.sanitize;

  // store references for multi-paragraph paste here.
  // this way, the paste function can set these, and they can be checked
  // AFTER the generated deltas have been pasted in.
  let firstComponentToUpdate, otherComponentsToUpdate;

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

  // add sanitization to all quill links
  Link.sanitize = (value) => {
    if (!/^https?:/.test(value) && !/^\/\//.test(value)) {
      // no protocol, add it
      value = `http://${value}`;
    }
    return originalLinkSanitize.call(Link, value);
  };

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        editorData: this.data || ''
      };
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
          this.editorData = val;
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
        rules = generatePasteRules(this.args.paste, getComponentName(_.get(this.$store, 'state.ui.currentForm.uri')), this.name),
        buttons = _.map(this.args.buttons, (button) => parsePhraseButton(button)).concat(['clean']),
        store = this.$store,
        name = this.name,
        el = this.$el,
        appendText = _.get(store, 'state.ui.currentForm.appendText'),
        parent = _.get(store, 'state.ui.currentForm.el') && getParentComponent(getComponentEl(_.get(store, 'state.ui.currentForm.el'))),
        // some useful details about the current component, range, etc
        // to pass into handleMultiParagraphPaste()
        current = {
          component: getComponentName(_.get(store, 'state.ui.currentForm.uri')),
          uri: _.get(store, 'state.ui.currentForm.uri'),
          parentURI: parent && parent.getAttribute(refAttr),
          parentPath:  _.get(store, 'state.ui.currentForm.el') && getComponentEl(_.get(store, 'state.ui.currentForm.el')).parentNode.getAttribute(editAttr)
        },
        phrases = createPhraseBlots(this.args.buttons);

      let formats = parseFormats(this.args.buttons).concat(phrases),
        editor;

      class ClayClipboard extends Clipboard {
        convert(html) {
          let [elementMatchers, textMatchers] = this.prepareMatching(),
            sanitized, delta, components;

          if (_.isString(html)) {
            this.container.innerHTML = html.replace(/\>\r?\n +\</g, '><'); // remove spaces between tags
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
            components = matchComponents(splitParagraphs(sanitizeMultiComponentHTML(this.container.innerHTML)), rules);
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

      // initialize the data
      // note: we don't use v-html here because we don't want to update the html
      // when the form data changes (since quill is handling it)
      if (appendText) {
        // then append the new text
        this.editorData += appendText;
        el.innerHTML = this.editorData;
        // update form data
        store.commit(UPDATE_FORMDATA, {
          path: name,
          data: isSingleLine || isMultiComponent ? sanitizeInlineHTML(el.innerHTML) : sanitizeBlockHTML(el.innerHTML)
        });
      } else {
        el.innerHTML = this.editorData;
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
          // fetch the previous component's element from the dom, since it may have re-rendered
          const updatedPrev = find(`[${refAttr}="${prev.getAttribute(refAttr)}"]`);

          store.dispatch('select', updatedPrev);
          // note: if you pass -1 as the offset, it will set the caret
          // at the end of the previous text
          store.dispatch('focus', {
            uri: updatedPrev.getAttribute(refAttr),
            path: name,
            el: updatedPrev,
            offset,
            appendText: textAfterCaret
          });
        }
      }

      /**
       * navigate to the previous component on ↑ or ←
       * @param  {object} range
       * @param {object} context
       * @return {boolean|undefined}
       */
      function navigatePrevious(range, context) {
        if (isMultiComponent && range.index === 0 && context.collapsed) {
          // we're at the beginning of the field (and nothing is highlighted)! navigate to the previous component
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
            focusNextComponent(newComponent, _.last(components).field);
            firstComponentToUpdate = null;
            otherComponentsToUpdate = null;
          });
      }

      editor = new Quill(el, {
        strict: false,
        theme: 'bubble',
        formats,
        modules: {
          toolbar: buttons,
          clipboard: {
            matchVisual: false, // don't add extra spacing between lines, since we handle that
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
                handler(range, context) { // eslint-disable-line
                  if (isSingleLine) {
                    // single-line: never allow newlines, always just close the form
                    store.dispatch('unfocus');
                  } else if (isMultiLine) {
                    // multi-line: allow any number of newlines inside the current field
                    return true;
                  } else if (isMultiComponent) {
                    // multi-component: allow one newline before splitting into a new component
                    // the logic can be boiled down to five points:
                    // 1. if there's a newline right before caret → create a new component
                    // 2. if there's a newline right after caret → move caret to the next line
                    // 3. if neither of those are true, create a newline
                    // 4. if any text is highlighted, delete it
                    // 5. if deleting a whole line, don't add a newline
                    const index = range.index,
                      length = range.length,
                      textBefore = this.quill.getText(0, index),
                      hasNewlineBefore = !!textBefore.match(/\n\s*?$/),
                      hasSelection = !context.collapsed,
                      textAfter = hasSelection ? this.quill.getText(index + length) : this.quill.getText(index),
                      hasNewlineInside = hasSelection && !!this.quill.getText(index, length).match(/\n/),
                      hasNewlineAfter = hasSelection ? hasNewlineInside : !!textAfter.match(/^\s*?\n./), // find newlines except the last one
                      deletingWholeLine = context.prefix === '' && context.suffix === '';

                    // delete enything the user has selected
                    if (hasNewlineInside) {
                      this.quill.deleteText(index, length);
                    } else if (hasSelection) {
                      this.quill.deleteText(index);
                    }

                    if (hasNewlineBefore) {
                      // if there's a newline before the caret, create a new component
                      const textAfterCaret = renderDeltas(this.quill.getContents(index)),
                        fieldLength = this.quill.getLength();

                      // remove the text after the caret, and create a new component with it
                      this.quill.deleteText(index, fieldLength - index);
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
                    } else if (hasNewlineAfter) {
                      // if there's a newline after the caret (or within the selection),
                      // move the caret to after the newline
                      const charsUntilNewline = hasNewlineInside ? 0 : textAfter.indexOf('\n') + 1;

                      // if the newline is inside the old selection, we just need to increase the caret position by 1,
                      // otherwise, find how many characters there are until the next newline
                      this.quill.setSelection(index + charsUntilNewline);
                    } else if (deletingWholeLine) {
                      this.quill.deleteText(index, length);
                      return false; // just delete the line, don't add a newline
                    } else {
                      // create a newline
                      return true;
                    }
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
              },
              link: {
                key: 'k',
                shortKey: true,
                handler(range, context) {
                  if (!context.collapsed && context.format.link) {
                    // we have a link highlighted, remove the link
                    this.quill.format('link', false);
                  } else if (!context.collapsed && !context.format.link) {
                    // we have regular text highlighted, make it a link!
                    let value = prompt('Enter link URL:'); // todo: how does quill init its fancy prompt?

                    this.quill.format('link', value);
                  }
                }
              }
            }
          }
        }
      });

      // add handlers for phrase buttons
      _.each(phrases, (phrase) => {
        const toolbar = editor.getModule('toolbar');

        toolbar.addHandler(phrase, function (value) {
          return this.quill.format(phrase, value); // true or false
        });
      });

      this.editor = editor; // save reference to the editor

      if (isFirstField(this.$el)) {
        const offset = _.get(this, '$store.state.ui.currentForm.initialOffset');

        this.$nextTick(() => {
          if (offset === -1 && appendText) {
            const lastOffset = editor.getLength() - getLastOffsetWithNewlines(appendText) - 1;

            // set caret near the end, but BEFORE the appended text
            editor.setSelection(lastOffset > -1 ? lastOffset : 0);
          } else if (offset === -1) {
            // set caret at the end
            editor.setSelection(editor.getLength() - 1);
          } else {
            // if the data of this form has paragraphs, quill is inserting newlines (which count towards the offset)
            editor.setSelection(getNewlinesBeforeCaret(this.editorData, offset));
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
    destroyed() {
      delete this.editor; // remove quill reference so it can be garbage collected
    },
    slot: 'main'
  };
</script>
