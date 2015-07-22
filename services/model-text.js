


var tags,
  _ = require('lodash'),
  nodeFilter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;

function knownTagsOnly(node) {
  var name = node.nodeName;

  return !!tags[name] || node.nodeType === Node.TEXT_NODE;
}

/**
 * Script and style tags count as text nodes.  We don't want them.
 *
 * @param {Node} node
 * @returns {boolean}
 */
function contentTextOnly(node) {
  var parent = node.parentNode,
    isElement = parent.nodeType === Node.ELEMENT_NODE,
    isScript = isElement && parent.nodeName === 'SCRIPT',
    isStyle = isElement && parent.nodeName === 'STYLE';

  return !(isScript || isStyle);
}

function getContentText(el) {
  var str = '',
    walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, contentTextOnly, false);

  while (walker.nextNode()) {
    str += walker.currentNode.nodeValue;
  }

  return str;
}

function continuous(model, node) {
  var blockLen, lastBlockEndIndex,
    start = model.text.length,
    text = getContentText(node),
    end = start + text.length,
    nodeName = node.nodeName,
    tagBlockName = tags[nodeName].name,
    block = model.blocks[tagBlockName];

  if (!block) {
    block = [];
    model.blocks[tagBlockName] = block;
  }

  blockLen = block.length;
  lastBlockEndIndex = blockLen - 1;
  if (blockLen >= 2 && block[lastBlockEndIndex] >= start) {
    console.log('continuous', block[blockLen - 2], block[lastBlockEndIndex], start, end);
    //if continuation of last block
    block[lastBlockEndIndex] = Math.max(block[lastBlockEndIndex], end);
    console.log('result', block);
  } else {
    //new block
    console.log('new block', start, end);
    block.push(start, end);
    console.log('result', block);
  }
}

function propertied(model, node) {
  var start = model.text.length,
    text = getContentText(node),
    end = start + text.length,
    properties = _.transform(node.attributes, function (props, attr) { props[attr.name] = attr.value; }, {}),
    obj = _.assign({ start: start, end: end}, properties),
    nodeName = node.nodeName,
    tagBlockName = tags[nodeName].name,
    block = model.blocks[tagBlockName];

  if (!block) {
    block = [];
    model.blocks[tagBlockName] = block;
  }

  block.push(obj);
}

function classed(model, node) {

}

tags = {
  B: { set: continuous, name: 'bold' },
  I: { set: continuous, name: 'italic' },
  U: { set: continuous, name: 'underline' },
  EM: { set: continuous, name: 'emphasis' },
  STRONG: { set: continuous, name: 'strong' },
  A: { set: propertied, name: 'link' },
  SPAN: { set: classed, name: '' }
};

/**
 *
 * @param {Element} el
 * @returns {{text: string, blocks: {bold: Array, italic: Array, underline: Array, strike: Array, link: Array}}}
 */
function fromElement(el) {
  var model,
    name,
    type,
    node,
    walker;

  model = {
    text: '',
    blocks: {}
  };

  walker = document.createTreeWalker(el, nodeFilter, knownTagsOnly, false);

  while (walker.nextNode()) {
    node = walker.currentNode;
    name = node.nodeName;
    type = node.nodeType;

    switch (type) {
      case Node.TEXT_NODE:
        model.text += node.nodeValue;
        break;
      default:
        tags[name].set(model, node);
        break;
    }
  }


  return model;
}

/**
 * If the number were to be inserted into the block, get the index where it would be inserted.
 *
 * NOTE: block is assumed to be in ascending order.
 *
 * @param {[number]} block
 * @param {number} num
 * @returns {number}
 */
function getBinarySortedInsertPosition(block, num) {
  var cursor = 0,
    blockLen = block.length;

  return cursor;
}

/**
 * Get the number of overlaps if B is applied over A.
 *
 * NOTE: blocks are assumed to be in ascending order.
 *
 * @param {[number]} blockA
 * @param {[number]} blockB
 * @returns {number}
 */
function getOverlapCount(blockA, blockB) {
  var i, insertA, insertB,
    count = 0;

  for (i = 0; i < blockB.length; i = i + 2) {
    insertA = getBinarySortedInsertPosition(blockA, blockB[i]);
    insertB = getBinarySortedInsertPosition(blockA, blockB[i + 1]);
    if (insertA !== insertB) {
      count++;
    }
  }

  return count;
}

function toElement(model) {
  var classedBlocks, propertiedBlocks, continuousBlocks,
    el = document.createDocumentFragment();

  // apply classed; assumption: must not overlap, so just apply without worry
  classedBlocks = _.pick(model.blocks, function (block, blockName) { return tags[blockName].set === classed; });

  // apply propertied; assumption: must not overlap, so just apply without worry
  propertiedBlocks = _.pick(model.blocks, function (block, blockName) { return tags[blockName].set === propertied; });

  // apply continuous; these can overlap
  continuousBlocks = _.pick(model.blocks, function (block, blockName) { return tags[blockName].set === continuous; });

  return el;
}

module.exports.fromElement = fromElement;
module.exports.toElement = toElement;
//module.exports.toHTML = toHTML;
//module.exports.fromHTML = fromHTML;
//module.exports.split = split;
//module.exports.concat = concat;
//module.exports.format = format;
//module.exports.blocks = blocks;
