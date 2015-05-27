'use strict';
var _ = require('lodash'),
  keycode = require('keycode'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  // todo: args.min is a thing
  var listTpl = `
    <section name="${result.bindings.name}" class="simple-list" rv-simplelist="data">
      <span tabindex="0" rv-each-item="data" class="simple-list-item" rv-class-selected="item.selected" rv-on-click="selectItem" rv-on-keydown="keyactions">{ item.text }</span>
      <span class="simple-list-add" rv-on-click="unselectAll" contenteditable="true"></span>
    </section>`,
    el = dom.create(listTpl);

  function unselectAll(items) {
    return items.map(function (item) {
      item.selected = false;
      return item;
    });
  }

  function selectItem(bindings) {
    var item = bindings.item,
      data = bindings.data;

    unselectAll(data);
    item.selected = true;
  }

  // unselect all items when you click to add a new one
  result.bindings.unselectAll = function (e, bindings) {
    unselectAll(bindings.data);
  };

  // select an item (and unselect all others) when you click it
  result.bindings.selectItem = function (e, bindings) {
    selectItem(bindings);
  };

  // move between items and delete items when pressing the relevant keys (when an item is selected)
  result.bindings.keyactions = function (e, bindings) {
    var key = keycode(e),
      index = bindings.data.indexOf(bindings.item);

    console.log(index, bindings.data.length)

    if (key === 'left' && index > 0) {
      selectItem({ item: bindings.data[index - 1], data: bindings.data });
      e.target.previousSibling.focus();
    } else if ((key === 'tab' || key === 'right') && index < bindings.data.length) {
      e.preventDefault(); // kill that tab!
      selectItem({ item: bindings.data[index + 1], data: bindings.data });
      e.target.nextSibling.focus();
    } else if (key === 'delete' || key === 'backspace') {
      e.preventDefault();
      bindings.data.splice(index, 1); // remove item from the list
    }
  };

  // put the element into the result object
  result.el = el;

  // add binder for creating new items
  result.rivets.binders.simplelist = {
    publish: true,
    bind: function (el) {
      var adapter = result.rivets.adapters[result.rivets.rootInterface],
        model = this.model,
        keypath = this.keypath,
        items = dom.findAll(el, '.simple-list-item'),
        addEl = dom.find(el, '.simple-list-add');

      // add new item
      function addItem(e) {
        var data = adapter.get(model, keypath),
          newText = { text: addEl.innerText }; // get the new item typed

        if (e) {
          e.preventDefault();
        }
        addEl.innerText = ''; // remove it from the "add item" span
        data.push(newText); // put it into the data
        adapter.set(model, keypath, data); // update!
      }

      // select the last item when you backspace from the add-items field
      function selectLastItem() {
        var data = adapter.get(model, keypath);

        _.last(data).selected = true;
        adapter.set(model, keypath, data); // update!
        _.last(items).focus();
      }

      // add keyboard events to add-item field
      addEl.addEventListener('keydown', function (e) {
        var key = keycode(e);

        if (key === 'enter' || key === 'tab') {
          // add new item
          e.preventDefault();
          addItem(e);
        } else if (key === 'delete' || key === 'backspace') {
          // select last item
          if (!addEl.innerText.length) {
            e.preventDefault();
            selectLastItem();
          }
        }
      });
    }
  };

  return result;
};