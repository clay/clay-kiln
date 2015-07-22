/*
WYSIWYG arguments

multiline {boolean} allow or disallow multi-paragraph selection
buttons {array} array of button names (strings) for tooltip
placeholder {string} placeholder that will display in the input
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

function addComponent(el) {
  var currentField = el.getAttribute(references.fieldAttribute),
    currentComponent = dom.closest(el, '[' + references.referenceAttribute + ']'),
    currentComponentRef = currentComponent.getAttribute(references.referenceAttribute),
    currentComponentName = references.getComponentNameFromReference(currentComponentRef);

  // create a new component
  return db.postToReference('/components/' + currentComponentName + '/instances', {}).then(function (res) {
    var ref = res._ref;

    // get the html of that new component
    return db.getComponentHTMLFromReference(ref).then(function (newEl) {
      // add the handlers for the new component
      render.addComponentsHandlers(newEl);
      // then add it after the current one
      dom.insertAfter(currentComponent, newEl);
      // then focus() the new field that's the same as the current field
      focus.focus(newEl, { ref: ref, path: currentField }).then(function () {
        dom.find('[data-ref="' + ref + '"] [data-field]').focus();
      });

      return ref;
    });
  }).then(function (ref) { // update the parent component's component list
    var parentComponent = dom.closest(currentComponent.parentNode, '[' + references.referenceAttribute + ']'),
      parentRef = parentComponent.getAttribute(references.referenceAttribute),
      parentField = dom.closest(currentComponent.parentNode, '[' + references.editableAttribute + ']').getAttribute(references.editableAttribute);

    return edit.getDataOnly(parentRef).then(function (parentData) {
      var index = _.findIndex(parentData[parentField], { _ref: currentComponentRef }) + 1;

      parentData[parentField].splice(index, 0, { _ref: ref }); // splice the new component into the array after the current one
      return db.putToReference(parentRef, parentData);
    });
  });
}

function handleComponentCreation(el) {
  var caretPos = select(el); // get text after the cursor, if any

  // if there's stuff after the caret, get it
  if (caretPos.start < el.innerText.length - 2) {
    console.log(el.innerText.substr(caretPos.start));
    return false; // don't do anything if you're not at the end
  } else {
    addComponent(el);
  }
}

module.exports = function (result, args) {
  var rivets = result.rivets,
    buttons = args.buttons,
    newComponentOnEnter = args.newComponentOnEnter,
    textInput = dom.find(result.el, 'input') || dom.find(result.el, 'textarea'),
    field = dom.create(`<p class="wysiwyg-input" data-field="${result.bindings.name}" rv-wysiwyg="data.value"></p>`);

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

      editor.subscribe('editableKeydownEnter', function (e, editable) {
        e.preventDefault(); // stop it from creating new paragraphs

        if (newComponentOnEnter) {
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
