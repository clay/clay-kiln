var _ = require('lodash'),
  keycode = require('keycode'),
  dom = require('@nymag/dom'),
  focus = require('../decorators/focus');

/**
 * Creates a list
 * @param {{name: string, el: Element, bindings: {}}} result
 * @param {object} [args]
 * @param {boolean} [args.allowRepeatedItems]
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    allowRepeat = !!args && !!args.allowRepeatedItems,
    el = dom.create(`
      <div class="input-label">
        <div rv-field="${name}" class="simple-list" rv-simplelist="${name}.data">
          <span tabindex="0" rv-each-item="${name}.data" class="simple-list-item" rv-class-selected="item._selected" rv-on-click="${name}.selectItem" rv-on-keydown="${name}.keyactions">{ item.text }</span>
          <input class="simple-list-add" data-allow-repeat=${allowRepeat} rv-on-click="${name}.unselectAll" placeholder="Start typing here&hellip;" />
        </div>
      </div>`);

  /**
   * unselect all items
   * @param  {[]} items
   * @return {[]}
   */
  function unselectAll(items) {
    return items.map(function (item) {
      item._selected = false;
      return item;
    });
  }

  /**
   * unselect all items, then select a specific item
   * @param {object} item
   * @param  {array} data
   */
  function selectItem(item, data) {
    unselectAll(data);
    item._selected = true;
  }

  /**
   * select previous item in list
   * @param  {Event} e
   * @param  {number} index
   * @param  {array} data
   */
  function selectPrevious(e, index, data) {
    if (index > 0 && e.target.previousSibling) {
      selectItem(data[index - 1], data);
      e.target.previousSibling.focus();
    }
  }

  /**
   * select next item in list
   * @param  {Event} e
   * @param  {number} index
   * @param  {array} data
   */
  function selectNext(e, index, data) {
    var input = dom.find(el, '.simple-list-add');

    if (index < data.length - 1) {
      e.preventDefault(); // kill that tab!
      selectItem(data[index + 1], data );
      e.target.nextSibling.focus();
    } else {
      // we currently have the last item selected, so focus the input
      e.preventDefault();
      e.stopPropagation(); // stop the current event first
      input.dispatchEvent(new Event('click'));
      input.focus();
    }
  }

  /**
   * remove item from list
   * @param  {Event} e
   * @param  {number} index
   * @param  {array} data
   */
  function deleteItem(e, index, data) {
    var prevSibling = e.target.previousSibling,
      input = dom.find(dom.closest(e.target, '.simple-list'), '.simple-list-add');

    e.preventDefault(); // prevent triggering the browser's back button
    data.splice(index, 1); // remove item from the list

    if (index > 0) {
      prevSibling.focus();
      prevSibling.dispatchEvent(new Event('click'));
    } else {
      // you deleted all the items! focus the input
      input.focus();
    }
  }

  /*
  Click Handlers
   */

  // unselect all items when you click to add a new one
  result.bindings.unselectAll = function (e, bindings) {
    unselectAll(bindings[name].data);
  };

  // select an item (and unselect all others) when you click it
  result.bindings.selectItem = function (e, bindings) {
    selectItem(bindings.item, bindings[name].data);
  };

  // move between items and delete items when pressing the relevant keys (when an item is selected)
  result.bindings.keyactions = function (e, bindings) {
    var key = keycode(e),
      data = bindings[name].data,
      index = data.indexOf(bindings.item);

    if (key === 'left') {
      selectPrevious(e, index, data);
    } else if (key === 'tab' || key === 'right') {
      selectNext(e, index, data);
    } else if (key === 'delete' || key === 'backspace') {
      deleteItem(e, index, data);
    }
  };

  // put the element into the result object
  result.el = el;

  // add binder for creating new items
  result.binders.simplelist = {
    publish: true,
    bind: function (boundEl) {
      // this is called when the binder initializes
      var addEl = dom.find(boundEl, '.simple-list-add'),
        allowRepeat = !!(addEl.getAttribute('data-allow-repeat') === 'true'),
        // if data is undefined make it an empty array
        data = data || [],
        observer = this.observer;

      observer.setValue(data);

      // check repeated items
      // returns true if repitition is disallowed and items repeat
      // returns false if repitition is allowed
      // returns false if repitition is disallowed and items don't repeat
      function hasRepeatedValue(value, data) {
        var oldItems = _.map(data, item => item.text.toLowerCase());

        return !allowRepeat && _.includes(oldItems, value.toLowerCase());
      }

      // add new item from the add-items field
      function addItem(e) {
        var data = observer.value(),
          newText = { text: addEl.value }, // get the new item text
          val = newText.text,
          repeated = hasRepeatedValue(val, data);

        if (e) {
          e.preventDefault(); // prevent creating newlines or tabbing out of the field
          e.stopPropagation(); // prevent closing the form
        }

        if (val.length && repeated) {
          addEl.setCustomValidity('Repeated items are not allowed!');
          addEl.reportValidity();
        } else if (val.length && !repeated) {
          addEl.setCustomValidity(''); // valid input
          addEl.value = ''; // remove it from the add-item field
          data.push(newText); // put it into the data
          observer.setValue(data);
        } else {
          addEl.setCustomValidity(''); // remove the invalidity of the input, so you can close the form
          // close the form
          focus.unfocus().catch(_.noop);
        }
      }

      // select the last item when you backspace from the add-items field
      function selectLastItem(e) {
        var data = observer.value(),
          newItems = dom.findAll(boundEl, '.simple-list-item');

        if (!addEl.value || !addEl.value.length) {
          e.preventDefault(); // prevent triggering the browser's back button
          _.last(data)._selected = true;
          _.last(newItems).focus(); // focus on the last item
          observer.setValue(data);
        }
      }

      // handle keyboard events in the add-items field
      function handleItemKeyEvents(e) {
        var key = keycode(e);

        if (key === 'enter' || key === 'tab' || key === ',' && e.shiftKey === false) {
          addItem(e);
        } else if (key === 'delete' || key === 'backspace' || key === 'left') {
          selectLastItem(e);
        }
      }

      addEl.addEventListener('keydown', handleItemKeyEvents);
    }
  };

  return result;
};
