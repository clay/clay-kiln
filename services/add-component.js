var dom = require('./dom'),
  tpl =
    `<section class="component-list-bottom">
      <div class="open-add-components" rv-on-click="toggleAddComponents">
        <span class="open-add-components-inner">+</span>
      </div>
      <section class="add-components-pane">
      </section>
    </section>`;

function open(ref, el, path, e) {
  return edit.getData(ref).then(function (data) {
    // If name, then we're going deep; Note anything with a name either modal by default or has a displayProperty.
    if (path) {
      data = _.get(data, path);
    }

    switch (data._schema[references.displayProperty]) {
      case 'inline':
        return formCreator.createInlineForm(ref, path, data, el);
      default: // case 'modal':
        return formCreator.createForm(ref, path, data);
    }
  });
}

function addButton(el) {
  var buttonEl = dom.create(tpl);

  buttonEl.addEventListener('click', function (e) {
    var ref = dom.closest('[' + references.referenceAttribute + ']').getAttribute(references.referenceAttribute);

    e.preventDefault();
    e.stopPropagation();


  })

  el.appendChild(buttonEl);
}

module.exports = addButton;
