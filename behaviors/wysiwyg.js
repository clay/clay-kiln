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
  edit = require('../services/edit');

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
      forcePlainText: true,
      cleanPastedHTML: false, // clean html from sources like google docs
      cleanTags: [ // remove these tags when pasting
        'meta',
        'script',
        'style',
        'img',
        'object',
        'iframe'
      ],
      cleanReplacements: [
        [/<h[2-9]>/ig, '<h1>'],
        [/<\/h[2-9]>/ig, '</h1>'], // force all headers to the same level
        [/<p>/ig, ''], // get rid of <p> tags
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
  var currentComponent = dom.closest(el, '[' + references.referenceAttribute + ']'),
    currentComponentRef = currentComponent.getAttribute(references.referenceAttribute);

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
    parentComponent = dom.closest(parentNode, '[' + references.referenceAttribute + ']'),
    parentComponentRef = parentComponent.getAttribute(references.referenceAttribute);

  return {
    field: dom.closest(parentNode, '[' + references.editableAttribute + ']').getAttribute(references.editableAttribute),
    component: parentComponent,
    ref: parentComponentRef,
    name: references.getComponentNameFromReference(parentComponentRef)
  };
}

function getPrev(current, parent) {
  return edit.getDataOnly(parent.ref).then(function (parentData) {
    var index = _.findIndex(parentData[parent.field], { _ref: current.ref }),
      before = _.take(parentData[parent.field], index),
      prev = _.findLast(before, function (component) {
        return references.getComponentNameFromReference(component._ref) === current.name;
      });

    console.log(before);
    console.log(prev);

    return prev;
  });
}

/**
 * remove current component, append text to previous component (of the same name)
 * @param {Element} el
 * @returns {Promise}
 */
function removeComponent(el) {
  var current = getCurrent(el),
    parent = getParent(current.component);

  // find the previous component (with the same name), if any
  return getPrev(current, parent);

  // if there's a previous component (with the same name),
  // kick off the process of removing the current component
}

/**
 * add component after current component
 * @param {Element} el
 * @returns {Promise}
 */
function addComponent(el) {
  var current = getCurrent(el);

  // create a new component
  return db.postToReference('/components/' + current.ame + '/instances', {}).then(function (res) {
    var ref = res._ref;

    // get the html of that new component
    return db.getComponentHTMLFromReference(ref).then(function (newEl) {
      // add the handlers for the new component
      render.addComponentsHandlers(newEl);
      // then add it after the current one
      dom.insertAfter(current.component, newEl);
      // then focus() the new field that's the same as the current field
      focus.focus(newEl, { ref: ref, path: current.field }).then(function () {
        dom.find('[data-ref="' + ref + '"] [data-field]').focus();
      });

      return ref;
    });
  }).then(function (ref) { // update the parent component's component list
    var parent = getParent(current.component);

    return edit.getDataOnly(parent.ref).then(function (parentData) {
      var index = _.findIndex(parentData[parent.field], { _ref: current.ref }) + 1;

      parentData[parent.field].splice(index, 0, { _ref: ref }); // splice the new component into the array after the current one
      return db.putToReference(parent.ref, parentData);
    });
  });
}

/**
 * remove current component if we're at the beginning of the field
 * and there's a previous component to append it to
 * @param {Element} el
 * @returns {undefined|Promise}
 */
function handleComponentDeletion(el) {
  var caretPos = select(el);

  if (caretPos.start === 0) {
    return removeComponent(el);
  }
}

/**
 * create new component if we're at the end of the field
 * @param {Element} el
 * @returns {false|Promise}
 */
function handleComponentCreation(el) {
  var caretPos = select(el); // get text after the cursor, if any

  // if there's stuff after the caret, get it
  if (caretPos.start < el.innerText.length - 2) {
    console.log(el.innerText.substr(caretPos.start));
    // todo: split paragraphs, add new component with text after caret
    return false; // don't do anything if you're not at the end
  } else {
    return addComponent(el);
  }
}

function isStyled(styled) {
  return styled ? ' styled' : ''; // note the preeeding space!
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
        observer.setValue(editable.innerHTML);
      });

      editor.subscribe('editableKeydownDelete', function (e, editable) {
        if (enableKeyboardExtras) {
          handleComponentDeletion(editable);
        }
      });

      editor.subscribe('editableKeydownEnter', function (e, editable) {
        e.preventDefault(); // stop it from creating new paragraphs

        if (enableKeyboardExtras) {
          handleComponentCreation(editable);
        } else {
          // close the form?
          focus.unfocus();
        }
      });
    }
  };

  return result;
};
