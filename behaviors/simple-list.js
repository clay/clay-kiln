'use strict';
var _ = require('lodash'),
  keycode = require('keycode'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var min = args.min,
    listTpl = `
      <section name="${result.bindings.name}" class="simple-list" rv-simplelist="data">
        <span tabindex="0" rv-each-item="data" class="simple-list-item" rv-class-selected="item.selected" rv-on-click="selectItem" rv-on-keydown="keyactions">{ item.text }</span>
        <span class="simple-list-add" rv-on-click="unselectAll" contenteditable="true"></span>
      </section>`,
      el = dom.create(listTpl);

  /**
   * unselect all items
   * @param  {[]} items 
   * @return {[]}       
   */
  function unselectAll(items) {
    return items.map(function (item) {
      item.selected = false;
      return item;
    });
  }

  /**
   * unselect all items, then select a specific item
   * @param  {{ item: {}, data: []}} bindings 
   */
  function selectItem(bindings) {
    var item = bindings.item,
      data = bindings.data;

    unselectAll(data);
    item.selected = true;
  }

  /**
   * select previous item in list
   * @param  {Event} e        
   * @param  {number} index    
   * @param  {{item: {}, data: []}} bindings 
   */
  function selectPrevious(e, index, bindings) {
    if (index > 0) {
      selectItem({ item: bindings.data[index - 1], data: bindings.data });
      e.target.previousSibling.focus();
    }
  }

  /**
   * select next item in list
   * @param  {Event} e        
   * @param  {number} index    
   * @param  {{item: {}, data: []}} bindings 
   */
  function selectNext(e, index, bindings) {
    if (index < bindings.data.length) {
      e.preventDefault(); // kill that tab!
      selectItem({ item: bindings.data[index + 1], data: bindings.data });
      e.target.nextSibling.focus();
    }
  }

  /**
   * remove item from list
   * @param  {Event} e        
   * @param  {number} index    
   * @param  {{item: {}, data: []}} bindings 
   */
  function deleteItem(e, index, bindings) {
    e.preventDefault(); // prevent triggering the browser's back button
    bindings.data.splice(index, 1); // remove item from the list
  }

  /*
  Click Handlers
   */

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

    if (key === 'left') {
      selectPrevious(e, index, bindings);
    } else if (key === 'tab' || key === 'right') {
      selectNext(e, index, bindings);
    } else if (key === 'delete' || key === 'backspace') {
      deleteItem(e, index, bindings);
    }
  };

  // put the element into the result object
  result.el = el;

  // add binder for creating new items
  result.rivets.binders.simplelist = {
    publish: true,
    bind: function (el) {
      // this is called when the binder initializes
      var adapter = result.rivets.adapters[result.rivets.rootInterface], // use default adapter
        model = this.model,
        keypath = this.keypath,
        items = dom.findAll(el, '.simple-list-item'),
        addEl = dom.find(el, '.simple-list-add');

      // add new item from the add-items field
      function addItem(e) {
        var data = adapter.get(model, keypath),
          newText = { text: addEl.innerText }; // get the new item text

        // prevent creating newlines or tabbing out of the field
        if (e) {
          e.preventDefault();
        }
        addEl.innerText = ''; // remove it from the add-item field
        data.push(newText); // put it into the data
        adapter.set(model, keypath, data); // update!
      }

      // select the last item when you backspace from the add-items field
      function selectLastItem(e) {
        var data = adapter.get(model, keypath);

        if (!addEl.innerText.length) {
          e.preventDefault(); // prevent triggering the browser's back button
          _.last(data).selected = true;
          adapter.set(model, keypath, data); // update!
          _.last(items).focus(); // focus on the last item
        }
      }

      // handle keyboard events in the add-items field
      function handleItemKeyEvents(e) {
        var key = keycode(e);

        if (key === 'enter' || key === 'tab') {
          addItem(e);
        } else if (key === 'delete' || key === 'backspace') {
          selectLastItem(e);
        }
      }
      
      addEl.addEventListener('keydown', handleItemKeyEvents);
    }
  };

  return result;
};