(function() {
	// \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __esmMin = (fn, res, err) => () => {
		if (err) throw err[0];
		try {
			return fn && (res = fn(fn = 0)), res;
		} catch (e) {
			throw err = [e], e;
		}
	};
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	// node_modules/lodash/_baseFindIndex.js
	var require__baseFindIndex = __commonJSMin(((exports, module) => {
		function baseFindIndex(array, predicate, fromIndex, fromRight) {
			var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
			while (fromRight ? index-- : ++index < length) if (predicate(array[index], index, array)) return index;
			return -1;
		}
		module.exports = baseFindIndex;
	}));
	// node_modules/lodash/_baseIsNaN.js
	var require__baseIsNaN = __commonJSMin(((exports, module) => {
		function baseIsNaN(value) {
			return value !== value;
		}
		module.exports = baseIsNaN;
	}));
	// node_modules/lodash/_strictIndexOf.js
	var require__strictIndexOf = __commonJSMin(((exports, module) => {
		function strictIndexOf(array, value, fromIndex) {
			var index = fromIndex - 1, length = array.length;
			while (++index < length) if (array[index] === value) return index;
			return -1;
		}
		module.exports = strictIndexOf;
	}));
	// node_modules/lodash/_baseIndexOf.js
	var require__baseIndexOf = __commonJSMin(((exports, module) => {
		var baseFindIndex = require__baseFindIndex();
		var baseIsNaN = require__baseIsNaN();
		var strictIndexOf = require__strictIndexOf();
		function baseIndexOf(array, value, fromIndex) {
			return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
		}
		module.exports = baseIndexOf;
	}));
	// node_modules/vite-plugin-node-polyfills/shims/global/dist/index.js
	var global;
	var init_dist = __esmMin((() => {
		global = globalThis || self;
	}));
	// node_modules/lodash/_freeGlobal.js
	var require__freeGlobal = __commonJSMin(((exports, module) => {
		init_dist();
		module.exports = typeof global == "object" && global && global.Object === Object && global;
	}));
	// node_modules/lodash/_root.js
	var require__root = __commonJSMin(((exports, module) => {
		var freeGlobal = require__freeGlobal();
		var freeSelf = typeof self == "object" && self && self.Object === Object && self;
		module.exports = freeGlobal || freeSelf || Function("return this")();
	}));
	// node_modules/lodash/_Symbol.js
	var require__Symbol = __commonJSMin(((exports, module) => {
		module.exports = require__root().Symbol;
	}));
	// node_modules/lodash/_getRawTag.js
	var require__getRawTag = __commonJSMin(((exports, module) => {
		var Symbol = require__Symbol();
		var objectProto = Object.prototype;
		var hasOwnProperty = objectProto.hasOwnProperty;
		var nativeObjectToString = objectProto.toString;
		var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
		function getRawTag(value) {
			var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
			try {
				value[symToStringTag] = void 0;
				var unmasked = true;
			} catch (e) {}
			var result = nativeObjectToString.call(value);
			if (unmasked) {
				if (isOwn) value[symToStringTag] = tag;
				else delete value[symToStringTag];
			}
			return result;
		}
		module.exports = getRawTag;
	}));
	// node_modules/lodash/_objectToString.js
	var require__objectToString = __commonJSMin(((exports, module) => {
		var nativeObjectToString = Object.prototype.toString;
		function objectToString(value) {
			return nativeObjectToString.call(value);
		}
		module.exports = objectToString;
	}));
	// node_modules/lodash/_baseGetTag.js
	var require__baseGetTag = __commonJSMin(((exports, module) => {
		var Symbol = require__Symbol();
		var getRawTag = require__getRawTag();
		var objectToString = require__objectToString();
		var nullTag = "[object Null]";
		var undefinedTag = "[object Undefined]";
		var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
		function baseGetTag(value) {
			if (value == null) return value === void 0 ? undefinedTag : nullTag;
			return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
		}
		module.exports = baseGetTag;
	}));
	// node_modules/lodash/isObject.js
	var require_isObject = __commonJSMin(((exports, module) => {
		function isObject(value) {
			var type = typeof value;
			return value != null && (type == "object" || type == "function");
		}
		module.exports = isObject;
	}));
	// node_modules/lodash/isFunction.js
	var require_isFunction = __commonJSMin(((exports, module) => {
		var baseGetTag = require__baseGetTag();
		var isObject = require_isObject();
		var asyncTag = "[object AsyncFunction]";
		var funcTag = "[object Function]";
		var genTag = "[object GeneratorFunction]";
		var proxyTag = "[object Proxy]";
		function isFunction(value) {
			if (!isObject(value)) return false;
			var tag = baseGetTag(value);
			return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
		}
		module.exports = isFunction;
	}));
	// node_modules/lodash/isLength.js
	var require_isLength = __commonJSMin(((exports, module) => {
		var MAX_SAFE_INTEGER = 9007199254740991;
		function isLength(value) {
			return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
		}
		module.exports = isLength;
	}));
	// node_modules/lodash/isArrayLike.js
	var require_isArrayLike = __commonJSMin(((exports, module) => {
		var isFunction = require_isFunction();
		var isLength = require_isLength();
		function isArrayLike(value) {
			return value != null && isLength(value.length) && !isFunction(value);
		}
		module.exports = isArrayLike;
	}));
	// node_modules/lodash/isArray.js
	var require_isArray = __commonJSMin(((exports, module) => {
		module.exports = Array.isArray;
	}));
	// node_modules/lodash/isObjectLike.js
	var require_isObjectLike = __commonJSMin(((exports, module) => {
		function isObjectLike(value) {
			return value != null && typeof value == "object";
		}
		module.exports = isObjectLike;
	}));
	// node_modules/lodash/isString.js
	var require_isString = __commonJSMin(((exports, module) => {
		var baseGetTag = require__baseGetTag();
		var isArray = require_isArray();
		var isObjectLike = require_isObjectLike();
		var stringTag = "[object String]";
		function isString(value) {
			return typeof value == "string" || !isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag;
		}
		module.exports = isString;
	}));
	// node_modules/lodash/isSymbol.js
	var require_isSymbol = __commonJSMin(((exports, module) => {
		var baseGetTag = require__baseGetTag();
		var isObjectLike = require_isObjectLike();
		var symbolTag = "[object Symbol]";
		function isSymbol(value) {
			return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
		}
		module.exports = isSymbol;
	}));
	// node_modules/lodash/toNumber.js
	var require_toNumber = __commonJSMin(((exports, module) => {
		var isObject = require_isObject();
		var isSymbol = require_isSymbol();
		var NAN = NaN;
		var reTrim = /^\s+|\s+$/g;
		var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
		var reIsBinary = /^0b[01]+$/i;
		var reIsOctal = /^0o[0-7]+$/i;
		var freeParseInt = parseInt;
		function toNumber(value) {
			if (typeof value == "number") return value;
			if (isSymbol(value)) return NAN;
			if (isObject(value)) {
				var other = typeof value.valueOf == "function" ? value.valueOf() : value;
				value = isObject(other) ? other + "" : other;
			}
			if (typeof value != "string") return value === 0 ? value : +value;
			value = value.replace(reTrim, "");
			var isBinary = reIsBinary.test(value);
			return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
		}
		module.exports = toNumber;
	}));
	// node_modules/lodash/toFinite.js
	var require_toFinite = __commonJSMin(((exports, module) => {
		var toNumber = require_toNumber();
		var INFINITY = 1 / 0;
		var MAX_INTEGER = 17976931348623157e292;
		function toFinite(value) {
			if (!value) return value === 0 ? value : 0;
			value = toNumber(value);
			if (value === INFINITY || value === -INFINITY) return (value < 0 ? -1 : 1) * MAX_INTEGER;
			return value === value ? value : 0;
		}
		module.exports = toFinite;
	}));
	// node_modules/lodash/toInteger.js
	var require_toInteger = __commonJSMin(((exports, module) => {
		var toFinite = require_toFinite();
		function toInteger(value) {
			var result = toFinite(value), remainder = result % 1;
			return result === result ? remainder ? result - remainder : result : 0;
		}
		module.exports = toInteger;
	}));
	// node_modules/lodash/_arrayMap.js
	var require__arrayMap = __commonJSMin(((exports, module) => {
		function arrayMap(array, iteratee) {
			var index = -1, length = array == null ? 0 : array.length, result = Array(length);
			while (++index < length) result[index] = iteratee(array[index], index, array);
			return result;
		}
		module.exports = arrayMap;
	}));
	// node_modules/lodash/_baseValues.js
	var require__baseValues = __commonJSMin(((exports, module) => {
		var arrayMap = require__arrayMap();
		function baseValues(object, props) {
			return arrayMap(props, function(key) {
				return object[key];
			});
		}
		module.exports = baseValues;
	}));
	// node_modules/lodash/_baseTimes.js
	var require__baseTimes = __commonJSMin(((exports, module) => {
		function baseTimes(n, iteratee) {
			var index = -1, result = Array(n);
			while (++index < n) result[index] = iteratee(index);
			return result;
		}
		module.exports = baseTimes;
	}));
	// node_modules/lodash/_baseIsArguments.js
	var require__baseIsArguments = __commonJSMin(((exports, module) => {
		var baseGetTag = require__baseGetTag();
		var isObjectLike = require_isObjectLike();
		var argsTag = "[object Arguments]";
		function baseIsArguments(value) {
			return isObjectLike(value) && baseGetTag(value) == argsTag;
		}
		module.exports = baseIsArguments;
	}));
	// node_modules/lodash/isArguments.js
	var require_isArguments = __commonJSMin(((exports, module) => {
		var baseIsArguments = require__baseIsArguments();
		var isObjectLike = require_isObjectLike();
		var objectProto = Object.prototype;
		var hasOwnProperty = objectProto.hasOwnProperty;
		var propertyIsEnumerable = objectProto.propertyIsEnumerable;
		module.exports = baseIsArguments(function() {
			return arguments;
		}()) ? baseIsArguments : function(value) {
			return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
		};
	}));
	// node_modules/lodash/stubFalse.js
	var require_stubFalse = __commonJSMin(((exports, module) => {
		function stubFalse() {
			return false;
		}
		module.exports = stubFalse;
	}));
	// node_modules/lodash/isBuffer.js
	var require_isBuffer = __commonJSMin(((exports, module) => {
		var root = require__root();
		var stubFalse = require_stubFalse();
		var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
		var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
		var Buffer = freeModule && freeModule.exports === freeExports ? root.Buffer : void 0;
		module.exports = (Buffer ? Buffer.isBuffer : void 0) || stubFalse;
	}));
	// node_modules/lodash/_isIndex.js
	var require__isIndex = __commonJSMin(((exports, module) => {
		var MAX_SAFE_INTEGER = 9007199254740991;
		var reIsUint = /^(?:0|[1-9]\d*)$/;
		function isIndex(value, length) {
			var type = typeof value;
			length = length == null ? MAX_SAFE_INTEGER : length;
			return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
		}
		module.exports = isIndex;
	}));
	// node_modules/lodash/_baseIsTypedArray.js
	var require__baseIsTypedArray = __commonJSMin(((exports, module) => {
		var baseGetTag = require__baseGetTag();
		var isLength = require_isLength();
		var isObjectLike = require_isObjectLike();
		var argsTag = "[object Arguments]";
		var arrayTag = "[object Array]";
		var boolTag = "[object Boolean]";
		var dateTag = "[object Date]";
		var errorTag = "[object Error]";
		var funcTag = "[object Function]";
		var mapTag = "[object Map]";
		var numberTag = "[object Number]";
		var objectTag = "[object Object]";
		var regexpTag = "[object RegExp]";
		var setTag = "[object Set]";
		var stringTag = "[object String]";
		var weakMapTag = "[object WeakMap]";
		var arrayBufferTag = "[object ArrayBuffer]";
		var dataViewTag = "[object DataView]";
		var float32Tag = "[object Float32Array]";
		var float64Tag = "[object Float64Array]";
		var int8Tag = "[object Int8Array]";
		var int16Tag = "[object Int16Array]";
		var int32Tag = "[object Int32Array]";
		var uint8Tag = "[object Uint8Array]";
		var uint8ClampedTag = "[object Uint8ClampedArray]";
		var uint16Tag = "[object Uint16Array]";
		var uint32Tag = "[object Uint32Array]";
		var typedArrayTags = {};
		typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
		typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
		function baseIsTypedArray(value) {
			return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
		}
		module.exports = baseIsTypedArray;
	}));
	// node_modules/lodash/_baseUnary.js
	var require__baseUnary = __commonJSMin(((exports, module) => {
		function baseUnary(func) {
			return function(value) {
				return func(value);
			};
		}
		module.exports = baseUnary;
	}));
	// node_modules/lodash/_nodeUtil.js
	var require__nodeUtil = __commonJSMin(((exports, module) => {
		var freeGlobal = require__freeGlobal();
		var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
		var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
		var freeProcess = freeModule && freeModule.exports === freeExports && freeGlobal.process;
		module.exports = function() {
			try {
				var types = freeModule && freeModule.require && freeModule.require("util").types;
				if (types) return types;
				return freeProcess && freeProcess.binding && freeProcess.binding("util");
			} catch (e) {}
		}();
	}));
	// node_modules/lodash/isTypedArray.js
	var require_isTypedArray = __commonJSMin(((exports, module) => {
		var baseIsTypedArray = require__baseIsTypedArray();
		var baseUnary = require__baseUnary();
		var nodeUtil = require__nodeUtil();
		var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
		module.exports = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
	}));
	// node_modules/lodash/_arrayLikeKeys.js
	var require__arrayLikeKeys = __commonJSMin(((exports, module) => {
		var baseTimes = require__baseTimes();
		var isArguments = require_isArguments();
		var isArray = require_isArray();
		var isBuffer = require_isBuffer();
		var isIndex = require__isIndex();
		var isTypedArray = require_isTypedArray();
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		function arrayLikeKeys(value, inherited) {
			var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
			for (var key in value) if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isBuff && (key == "offset" || key == "parent") || isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || isIndex(key, length)))) result.push(key);
			return result;
		}
		module.exports = arrayLikeKeys;
	}));
	// node_modules/lodash/_isPrototype.js
	var require__isPrototype = __commonJSMin(((exports, module) => {
		var objectProto = Object.prototype;
		function isPrototype(value) {
			var Ctor = value && value.constructor;
			return value === (typeof Ctor == "function" && Ctor.prototype || objectProto);
		}
		module.exports = isPrototype;
	}));
	// node_modules/lodash/_overArg.js
	var require__overArg = __commonJSMin(((exports, module) => {
		function overArg(func, transform) {
			return function(arg) {
				return func(transform(arg));
			};
		}
		module.exports = overArg;
	}));
	// node_modules/lodash/_nativeKeys.js
	var require__nativeKeys = __commonJSMin(((exports, module) => {
		module.exports = require__overArg()(Object.keys, Object);
	}));
	// node_modules/lodash/_baseKeys.js
	var require__baseKeys = __commonJSMin(((exports, module) => {
		var isPrototype = require__isPrototype();
		var nativeKeys = require__nativeKeys();
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		function baseKeys(object) {
			if (!isPrototype(object)) return nativeKeys(object);
			var result = [];
			for (var key in Object(object)) if (hasOwnProperty.call(object, key) && key != "constructor") result.push(key);
			return result;
		}
		module.exports = baseKeys;
	}));
	// node_modules/lodash/keys.js
	var require_keys = __commonJSMin(((exports, module) => {
		var arrayLikeKeys = require__arrayLikeKeys();
		var baseKeys = require__baseKeys();
		var isArrayLike = require_isArrayLike();
		function keys(object) {
			return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
		}
		module.exports = keys;
	}));
	// node_modules/lodash/values.js
	var require_values = __commonJSMin(((exports, module) => {
		var baseValues = require__baseValues();
		var keys = require_keys();
		function values(object) {
			return object == null ? [] : baseValues(object, keys(object));
		}
		module.exports = values;
	}));
	// node_modules/lodash/includes.js
	var require_includes = __commonJSMin(((exports, module) => {
		var baseIndexOf = require__baseIndexOf();
		var isArrayLike = require_isArrayLike();
		var isString = require_isString();
		var toInteger = require_toInteger();
		var values = require_values();
		var nativeMax = Math.max;
		function includes(collection, value, fromIndex, guard) {
			collection = isArrayLike(collection) ? collection : values(collection);
			fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
			var length = collection.length;
			if (fromIndex < 0) fromIndex = nativeMax(length + fromIndex, 0);
			return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
		}
		module.exports = includes;
	}));
	// node_modules/keycode/index.js
	var require_keycode = __commonJSMin(((exports, module) => {
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
		}
		keyCode.isEventKey = function isEventKey(event, nameOrCode) {
			if (event && "object" === typeof event) {
				var keyCode = event.which || event.keyCode || event.charCode;
				if (keyCode === null || keyCode === void 0) return false;
				if (typeof nameOrCode === "string") {
					var foundNamedKey = codes[nameOrCode.toLowerCase()];
					if (foundNamedKey) return foundNamedKey === keyCode;
					var foundNamedKey = aliases[nameOrCode.toLowerCase()];
					if (foundNamedKey) return foundNamedKey === keyCode;
				} else if (typeof nameOrCode === "number") return nameOrCode === keyCode;
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
		for (var alias in aliases) codes[alias] = aliases[alias];
	}));
	// lib/utils/toggle-edit.js
	var import_includes = __toESM(require_includes());
	var import_keycode = __toESM(require_keycode());
	function toggleEdit(location) {
		const query = "?edit=true", endQuery = "&edit=true";
		let url, queryIndex, endQueryIndex;
		location = location || window.location;
		url = `${location.protocol}//${location.host}${location.pathname}${location.search}`;
		queryIndex = url.indexOf(query);
		endQueryIndex = url.indexOf(endQuery);
		if (queryIndex > -1) url = url.substring(0, queryIndex);
		else if (endQueryIndex > -1) url = url.substring(0, endQueryIndex);
		else if (url.indexOf("?") > -1) url = url + endQuery;
		else url = url + query;
		location.assign(url);
	}
	// lib/utils/shift-clay.js
	var secretKilnKey = "";
	function showLogo() {
		var logo = document.querySelector(".clay-kiln-logo");
		if (logo) logo.classList.add("show");
	}
	function addListeners() {
		document.addEventListener("keydown", function(e) {
			const key = (0, import_keycode.default)(e);
			if ((0, import_includes.default)([
				"c",
				"l",
				"a",
				"y"
			], key) && e.shiftKey === true) secretKilnKey += key;
			else secretKilnKey = "";
			if (secretKilnKey === "clay") showLogo();
			else if (secretKilnKey.length > 4 && (0, import_includes.default)(secretKilnKey, "clay")) toggleEdit();
			else if (secretKilnKey.length > 4) secretKilnKey = "";
		});
		document.addEventListener("keyup", function() {
			if (secretKilnKey === "clay") toggleEdit();
		});
	}
	// view-public.js
	addListeners();
})();
