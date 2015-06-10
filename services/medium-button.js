/**
 *   Forked from MediumButton  1.0 (24.02.2015)
 *   MIT (c) Patrick Stillhart
 *   https://github.com/arcs-/MediumButton
 */

function getCurrentSelection() {
  var sel = window.getSelection(),
    container = document.createElement('div'),
    i = 0,
    len = sel.rangeCount;

  for (i = 0, len = sel.rangeCount; i < len; ++i) {
    container.appendChild(sel.getRangeAt(i).cloneContents());
  }

  return container.innerHTML;
}

function MediumButton(options) {
  options.start = options.start || '';
  options.end = options.end || '';

  this.options = options;
  this.button = document.createElement('button');
  this.button.className = 'medium-editor-action';
  this.button.innerHTML = options.label;
  this.button.onclick = function () {
    // Get Current Value
    var html = getCurrentSelection(),
      sel = window.getSelection(),
      range, fragment, firstInsertedNode, lastInsertedNode;

    // Modify Content
    if (options.start === undefined || html.indexOf(options.start) === -1 && html.indexOf(options.end) === -1) {
      if (options.action !== undefined) {
        html = options.action(html, true);
      }

      html = options.start + html + options.end;

    } else { // clean old
      if (options.action !== undefined) {
        html = options.action(html, false);
      }

      html = typeof html === 'string' ? html : html.toString(); // todo: is this assertion needed?
      html = html.split(options.start).join('');
      html = html.split(options.end).join('');
    }

    // Set new Content
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

MediumButton.prototype.getButton = function () {
  return this.button;
};

MediumButton.prototype.checkState = function () {
  var html = getCurrentSelection();

  if (this.options.start !== '' && html.indexOf(this.options.start) > -1 && html.indexOf(this.options.end) > -1) {
    this.button.classList.add('medium-editor-button-active');
  }
};

module.exports = MediumButton;
