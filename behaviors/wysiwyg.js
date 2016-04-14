var _ = require('lodash'),
  select = require('selection-range'),
  MediumEditor = require('medium-editor'),
  MediumButton = require('../services/medium-button'),
  dom = require('@nymag/dom'),
  db = require('../services/edit/db'),
  render = require('../services/render'),
  focus = require('../decorators/focus'),
  references = require('../services/references'),
  edit = require('../services/edit'),
  model = require('text-model'),
  site = require('../services/site'),
  refAttr = references.referenceAttribute,
  paragraphSplitter = '¶¶';

/**
 * whan that sellection, with his ranges soote
 * the finalle node hath perced to the roote
 * @param {Node} node
 */
function selectAfter(node) {
  var range = document.createRange(),
    selection = window.getSelection();

  range.setStartAfter(node); // set the caret after this node
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  // Of the DOM, to inputte's end they wende
  // the hooly blisful caret for to seke
  // that hem hath holpen, when that they were pasted
}

/**
 * split innerHTML into paragraphs
 * @param {string} str
 * @returns {array}
 */
function splitParagraphs(str) {
  return str.split(paragraphSplitter);
}

/**
 * generate text models for paragraphs
 * @param {array} rawParagraphs
 * @returns {array}
 */
function generateTextModels(rawParagraphs) {
  return _.map(rawParagraphs, function (str) {
    // remove any unclosed / unopened <p> tags
    str = str.replace('<p>', '').replace('</p>', '');
    return model.fromElement(dom.create(str));
  });
}

/**
 * filter out any paragraphs that are blank (filled with empty spaces)
 * this happens when paragraphs really only contain <p> tags, <div>s, or extra spaces
 * we filter AFTER generating text models because the generation gets rid of
 * tags that paragraphs can't handle
 * @param  {array} paragraphs
 * @returns {array}
 */
function removeEmpties(paragraphs) {
  return _.filter(paragraphs, function (p) {
    return p.text.match(/\w/);
  });
}

/**
 * get an array of paragraph models from an innerHTML string
 * @param {string} str
 * @returns {array}
 */
function getParagraphModels(str) {
  return removeEmpties(generateTextModels(splitParagraphs(str)));
}

/**
 * toggle the tiered toolbar
 * this is the action for the tieredToolbar extension
 * @param {Element} html
 * @returns {Element}
 */
function toggleTieredToolbar(html) {
  // note: this element doesn't exist before it's instantiated, so we need to grab it afterwards
  var toolbar = dom.find('.medium-editor-toolbar'),
    toolbarClasses = toolbar.classList;

  if (toolbarClasses.contains('show-none')) {
    toolbarClasses.remove('show-none');
  } else if (toolbarClasses.contains('show-all')) {
    toolbarClasses.add('show-none');
  } else {
    toolbarClasses.add('show-all');
  }
  return html;
}

/**
 * create new medium editor
 * @param {Element} field
 * @param {array} buttons
 * @returns {Element}
 */
function createEditor(field, buttons) {
  // add "remove formatting" button to the end
  buttons.push('removeFormat');

  return new MediumEditor(field, {
    toolbar: {
      // buttons that go in the toolbar
      buttons: buttons,
      standardizeSelectionStart: true,
      allowMultiParagraphSelection: false
    },
    delay: 200, // wait a bit for the toolbar and link previews to display
    paste: {
      forcePlainText: false,
      cleanPastedHTML: true, // clean html from sources like google docs
      cleanTags: [ // remove these tags when pasting
        'meta',
        'script',
        'style',
        'img',
        'object',
        'iframe'
      ],
      preCleanReplacements: [
        [/<h[1-9]>/ig, '<h2>'],
        [/<\/h[1-9]>/ig, '</h2>'], // force all headers to the same level
        [/<p(.*?)>/ig, paragraphSplitter], // mark paragraphs for splitting
        [/<br(.*?)><br(.*?)>/ig, paragraphSplitter], // mark double line breaks for splitting
        [/<\/p>/ig, '']
      ]
    },
    anchor: {
      linkValidation: true // check for common protocols on links
    },
    autoLink: false, // create links automatically when urls are entered
    imageDragging: false, // disallow dragging inline images
    targetBlank: true,
    disableReturn: true,
    placeholder: false, // the placeholder isn't native
    extensions: {
      tieredToolbar: new MediumButton({
        label: '&hellip;',
        action: toggleTieredToolbar
      })
    }
  });
}

/**
 * get elements and data for the current component
 * @param {Element} el
 * @returns {object}
 */
function getCurrent(el) {
  var currentComponent = dom.closest(el, '[' + refAttr + ']'),
    currentComponentRef = currentComponent.getAttribute(refAttr);

  return {
    field: el.getAttribute(references.fieldAttribute),
    component: currentComponent,
    ref: currentComponentRef,
    name: references.getComponentNameFromReference(currentComponentRef)
  };
}

/**
 * get elements and data for the parent component
 * @param {Element} el of the current component
 * @returns {object}
 */
function getParent(el) {
  var parentNode = el.parentNode,
    parentComponent = dom.closest(parentNode, '[' + refAttr + ']'),
    parentComponentRef = parentComponent.getAttribute(refAttr);

  return {
    field: dom.closest(parentNode, '[' + references.editableAttribute + ']').getAttribute(references.editableAttribute),
    component: parentComponent,
    ref: parentComponentRef,
    name: references.getComponentNameFromReference(parentComponentRef)
  };
}

/**
 * get previous component in list, if any
 * @param {object} current
 * @param {object} parent
 * @returns {Promise} with {_ref: previous ref} or undefined
 */
function getPrev(current, parent) {
  return db.get(parent.ref).then(function (parentData) {
    var index = _.findIndex(parentData[parent.field], { _ref: current.ref }),
      before = _.take(parentData[parent.field], index),
      prev = _.findLast(before, function (component) {
        return references.getComponentNameFromReference(component._ref) === current.name;
      });

    if (prev) {
      return {
        field: current.field,
        component: dom.find(parent.component, '[' + refAttr + '="' + prev._ref + '"]'),
        ref: prev._ref,
        name: current.name
      };
    }
  });
}

/**
 * get the contents of a wysiwyg field
 * note: if we want to remove / parse / sanitize contents when doing operations,
 * this is the place we should do it
 * @param {Element} el
 * @returns {string}
 */
function getFieldContents(el) {
  return el.innerHTML;
}

/**
 * append text/html to previous component's field
 * @param {string} html
 * @param {object} prev
 * @returns {Promise}
 */
function appendToPrev(html, prev) {
// note: get fresh data from the server
  return edit.getData(prev.ref).then(function (prevData) {
    var prevFieldData = _.get(prevData, prev.field),
      prevFieldHTML = prevFieldData.value,
      throwawayDiv = document.createElement('div'),
      textmodel, fragment;

    // add current field's html to the end of the previous field
    prevFieldHTML += html;

    // pass the full thing through text-model to clean it and merge tags
    textmodel = model.fromElement(dom.create(prevFieldHTML));
    fragment = model.toElement(textmodel);
    throwawayDiv.appendChild(fragment);
    prevFieldData.value = throwawayDiv.innerHTML;

    return edit.savePartial(prevData);
  });
}

/**
 * remove current component from parent
 * @param {object} current
 * @param {object} parent
 * @returns {Promise} new html for the parent component
 */
function removeCurrentFromParent(current, parent) {
  return edit.removeFromParentList({el: current.component, ref: current.ref, parentField: parent.field, parentRef: parent.ref});
}

/**
 * focus on the previous component's field
 * @param {Element} el
 * @param  {object} prev
 * @param {number} textLength
 * @returns {Function}
 */
function focusPreviousComponent(el, prev, textLength) {
  return function () {
    return focus.focus(el, { ref: prev.ref, path: prev.field }).then(function (el) {
      // set caret right before the new text we added
      select(el, { start: el.textContent.length - textLength });
    });
  };
}

/**
 * remove current component, append text to previous component (of the same name)
 * @param {Element} el
 * @returns {Promise|undefined}
 */
function removeComponent(el) {
  var current = getCurrent(el),
    parent = getParent(current.component),
    textLength = el.textContent.length;

  // find the previous component, if any
  return getPrev(current, parent).then(function (prev) {
    if (prev) {
      // there's a previous component with the same name!
      // get the contents of the current field, and append them to the previous component
      return appendToPrev(getFieldContents(el), prev)
        .then(function (html) {
          return removeCurrentFromParent(current, parent)
            .then(render.reloadComponent.bind(null, prev.ref, html))
            .then(focusPreviousComponent(html, prev, textLength));
        });
    }
  });
}

/**
 * add component after current component
 * @param {Element} el
 * @param {string} [text]
 * @returns {Promise}
 */
function addComponent(el, text) {
  var current = getCurrent(el),
    parent = getParent(current.component),
    newData = {};

  // if we're passing data in, set it into the object
  if (text) {
    newData[current.field] = text;
  }

  return edit.createComponent(current.name, newData)
    .then(function (res) { // todo: when we can POST and get back html, handle it here
      var newRef = res._ref;

      return edit.addToParentList({ref: newRef, prevRef: current.ref, parentField: parent.field, parentRef: parent.ref})
        .then(function (newEl) {
          dom.insertAfter(current.component, newEl);
          return render.addComponentsHandlers(newEl)
            .then(function () {
              // focus on the same field in the new component
              focus.focus(newEl, { ref: newRef, path: current.field }).then(function () {
                return newRef;
              });
            });
        });
    });
}

/**
 * add MULTIPLE components after the current component
 * @param {Element} el
 * @param {array} components (array of text models)
 * @returns {Promise}
 */
function addComponents(el, components) {
  var current = getCurrent(el),
    parent = getParent(current.component);

  // create the new components
  return Promise.all(_.map(components, function (component) {
    var throwawayDiv = document.createElement('div'),
      fragment = model.toElement(component);

    throwawayDiv.appendChild(fragment);

    return edit.createComponent(current.name, {
      text: throwawayDiv.innerHTML
    });
  })).then(function (newComponents) {
    var newRefs = _.map(newComponents, c => c._ref);

    return edit.addMultipleToParentList({refs: newRefs, prevRef: current.ref, parentField: parent.field, parentRef: parent.ref})
      .then(focus.unfocus) // save the current component before re-rendering the parent
      .then(function (newEl) {
        return render.reloadComponent(parent.ref, newEl)
          .then(function () {
            var lastNewComponentRef = _.last(newRefs),
              lastNewComponent = dom.find('[' + refAttr + '="' + lastNewComponentRef + '"]');

            // // focus on the same field in the new component
            focus.focus(lastNewComponent, { ref: lastNewComponentRef, path: current.field }).then(function (editable) {
              selectAfter(editable.lastChild);
              return lastNewComponentRef;
            });
          });
      });
  });
}

/**
 * split text in a component, creating a new component
 * @param {Element} el
 * @param {object} caret
 * @param {object} observer used to update the current component
 * @returns {Promise}
 */
function splitComponent(el, caret, observer) {
  var textmodel = model.fromElement(dom.create(el.innerHTML.replace(/&nbsp;/g, ' '))),
    // note: we're removing any nonbreaking spaces BEFORE parsing the text
    splitText = model.split(textmodel, caret.start),
    oldText = splitText[0],
    newText = splitText[1],
    oldFragment = model.toElement(oldText),
    newFragment = model.toElement(newText),
    throwawayDiv = document.createElement('div');

  // to get the innerHTML of the document fragment,
  // we first need to append it to a throwaway div.
  // this is not awesome, but is the "best practice"
  throwawayDiv.appendChild(newFragment);

  // now that we have the split elements, put the old one back in and then create the new one
  dom.clearChildren(el); // clear the current children
  el.appendChild(oldFragment); // add the cleaned dom fragment
  observer.setValue(el.innerHTML); // update the current field
  // this is saved automatically when it's unfocused
  return addComponent(el, throwawayDiv.innerHTML);
}

/**
 * remove current component if we're at the beginning of the field
 * and there's a previous component to append it to
 * @param {Element} el
 * @param {KeyboardEvent} e
 * @returns {undefined|Promise}
 */
function handleComponentDeletion(el, e) {
  var caretPos = select(el);

  if (caretPos.start === 0 && caretPos.end === 0) {
    e.preventDefault(); // stop page reload
    return removeComponent(el);
  }
}

/**
 * create new component if we're at the end of the field
 * @param {Element} el
 * @param {object} observer
 * @returns {false|Promise}
 */
function handleComponentCreation(el, observer) {
  var caretPos = select(el); // get text after the cursor, if any

  // if there's stuff after the caret, get it
  if (caretPos.start < el.textContent.length - 1) {
    return splitComponent(el, caretPos, observer);
  } else {
    return addComponent(el);
  }
}

/**
 *
 * @param {boolean} styled
 * @returns {string}
 */
function addStyledClass(styled) {
  return styled ? ' styled' : ''; // note the preceding space!
}

/**
 * Add a bullet (for fake bulleted lists) and set the caret after it
 */
function addBullet() {
  document.execCommand('insertHTML', false, '&bull;&nbsp;');
}

/**
 * Add a line break and set the caret after it
 */
function addLineBreak() {
  document.execCommand('insertHTML', false, '<br><br>');
}

/**
 * match extension names when instantiating medium-editor
 * @param {string} extname e.g. 'italic'
 * @returns {Function}
 */
function findExtension(extname) {
  return function (ext) {
    return ext.name === extname;
  };
}

/**
 * Add binders
 * @param {boolean} enableKeyboardExtras
 * @returns {{publish: boolean, bind: Function}}
 */
function initWysiwygBinder(enableKeyboardExtras) {
  return {
    publish: true,
    bind: function (el) {
      // this is called when the binder initializes
      var toolbarButtons = el.getAttribute('data-wysiwyg-buttons').split(','),
        observer = this.observer,
        data = observer.value() || '', // don't print 'undefined' if there's no data
        editor = createEditor(el, toolbarButtons),
        italicExtension = _.find(editor.extensions, findExtension('italic')),
        strikethoughExtension = _.find(editor.extensions, findExtension('strikethrough')),
        linkExtension = _.find(editor.extensions, findExtension('anchor'));

      // apply custom styling to buttons
      if (italicExtension) {
        italicExtension.button.innerHTML = '<em>I</em>';
      }
      if (strikethoughExtension) {
        strikethoughExtension.button.innerHTML = '<s>M</s>';
      }
      if (linkExtension) {
        linkExtension.button.innerHTML = `<img src="${site.get('assetPath')}/media/components/clay-kiln/link-icon.svg" />`;
      }

      // put the initial data into the editor
      el.innerHTML = data;

      // hide the tier2 buttons when closing the toolbar
      editor.subscribe('hideToolbar', function onHideToolbar() {
        dom.find('.medium-editor-toolbar').classList.remove('show-all');
        dom.find('.medium-editor-toolbar').classList.remove('show-none');
      });

      // persist editor data to data model on input
      editor.subscribe('editableInput', function onEditableInput(e, editable) {
        if (editable) {
          // editable exists when you're typing into the field
          observer.setValue(editable.innerHTML);
        } else if (e.target) {
          // editable doesn't exist (but e.target does) when hitting enter after entering in a link
          observer.setValue(e.target.innerHTML);
        }
      });

      // persist editor data to data model on paste
      editor.subscribe('editablePaste', function onEditablePaste(e, editable) {
        var paragraphs = getParagraphModels(editable.innerHTML);

        if (paragraphs.length === 1) {
          // we're only pasting one paragraph! add it inside the current paragraph
          let fragment = model.toElement(_.first(paragraphs));

          dom.clearChildren(editable); // clear the current children
          editable.appendChild(fragment); // add the cleaned dom fragment
          observer.setValue(editable.innerHTML);

          selectAfter(editable.lastChild);
        } else if (paragraphs.length > 1) {
          let fragment = model.toElement(_.first(paragraphs));

          dom.clearChildren(editable); // clear the current children
          editable.appendChild(fragment); // add the first paragraph
          observer.setValue(editable.innerHTML); // set the value, so when we unfocus this'll be saved

          return addComponents(editable, _.rest(paragraphs));
        }
      });

      editor.subscribe('editableKeydownDelete', function onEditableKeydownDelete(e, editable) {
        if (enableKeyboardExtras) {
          handleComponentDeletion(editable, e);
        }
      });

      editor.subscribe('editableKeydownTab', function onEditableKeydownTab() {
        if (enableKeyboardExtras) {
          addBullet();
        }
      });

      editor.subscribe('editableKeydownEnter', function onEditableKeydownEnter(e, editable) {
        if (enableKeyboardExtras && e.shiftKey) {
          // shift+enter was pressed. add a line break
          addLineBreak();
        } else if (enableKeyboardExtras) {
          // enter was pressed. create a new component if certain conditions are met
          handleComponentCreation(editable, observer);
        } else {
          // close the form?
          focus.unfocus().catch(_.noop);
        }
      });
    }
  };
}

/**
 * Create WYSIWYG text editor.
 * @param {{name: string, el: Element, binders: {}}} result
 * @param {{buttons: [string], styled: boolean, enableKeyboardExtras: boolean}} args  Described in detail below:
 * @param {[string]} args.buttons  array of button names (strings) for tooltip
 * @param {boolean}  args.styled   apply input styles to contenteditable element
 * @param {boolean}  args.enableKeyboardExtras  enable creating new components on enter, and appending text to previous components on delete, etc
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    binders = result.binders,
    buttons = args.buttons,
    styled = args.styled,
    enableKeyboardExtras = args.enableKeyboardExtras,
    field = dom.create(`<label class="input-label">
      <p class="wysiwyg-input${ addStyledClass(styled) }" rv-field="${name}" rv-wysiwyg="${name}.data.value" data-wysiwyg-buttons="${buttons.join(',')}"></p>
    </label>`);

  // if more than 5 buttons, put the rest on the second tier
  if (buttons.length > 5) {
    buttons.splice(5, 0, 'tieredToolbar'); // clicking this expands the toolbar with a second tier
  }

  // add the input to the field
  result.el = field;

  // add the binder
  binders.wysiwyg = initWysiwygBinder(enableKeyboardExtras);

  return result;
};
