/**
 *   Forked from MediumButton  1.0 (24.02.2015)
 *   MIT (c) Patrick Stillhart
 *   https://github.com/arcs-/MediumButton
 */
'use strict';

function getCurrentSelection() {
  var html = '',
    sel, container, i, len;
  
  if (typeof window.getSelection !== 'undefined') {
    sel = window.getSelection();
    
    if (sel.rangeCount) {
      container = document.createElement('div');
      
      for (i = 0, len = sel.rangeCount; i < len; ++i) {
        container.appendChild(sel.getRangeAt(i).cloneContents());
      }

      html = container.innerHTML;
    }
  } else if (typeof document.selection !== 'undefined') {
    if (document.selection.type === 'Text') {
      html = document.selection.createRange().htmlText;
    }
  }
  
  return html;
}

function MediumButton(options) {
  if (options.label === undefined || !/\S{1}/.test(options.label) || 
    options.start === undefined || !/\S{1}/.test(options.start) || 
    options.end === undefined || !/\S{1}/.test(options.end)) {
    
    if(options.label === undefined || !/\S{1}/.test(options.label) ||
       options.action === undefined || !/\S{1}/.test(options.action)) {
      console.error('[Custom-Button] You need to specify "label", "start" and "end" OR "label" and "action"');  
      return;
    } 
  }
  
  options.start = (options.start === undefined) ? '' : options.start;
  options.end = (options.end === undefined) ? '' : options.end;
  
  this.options = options;
  this.button = document.createElement('button');
  this.button.className = 'medium-editor-action';
  this.button.innerHTML = options.label;
  this.button.onclick = function() {
    // Get Current Value
    var html = getCurrentSelection(),
      sel = window.getSelection(),
      range, fragment, firstInsertedNode, lastInsertedNode;
      
    // Modify Content 
    if (options.start === undefined || html.indexOf(options.start) === -1 && html.indexOf(options.end) === -1) {
      if(options.action !== undefined) {
        html = options.action(html, true);
      }
      
      html = options.start + html + options.end;

    } else { //clean old
      if(options.action !== undefined) {
        html = options.action(html, false);
      }

      html = typeof html === 'string' ? html : html.toString(); // todo: is this assertion needed?
      html = html.split(options.start).join('');
      html = html.split(options.end).join('');
    }

    //Set new Content
    if (sel.getRangeAt && sel.rangeCount) {
      range = window.getSelection().getRangeAt(0);
      range.deleteContents();

      // Create a DocumentFragment to insert and populate it with HTML
      fragment = range.createContextualFragment(html);

      firstInsertedNode = fragment.firstChild;
      lastInsertedNode = fragment.lastChild;
      range.insertNode(fragment);

      if (firstInsertedNode) {
          range.setStartBefore(firstInsertedNode);
          range.setEndAfter(lastInsertedNode);
      }
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };
}

MediumButton.prototype.getButton = function() {
    return this.button;
};

MediumButton.prototype.checkState = function() {
  var html = getCurrentSelection();
  if (this.options.start !== '' && html.indexOf(this.options.start) > -1 && html.indexOf(this.options.end) > -1) {
      this.button.classList.add('medium-editor-button-active');
  }
};

module.exports = MediumButton;
