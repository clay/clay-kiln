var tagTypes, blockTypes,
  _ = require('lodash'),
  dom = require('./dom'),
  nodeFilter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;

/**
 * Script and style tags count as text nodes.  We don't want them.
 *
 * Assumes parameter is a Text element (inherits from Node, not Element);
 *
 * @param {Text} node
 * @returns {boolean}
 */
function contentTextOnly(node) {
  var parent = node.parentNode,
    isElement = parent.nodeType === Node.ELEMENT_NODE,
    isScript = isElement && parent.nodeName === 'SCRIPT',
    isStyle = isElement && parent.nodeName === 'STYLE';

  return !(isScript || isStyle);
}

/**
 * @param {Node} node
 * @returns {boolean}
 */
function knownTagsOnly(node) {
  var name = node.nodeName;

  return !!tagTypes[name] || (node.nodeType === Node.TEXT_NODE && contentTextOnly(node));
}

/**
 * @param {Node} el
 * @returns {string}
 */
function getContentText(el) {
  var str = '',
    walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, contentTextOnly, false);

  while (walker.nextNode()) {
    str += walker.currentNode.nodeValue;
  }

  return str;
}

/**
 * @param {{text: string, blocks: object}} model
 * @param {Node} node
 */
function continuous(model, node) {
  var blockLen, lastBlockEndIndex,
    start = model.text.length,
    text = getContentText(node),
    end = start + text.length,
    nodeName = node.nodeName,
    tagBlockName = tagTypes[nodeName].name,
    block = model.blocks[tagBlockName];

  // tags of zero length are not allowed
  if (start !== end) {

    if (!block) {
      block = [];
      model.blocks[tagBlockName] = block;
    }

    blockLen = block.length;
    lastBlockEndIndex = blockLen - 1;
    if (blockLen >= 2 && block[lastBlockEndIndex] >= start) {
      // if continuation of last block
      block[lastBlockEndIndex] = Math.max(block[lastBlockEndIndex], end);
    } else {
      // new block
      block.push(start, end);
    }

  }
}

/**
 * @param {Element} el
 * @returns {object}
 */
function getAttributes(el) {
  return _.reduce(el.attributes, function (props, attr) {
    props[attr.name] = attr.value;
    return props;
  }, {});
}

/**
 * @param {{text: string, blocks: object}} model
 * @param {Node} node
 */
function propertied(model, node) {
  var start = model.text.length,
    text = getContentText(node),
    end = start + text.length,
    properties = getAttributes(node),
    obj = _.assign({ start: start, end: end}, properties),
    nodeName = node.nodeName,
    tagBlockName = tagTypes[nodeName].name,
    block = model.blocks[tagBlockName];

  // tags of zero length are not allowed
  if (start !== end) {

    if (!block) {
      block = [];
      model.blocks[tagBlockName] = block;
    }

    block.push(obj);
  }
}

/**
 * The types of tags that we know about.
 *
 * Used to filter TreeWalkers.
 *
 * @enum
 */
tagTypes = {
  B: { set: continuous, name: 'bold' },
  I: { set: continuous, name: 'italic' },
  U: { set: continuous, name: 'underline' },
  EM: { set: continuous, name: 'emphasis' },
  STRONG: { set: continuous, name: 'strong' },
  A: { set: propertied, name: 'link' },
  SPAN: { set: propertied, name: 'span' }
};

/**
 * Inversion of tagTypes, referenced by the tag name.
 *
 * Used to construct elements from models.
 *
 * @enum
 */
blockTypes = _.transform(tagTypes, function (obj, tag, name) {
  obj[tag.name] = { set: tag.set, name: name };
}, {});

/**
 * @param {Node} el
 * @returns {DocumentFragment}
 */
function normalizeElementAsDocument(el) {
  var parent;

  if (el.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    parent = document.createDocumentFragment();
    parent.appendChild(el);
    el = parent;
  }

  return el;
}

/**
 * @param {Node} el
 * @returns {{text: string, blocks: {object}}}
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

  el = normalizeElementAsDocument(el);

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
        tagTypes[name].set(model, node);
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
 * @param {[number]} list
 * @param {number} value
 * @returns {number}
 */
function getBinarySortedInsertPosition(list, value) {
  var midpoint, midValue,
    high = list.length - 1,
    low = 0;

  while (low <= high) {
    midpoint = low + (high - low >> 1);
    midValue = list[midpoint];

    if (midValue < value) {
      low = midpoint + 1;
    } else if (midValue > value) {
      high = midpoint - 1;
    } else {
      return midpoint;
    }
  }
  return low;
}

/**
 * Get the number of overlaps if B is applied over A.
 *
 * NOTE: blocks are assumed to be in ascending order.
 *
 * @param {[number]} blockA
 * @returns {number}
 *
 * @example getOverlapCount(model.blocks.bold, model.blocks.italics, model.blocks.underline);
 */
function getOverlapCount(blockA) {
  var i, j, insertA, insertB, blockB,
    otherBlocks = _.rest(arguments),
    count = 0;

  for (i = 0; i < otherBlocks.length; i++) {
    blockB = otherBlocks[i];
    for (j = 0; j < blockB.length; j = j + 2) {
      insertA = getBinarySortedInsertPosition(blockA, blockB[j]);
      insertB = getBinarySortedInsertPosition(blockA, blockB[j + 1]);
      if (insertA !== insertB) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Split a text node into pieces
 *
 * @param {object} blockType
 * @param {Node} rootEl
 * @param {object} blockAttributes
 * @param {object} item
 */
function splitTextNode(blockType, rootEl, blockAttributes, item) {
  var startTextNode, blockEl, tagName,
    textNode = item.node,
    parentNode = textNode.parentNode || rootEl, // no parent means el is a document/document fragment
    text = textNode.nodeValue,
    startPos = item.start || 0,
    endPos = item.end || text.length,
    startText = text.substr(0, startPos),
    middleText = text.substr(startPos, endPos - startPos),
    endText = text.substr(endPos);

  if (startPos === endPos) {
    // we're overlapping someone; someone has missed something before this point
    return;
  }

  // create block element
  tagName = blockTypes[blockType].name;
  blockEl = document.createElement(tagName);
  _.each(blockAttributes, function (value, key) {
    blockEl.setAttribute(key, value);
  });
  blockEl.appendChild(dom.create(middleText));
  parentNode.insertBefore(blockEl, textNode);

  // before the element
  if (startText.length > 0) {
    startTextNode = dom.create(startText);
    parentNode.insertBefore(startTextNode, blockEl);
  }

  // after the element
  if (endText.length > 0) {
    textNode.nodeValue = endText;
  } else {
    parentNode.removeChild(textNode);
  }
}

/**
 * @param {Node} el
 * @param {number} start
 * @param {number} end
 * @returns {Array}
 */
function getTextNodeTargets(el, start, end) {
  var walker,
    str = '',
    list;

  // walk to start of this text
  walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, contentTextOnly, false);
  walker.nextNode();

  while (str.length + walker.currentNode.nodeValue.length < start) {
    str += walker.currentNode.nodeValue;
    walker.nextNode();
  }

  // walk to end of text, remembering the text nodes
  list = [{node: walker.currentNode, start: start - str.length}];
  str += walker.currentNode.nodeValue;

  while (str.length < end) {
    walker.nextNode();
    str += walker.currentNode.nodeValue;
    list.push({node: walker.currentNode});
  }

  list[list.length - 1].end = walker.currentNode.nodeValue.length - (str.length - end);
  return list;
}

/**
 * @param {object} blocks
 * @param {*} type
 * @returns {object}
 */
function getBlocksOfType(blocks, type) {
  return _.pick(blocks, function (block, blockName) {
    return blockTypes[blockName].set === type;
  });
}

/**
 * @param {Node} el
 * @param {{text: string, blocks: object}} model
 */
function addPropertiedBlocksToElement(el, model) {
  var start, end, propertiedBlocks;

  propertiedBlocks = getBlocksOfType(model.blocks, propertied);

  _.forOwn(propertiedBlocks, function (blocksOfType, blockType) {
    var i, list, block;

    for (i = 0; i < blocksOfType.length; i++) {
      block = blocksOfType[i];
      start = block.start;
      end = block.end;
      list = getTextNodeTargets(el, start, end);

      _.each(list, splitTextNode.bind(null, blockType, el, _.omit(block, 'start', 'end')));
    }
  });
}

/**
 * @param {object} blocks
 * @returns {object}
 */
function sortContinuousBlocks(blocks) {
  var keys, sortedBlocks, forwardCount, backwardCount;

  // we know how to do this
  if (_.size(blocks) === 2) {
    keys = Object.keys(blocks);
    forwardCount = getOverlapCount(blocks[keys[0]], blocks[keys[1]]);
    backwardCount = getOverlapCount(blocks[keys[1]], blocks[keys[0]]);

    if (forwardCount > backwardCount) {
      sortedBlocks = _.pairs(blocks);
      sortedBlocks.reverse();
      blocks = _.zipObject(sortedBlocks);
    }
  }

  return blocks;
}

/**
 * @param {Node} el
 * @param {{text: string, blocks: object}} model
 */
function addContinuousBlocksToElement(el, model) {
  var start, end, continuousBlocks;

  continuousBlocks = getBlocksOfType(model.blocks, continuous);
  continuousBlocks = sortContinuousBlocks(continuousBlocks);

  _.forOwn(continuousBlocks, function (blocksOfType, blockType) {
    var i, list;

    for (i = 0; i < blocksOfType.length; i = i + 2) {
      start = blocksOfType[i];
      end = blocksOfType[i + 1];
      list = getTextNodeTargets(el, start, end);

      _.each(list, splitTextNode.bind(null, blockType, el, {}));
    }
  });
}

/**
 * @param {{text: string, blocks: object}} model
 * @returns {DocumentFragment}
 */
function toElement(model) {
  var el = normalizeElementAsDocument(dom.create(model.text));

  addPropertiedBlocksToElement(el, model);
  addContinuousBlocksToElement(el, model);

  return el;
}

/**
 * These cannot be split, so ones that fall on the border are removed.
 *
 * @param {{text: string, blocks: object}} model
 * @param {{text: string, blocks: object}} before
 * @param {{text: string, blocks: object}} after
 * @param {number} num
 */
function splitPropertiedBlocks(model, before, after, num) {
  _.each(getBlocksOfType(model.blocks, propertied), function (blocks, blockType) {
    var clonedBlock,
      beforeBlocks = [],
      afterBlocks = [];

    _.each(blocks, function (block) {
      if (block.start < num && block.end < num) {
        beforeBlocks.push(_.clone(block));
      } else if (block.start > num && block.end > num) {
        clonedBlock = _.clone(block);
        clonedBlock.start = block.start - num;
        clonedBlock.end = block.end - num;
        afterBlocks.push(clonedBlock);
      } else {
        clonedBlock = _.clone(block);
        clonedBlock.end = num;
        beforeBlocks.push(clonedBlock);
        clonedBlock = _.clone(block);
        clonedBlock.start = 0;
        clonedBlock.end = block.end - num;
        afterBlocks.push(clonedBlock);
      }
    });

    if (beforeBlocks.length > 0) {
      before.blocks[blockType] = beforeBlocks;
    }
    if (afterBlocks.length > 0) {
      after.blocks[blockType] = afterBlocks;
    }
  });
}

/**
 * These are allowed to be split.
 *
 * @param {{text: string, blocks: object}} model
 * @param {{text: string, blocks: object}} before
 * @param {{text: string, blocks: object}} after
 * @param {number} num
 */
function splitContinuousBlocks(model, before, after, num) {
  _.each(getBlocksOfType(model.blocks, continuous), function (blocks, blockType) {
    var index,
      beforeBlocks,
      afterBlocks;

    index = getBinarySortedInsertPosition(blocks, num);
    if (index % 2 === 1) {
      beforeBlocks = _.take(blocks, index - 1);
      beforeBlocks.push(blocks[index - 1], num);
      afterBlocks = [0, blocks[index] - num];
      afterBlocks.push.apply(afterBlocks, _.map(_.drop(blocks, index + 1), function (value) { return value - num; }));
    } else {
      beforeBlocks = _.take(blocks, index);
      afterBlocks = _.map(_.drop(blocks, index), function (value) { return value - num; });
    }

    before.blocks[blockType] = beforeBlocks;
    after.blocks[blockType] = afterBlocks;
  });
}

/**
 * @param {{text: string, blocks: object}} model
 * @param {number} num
 * @returns {[object, object]}
 */
function split(model, num) {
  var before = {
      text: model.text.substr(0, num),
      blocks: {}
    },
    after = {
      text: model.text.substr(num),
      blocks: {}
    };

  splitPropertiedBlocks(model, before, after, num);
  splitContinuousBlocks(model, before, after, num);

  return [before, after];
}

/**
 * @param {{text: string, blocks: object}} before
 * @param {{text: string, blocks: object}} after
 * @param {{text: string, blocks: object}} model
 */
function concatPropertiedBlocks(before, after, model) {
  var num = before.text.length,
    mergedBlocks = _.mapValues(_.cloneDeep(getBlocksOfType(after.blocks, propertied)), function (blocks) {
      _.each(blocks, function (block) {
        block.start += num;
        block.end += num;
      });

      return blocks;
    });

  _.each(_.cloneDeep(getBlocksOfType(before.blocks, propertied)), function (blocks, blockType) {
    if (mergedBlocks[blockType]) {
      mergedBlocks[blockType] = blocks.concat(mergedBlocks[blockType]);
    } else {
      mergedBlocks[blockType] = blocks;
    }
  });

  _.assign(model.blocks, mergedBlocks);
}

/**
 * @param {{text: string, blocks: object}} before
 * @param {{text: string, blocks: object}} after
 * @param {{text: string, blocks: object}} model
 */
function concatContinuousBlocks(before, after, model) {
  var num = before.text.length,
    mergedBlocks = _.mapValues(_.cloneDeep(getBlocksOfType(after.blocks, continuous)), function (blocks) {
      return _.map(blocks, function (value) { return value + num; });
    });

  _.each(getBlocksOfType(before.blocks, continuous), function (blocks, blockType) {
    if (mergedBlocks[blockType]) {
      if (_.last(blocks) === num && _.first(mergedBlocks[blockType]) === num) {
        mergedBlocks[blockType] = _.dropRight(blocks, 1).concat(_.drop(mergedBlocks[blockType], 1));
      } else {
        mergedBlocks[blockType] = blocks.concat(mergedBlocks[blockType]);
      }
    } else {
      mergedBlocks[blockType] = blocks;
    }
  });

  _.assign(model.blocks, mergedBlocks);
}

/**
 * @param {object} before
 * @param {object} after
 * @returns {{text: string, blocks: object}}
 */
function concat(before, after) {
  var model = {
    text: before.text + after.text,
    blocks: {}
  };

  concatPropertiedBlocks(before, after, model);
  concatContinuousBlocks(before, after, model);

  return model;
}

module.exports.fromElement = fromElement;
module.exports.toElement = toElement;
module.exports.split = split;
module.exports.concat = concat;
