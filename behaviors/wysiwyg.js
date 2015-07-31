/*
WYSIWYG arguments

enableKeyboardExtras {boolean} enable creating new components on enter, and appending text to previous components on delete, etc
buttons {array} array of button names (strings) for tooltip
styled {boolean} apply input styles to contenteditable element
 */

var _ = require('lodash'),
  select = require('selection-range'),
  MediumEditor = require('medium-editor'),
  MediumButton = require('../services/medium-button'),
  dom = require('../services/dom'),
  db = require('../services/db'),
  render = require('../services/render'),
  focus = require('../decorators/focus'),
  references = require('../services/references'),
  edit = require('../services/edit'),
  model = require('../services/model-text'),
  refAttr = references.referenceAttribute;

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
      cleanReplacements: [
        [/<h[1-9]>/ig, '<h2>'],
        [/<\/h[1-9]>/ig, '</h2>'], // force all headers to the same level
        [/<p(.*?)>/ig, ''], // get rid of <p> tags
        [/<\/p>/ig, '']
      ]
    },
    autoLink: true, // create links automatically when urls are entered
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
  return edit.getDataOnly(parent.ref).then(function (parentData) {
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
  return db.getComponentJSONFromReference(prev.ref).then(function (prevData) {
    var prevFieldData = _.get(prevData, prev.field),
      throwawayDiv = document.createElement('div'),
      textmodel, fragment, cleanedString;

    // add current field's html to the end of the previous field
    prevFieldData += html;

    // pass the full thing through text-model to clean it and merge tags
    textmodel = model.fromElement(dom.create(prevFieldData));
    fragment = model.toElement(textmodel);
    throwawayDiv.appendChild(fragment);
    cleanedString = throwawayDiv.innerHTML;

    // then put it back into the previous component's data
    _.set(prevData, prev.field, cleanedString);
    return edit.update(prev.ref, prevData);
  });
}

/**
 * remove current component from parent
 * @param {object} current
 * @param {object} parent
 * @returns {Function}
 */
function removeCurrentFromParent(current, parent) {
  return function () {
    return edit.removeFromParentList({el: current.component, ref: current.ref, parentField: parent.field, parentRef: parent.ref});
  };
}

/**
 * focus on the previous component's field
 * @param {object} parent
 * @param  {object} prev
 * @param {number} textLength
 * @returns {Function}
 */
function focusPreviousComponent(parent, prev, textLength) {
  return function () {
    var newEl = dom.find(parent.component, '[' + references.referenceAttribute + '="' + prev.ref + '"]');

    return focus.focus(newEl, { ref: prev.ref, path: prev.field }).then(function (prevField) {
      // set caret right before the new text we added
      select(prevField, { start: prevField.textContent.length - (textLength + 1) });
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
    textLength = el.innerText.length;

  // find the previous component, if any
  return getPrev(current, parent).then(function (prev) {
    if (prev) {
      // there's a previous component with the same name!
      // get the contents of the current field, and append them to the previous component
      return appendToPrev(getFieldContents(el), prev)
        .then(removeCurrentFromParent(current, parent))
        .then(render.reloadComponent.bind(null, prev.ref))
        .then(focusPreviousComponent(parent, prev, textLength));
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
    .then(function (res) {
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

  if (caretPos.start === 0) {
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

function isStyled(styled) {
  return styled ? ' styled' : ''; // note the preeeding space!
}

function addLineBreak() {
  var selection = window.getSelection(),
    range = selection.getRangeAt(0),
    br = document.createElement('br');

  // woah, crazy stuff!
  // this creates a range, inserts the <br> tag, then sets the caret after it
  range.deleteContents();
  range.insertNode(br);
  range.setStartAfter(br);
  range.setEndAfter(br);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

module.exports = function (result, args) {
  var rivets = result.rivets,
    buttons = args.buttons,
    styled = args.styled,
    enableKeyboardExtras = args.enableKeyboardExtras,
    textInput = dom.find(result.el, 'input') || dom.find(result.el, 'textarea'),
    field = dom.create(`<p class="wysiwyg-input${ isStyled(styled) }" data-field="${result.bindings.name}" rv-wysiwyg="data.value"></p>`);

  // if more than 5 buttons, put the rest on the second tier
  if (buttons.length > 5) {
    buttons.splice(5, 0, 'tieredToolbar'); // clicking this expands the toolbar with a second tier
  }

  // put the rich text field after the input
  dom.replaceElement(textInput, field);

  rivets.binders.wysiwyg = {
    publish: true,
    bind: function (el) {
      // this is called when the binder initializes
      var observer = this.observer,
        data = observer.value() || '', // don't print 'undefined' if there's no data
        editor = createEditor(field, buttons);

      // put the initial data into the editor
      el.innerHTML = data;

      // hide the tier2 buttons when closing the toolbar
      editor.subscribe('hideToolbar', function () {
        dom.find('.medium-editor-toolbar').classList.remove('show-all');
        dom.find('.medium-editor-toolbar').classList.remove('show-none');
      });

      // persist editor data to data model on input
      editor.subscribe('editableInput', function (e, editable) {
        observer.setValue(editable.innerHTML);
      });

      // persist editor data to data model on paste
      editor.subscribe('editablePaste', function (e, editable) {
        var textmodel = model.fromElement(dom.create(editable.innerHTML)),
          fragment = model.toElement(textmodel);

        // note: we're using the model-text service to clean up and standardize html
        // this is in addition to the cleanup that medium-editor does by default,
        // as well as the options we specified in the cleanTags / cleanReplacements paste config

        dom.clearChildren(editable); // clear the current children
        editable.appendChild(fragment); // add the cleaned dom fragment
        observer.setValue(editable.innerHTML);
      });

      editor.subscribe('editableKeydownDelete', function (e, editable) {
        if (enableKeyboardExtras) {
          handleComponentDeletion(editable, e);
        }
      });

      editor.subscribe('editableKeydownEnter', function (e, editable) {
        if (enableKeyboardExtras && e.shiftKey) {
          // shift+enter was pressed. add a line break
          addLineBreak();
        } else if (enableKeyboardExtras) {
          // enter was pressed. create a new component if certain conditions are met
          handleComponentCreation(editable, observer);
        } else {
          // close the form?
          focus.unfocus();
        }
      });
    }
  };

  return result;
};
