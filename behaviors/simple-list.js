'use strict';
var _ = require('lodash'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var min = args.min,
    max = args.max,
    listTpl = `
    <section name="${result.bindings.name}" class="simple-list" rv-simplelist="data">
      <span rv-each-item="data" class="simple-list-item" rv-class-primary="item.primary" contenteditable="false">{ item.text }</span>
      <span class="simple-list-add" contenteditable="true"></span>
    </section>`,
    el = dom.create(listTpl);

  result.el = el;

  // add binder for creating new items
  result.rivets.binders.simplelist = {
    publish: true,
    bind: function (el) {
      var adapter = result.rivets.adapters[result.rivets.rootInterface],
        model = this.model,
        keypath = this.keypath,
        items = dom.find(el, '.simple-list-item'),
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

      // add keyboard events to "add item" span
      addEl.addEventListener('keyup', function (e) {
        if (
          e.keyCode === 9 || // tab
          e.keyCode === 13 // enter
        ) {
          // create new item when pressing tab or enter
          addItem(e);
        } else if (
          e.keyCode === 8 || // delete
          e.keyCode === 46 // backspace
        ) {
          // if there's nothing here, select the last tag
          // if (addEl.innerText === '') {
          //   selectItem(_.last(data));
          // }
        }
      });
    },

    unbind: function () {
    },

    routine: function (el, value) {
      console.log(value)
    }
  };

  return result;
};