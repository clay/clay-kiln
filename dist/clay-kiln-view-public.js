(function() {
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  function baseFindIndex$1(array, predicate, fromIndex, fromRight) {
    var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
    while (fromRight ? index-- : ++index < length) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }
  var _baseFindIndex = baseFindIndex$1;
  function baseIsNaN$1(value) {
    return value !== value;
  }
  var _baseIsNaN = baseIsNaN$1;
  function strictIndexOf$1(array, value, fromIndex) {
    var index = fromIndex - 1, length = array.length;
    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }
  var _strictIndexOf = strictIndexOf$1;
  var baseFindIndex = _baseFindIndex, baseIsNaN = _baseIsNaN, strictIndexOf = _strictIndexOf;
  function baseIndexOf$1(array, value, fromIndex) {
    return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
  }
  var _baseIndexOf = baseIndexOf$1;
  var freeGlobal$1 = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
  var _freeGlobal = freeGlobal$1;
  var freeGlobal = _freeGlobal;
  var freeSelf = typeof self == "object" && self && self.Object === Object && self;
  var root$1 = freeGlobal || freeSelf || Function("return this")();
  var _root = root$1;
  var root = _root;
  var Symbol$3 = root.Symbol;
  var _Symbol = Symbol$3;
  var Symbol$2 = _Symbol;
  var objectProto$5 = Object.prototype;
  var hasOwnProperty$3 = objectProto$5.hasOwnProperty;
  var nativeObjectToString$1 = objectProto$5.toString;
  var symToStringTag$1 = Symbol$2 ? Symbol$2.toStringTag : void 0;
  function getRawTag$1(value) {
    var isOwn = hasOwnProperty$3.call(value, symToStringTag$1), tag = value[symToStringTag$1];
    try {
      value[symToStringTag$1] = void 0;
      var unmasked = true;
    } catch (e) {
    }
    var result = nativeObjectToString$1.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag$1] = tag;
      } else {
        delete value[symToStringTag$1];
      }
    }
    return result;
  }
  var _getRawTag = getRawTag$1;
  var objectProto$4 = Object.prototype;
  var nativeObjectToString = objectProto$4.toString;
  function objectToString$1(value) {
    return nativeObjectToString.call(value);
  }
  var _objectToString = objectToString$1;
  var Symbol$1 = _Symbol, getRawTag = _getRawTag, objectToString = _objectToString;
  var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
  var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : void 0;
  function baseGetTag$5(value) {
    if (value == null) {
      return value === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
  }
  var _baseGetTag = baseGetTag$5;
  function isObject$2(value) {
    var type = typeof value;
    return value != null && (type == "object" || type == "function");
  }
  var isObject_1 = isObject$2;
  var baseGetTag$4 = _baseGetTag, isObject$1 = isObject_1;
  var asyncTag = "[object AsyncFunction]", funcTag$1 = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
  function isFunction$1(value) {
    if (!isObject$1(value)) {
      return false;
    }
    var tag = baseGetTag$4(value);
    return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
  }
  var isFunction_1 = isFunction$1;
  var MAX_SAFE_INTEGER$1 = 9007199254740991;
  function isLength$2(value) {
    return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
  }
  var isLength_1 = isLength$2;
  var isFunction = isFunction_1, isLength$1 = isLength_1;
  function isArrayLike$2(value) {
    return value != null && isLength$1(value.length) && !isFunction(value);
  }
  var isArrayLike_1 = isArrayLike$2;
  var isArray$2 = Array.isArray;
  var isArray_1 = isArray$2;
  function isObjectLike$5(value) {
    return value != null && typeof value == "object";
  }
  var isObjectLike_1 = isObjectLike$5;
  var baseGetTag$3 = _baseGetTag, isArray$1 = isArray_1, isObjectLike$4 = isObjectLike_1;
  var stringTag$1 = "[object String]";
  function isString$1(value) {
    return typeof value == "string" || !isArray$1(value) && isObjectLike$4(value) && baseGetTag$3(value) == stringTag$1;
  }
  var isString_1 = isString$1;
  var baseGetTag$2 = _baseGetTag, isObjectLike$3 = isObjectLike_1;
  var symbolTag = "[object Symbol]";
  function isSymbol$1(value) {
    return typeof value == "symbol" || isObjectLike$3(value) && baseGetTag$2(value) == symbolTag;
  }
  var isSymbol_1 = isSymbol$1;
  var isObject = isObject_1, isSymbol = isSymbol_1;
  var NAN = 0 / 0;
  var reTrim = /^\s+|\s+$/g;
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
  var reIsBinary = /^0b[01]+$/i;
  var reIsOctal = /^0o[0-7]+$/i;
  var freeParseInt = parseInt;
  function toNumber$1(value) {
    if (typeof value == "number") {
      return value;
    }
    if (isSymbol(value)) {
      return NAN;
    }
    if (isObject(value)) {
      var other = typeof value.valueOf == "function" ? value.valueOf() : value;
      value = isObject(other) ? other + "" : other;
    }
    if (typeof value != "string") {
      return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, "");
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
  }
  var toNumber_1 = toNumber$1;
  var toNumber = toNumber_1;
  var INFINITY = 1 / 0, MAX_INTEGER = 17976931348623157e292;
  function toFinite$1(value) {
    if (!value) {
      return value === 0 ? value : 0;
    }
    value = toNumber(value);
    if (value === INFINITY || value === -INFINITY) {
      var sign = value < 0 ? -1 : 1;
      return sign * MAX_INTEGER;
    }
    return value === value ? value : 0;
  }
  var toFinite_1 = toFinite$1;
  var toFinite = toFinite_1;
  function toInteger$1(value) {
    var result = toFinite(value), remainder = result % 1;
    return result === result ? remainder ? result - remainder : result : 0;
  }
  var toInteger_1 = toInteger$1;
  function arrayMap$1(array, iteratee) {
    var index = -1, length = array == null ? 0 : array.length, result = Array(length);
    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }
  var _arrayMap = arrayMap$1;
  var arrayMap = _arrayMap;
  function baseValues$1(object, props) {
    return arrayMap(props, function(key) {
      return object[key];
    });
  }
  var _baseValues = baseValues$1;
  function baseTimes$1(n, iteratee) {
    var index = -1, result = Array(n);
    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }
  var _baseTimes = baseTimes$1;
  var baseGetTag$1 = _baseGetTag, isObjectLike$2 = isObjectLike_1;
  var argsTag$1 = "[object Arguments]";
  function baseIsArguments$1(value) {
    return isObjectLike$2(value) && baseGetTag$1(value) == argsTag$1;
  }
  var _baseIsArguments = baseIsArguments$1;
  var baseIsArguments = _baseIsArguments, isObjectLike$1 = isObjectLike_1;
  var objectProto$3 = Object.prototype;
  var hasOwnProperty$2 = objectProto$3.hasOwnProperty;
  var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;
  var isArguments$1 = baseIsArguments(/* @__PURE__ */ function() {
    return arguments;
  }()) ? baseIsArguments : function(value) {
    return isObjectLike$1(value) && hasOwnProperty$2.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
  };
  var isArguments_1 = isArguments$1;
  var isBuffer$1 = { exports: {} };
  function stubFalse() {
    return false;
  }
  var stubFalse_1 = stubFalse;
  isBuffer$1.exports;
  (function(module, exports) {
    var root2 = _root, stubFalse2 = stubFalse_1;
    var freeExports = exports && !exports.nodeType && exports;
    var freeModule = freeExports && true && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var Buffer = moduleExports ? root2.Buffer : void 0;
    var nativeIsBuffer = Buffer ? Buffer.isBuffer : void 0;
    var isBuffer2 = nativeIsBuffer || stubFalse2;
    module.exports = isBuffer2;
  })(isBuffer$1, isBuffer$1.exports);
  var isBufferExports = isBuffer$1.exports;
  var MAX_SAFE_INTEGER = 9007199254740991;
  var reIsUint = /^(?:0|[1-9]\d*)$/;
  function isIndex$1(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER : length;
    return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
  }
  var _isIndex = isIndex$1;
  var baseGetTag = _baseGetTag, isLength = isLength_1, isObjectLike = isObjectLike_1;
  var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag = "[object Object]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", weakMapTag = "[object WeakMap]";
  var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
  function baseIsTypedArray$1(value) {
    return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
  }
  var _baseIsTypedArray = baseIsTypedArray$1;
  function baseUnary$1(func) {
    return function(value) {
      return func(value);
    };
  }
  var _baseUnary = baseUnary$1;
  var _nodeUtil = { exports: {} };
  _nodeUtil.exports;
  (function(module, exports) {
    var freeGlobal2 = _freeGlobal;
    var freeExports = exports && !exports.nodeType && exports;
    var freeModule = freeExports && true && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal2.process;
    var nodeUtil2 = function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    }();
    module.exports = nodeUtil2;
  })(_nodeUtil, _nodeUtil.exports);
  var _nodeUtilExports = _nodeUtil.exports;
  var baseIsTypedArray = _baseIsTypedArray, baseUnary = _baseUnary, nodeUtil = _nodeUtilExports;
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
  var isTypedArray$1 = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
  var isTypedArray_1 = isTypedArray$1;
  var baseTimes = _baseTimes, isArguments = isArguments_1, isArray = isArray_1, isBuffer = isBufferExports, isIndex = _isIndex, isTypedArray = isTypedArray_1;
  var objectProto$2 = Object.prototype;
  var hasOwnProperty$1 = objectProto$2.hasOwnProperty;
  function arrayLikeKeys$1(value, inherited) {
    var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
    for (var key in value) {
      if ((inherited || hasOwnProperty$1.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
      (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
      isIndex(key, length)))) {
        result.push(key);
      }
    }
    return result;
  }
  var _arrayLikeKeys = arrayLikeKeys$1;
  var objectProto$1 = Object.prototype;
  function isPrototype$1(value) {
    var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto$1;
    return value === proto;
  }
  var _isPrototype = isPrototype$1;
  function overArg$1(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }
  var _overArg = overArg$1;
  var overArg = _overArg;
  var nativeKeys$1 = overArg(Object.keys, Object);
  var _nativeKeys = nativeKeys$1;
  var isPrototype = _isPrototype, nativeKeys = _nativeKeys;
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function baseKeys$1(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != "constructor") {
        result.push(key);
      }
    }
    return result;
  }
  var _baseKeys = baseKeys$1;
  var arrayLikeKeys = _arrayLikeKeys, baseKeys = _baseKeys, isArrayLike$1 = isArrayLike_1;
  function keys$1(object) {
    return isArrayLike$1(object) ? arrayLikeKeys(object) : baseKeys(object);
  }
  var keys_1 = keys$1;
  var baseValues = _baseValues, keys = keys_1;
  function values$1(object) {
    return object == null ? [] : baseValues(object, keys(object));
  }
  var values_1 = values$1;
  var baseIndexOf = _baseIndexOf, isArrayLike = isArrayLike_1, isString = isString_1, toInteger = toInteger_1, values = values_1;
  var nativeMax = Math.max;
  function includes(collection, value, fromIndex, guard) {
    collection = isArrayLike(collection) ? collection : values(collection);
    fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
    var length = collection.length;
    if (fromIndex < 0) {
      fromIndex = nativeMax(length + fromIndex, 0);
    }
    return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
  }
  var includes_1 = includes;
  const _includes = /* @__PURE__ */ getDefaultExportFromCjs(includes_1);
  var keycode$1 = { exports: {} };
  (function(module, exports) {
    function keyCode(searchInput) {
      if (searchInput && "object" === typeof searchInput) {
        var hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode;
        if (hasKeyCode) searchInput = hasKeyCode;
      }
      if ("number" === typeof searchInput) return names[searchInput];
      var search = String(searchInput);
      var foundNamedKey = codes[search.toLowerCase()];
      if (foundNamedKey) return foundNamedKey;
      var foundNamedKey = aliases[search.toLowerCase()];
      if (foundNamedKey) return foundNamedKey;
      if (search.length === 1) return search.charCodeAt(0);
      return void 0;
    }
    keyCode.isEventKey = function isEventKey(event, nameOrCode) {
      if (event && "object" === typeof event) {
        var keyCode2 = event.which || event.keyCode || event.charCode;
        if (keyCode2 === null || keyCode2 === void 0) {
          return false;
        }
        if (typeof nameOrCode === "string") {
          var foundNamedKey = codes[nameOrCode.toLowerCase()];
          if (foundNamedKey) {
            return foundNamedKey === keyCode2;
          }
          var foundNamedKey = aliases[nameOrCode.toLowerCase()];
          if (foundNamedKey) {
            return foundNamedKey === keyCode2;
          }
        } else if (typeof nameOrCode === "number") {
          return nameOrCode === keyCode2;
        }
        return false;
      }
    };
    exports = module.exports = keyCode;
    var codes = exports.code = exports.codes = {
      "backspace": 8,
      "tab": 9,
      "enter": 13,
      "shift": 16,
      "ctrl": 17,
      "alt": 18,
      "pause/break": 19,
      "caps lock": 20,
      "esc": 27,
      "space": 32,
      "page up": 33,
      "page down": 34,
      "end": 35,
      "home": 36,
      "left": 37,
      "up": 38,
      "right": 39,
      "down": 40,
      "insert": 45,
      "delete": 46,
      "command": 91,
      "left command": 91,
      "right command": 93,
      "numpad *": 106,
      "numpad +": 107,
      "numpad -": 109,
      "numpad .": 110,
      "numpad /": 111,
      "num lock": 144,
      "scroll lock": 145,
      "my computer": 182,
      "my calculator": 183,
      ";": 186,
      "=": 187,
      ",": 188,
      "-": 189,
      ".": 190,
      "/": 191,
      "`": 192,
      "[": 219,
      "\\": 220,
      "]": 221,
      "'": 222
    };
    var aliases = exports.aliases = {
      "windows": 91,
      "⇧": 16,
      "⌥": 18,
      "⌃": 17,
      "⌘": 91,
      "ctl": 17,
      "control": 17,
      "option": 18,
      "pause": 19,
      "break": 19,
      "caps": 20,
      "return": 13,
      "escape": 27,
      "spc": 32,
      "spacebar": 32,
      "pgup": 33,
      "pgdn": 34,
      "ins": 45,
      "del": 46,
      "cmd": 91
    };
    /*!
     * Programatically add the following
     */
    for (i = 97; i < 123; i++) codes[String.fromCharCode(i)] = i - 32;
    for (var i = 48; i < 58; i++) codes[i - 48] = i;
    for (i = 1; i < 13; i++) codes["f" + i] = i + 111;
    for (i = 0; i < 10; i++) codes["numpad " + i] = i + 96;
    var names = exports.names = exports.title = {};
    for (i in codes) names[codes[i]] = i;
    for (var alias in aliases) {
      codes[alias] = aliases[alias];
    }
  })(keycode$1, keycode$1.exports);
  var keycodeExports = keycode$1.exports;
  const keycode = /* @__PURE__ */ getDefaultExportFromCjs(keycodeExports);
  function toggleEdit(location) {
    const query = "?edit=true", endQuery = "&edit=true";
    let url, queryIndex, endQueryIndex;
    location = location || /* istanbul ignore next: can't stub window.location */
    window.location;
    url = `${location.protocol}//${location.host}${location.pathname}${location.search}`;
    queryIndex = url.indexOf(query);
    endQueryIndex = url.indexOf(endQuery);
    if (queryIndex > -1) {
      url = url.substring(0, queryIndex);
    } else if (endQueryIndex > -1) {
      url = url.substring(0, endQueryIndex);
    } else if (url.indexOf("?") > -1) {
      url = url + endQuery;
    } else {
      url = url + query;
    }
    location.assign(url);
  }
  let secretKilnKey = "";
  function showLogo() {
    var logo = document.querySelector(".clay-kiln-logo");
    if (logo) {
      logo.classList.add("show");
    }
  }
  function addListeners() {
    document.addEventListener("keydown", function(e) {
      const key = keycode(e);
      if (_includes(["c", "l", "a", "y"], key) && e.shiftKey === true) {
        secretKilnKey += key;
      } else {
        secretKilnKey = "";
      }
      if (secretKilnKey === "clay") {
        showLogo();
      } else if (secretKilnKey.length > 4 && _includes(secretKilnKey, "clay")) {
        toggleEdit();
      } else if (secretKilnKey.length > 4) {
        secretKilnKey = "";
      }
    });
    document.addEventListener("keyup", function() {
      if (secretKilnKey === "clay") {
        toggleEdit();
      }
    });
  }
  addListeners();
})();
