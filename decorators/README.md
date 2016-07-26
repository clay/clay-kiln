## Decorators

Decorators get applied to each element with the `data-editable` attribute. They use a [Chain of Responsibility](https://en.wikipedia.org/wiki/Chain-of-responsibility_pattern) pattern, where each element is checked whether it should have a decorator applied and then the handler is called if applicable.

### When

Each decorator should export a `when` method. It looks like this:

```js
/**
 * determine if the decorator should be applied
 * @param {Element} el
 * @param {object} options
 * @param {string} options.ref component reference
 * @param {string} options.path path to the field or group
 * @param {object} options.data field or group data
 * @param {object} options.componentData full data for the component
 * @returns {boolean}
 */
function when(el, options) {
  return true;
}
```

### Handler

Each decorator should export a `handler` method that applies stuff to the element. The handler is only called if the `when` method returns `true`.

```js
/**
 * apply the decorator
 * @param {Element} el
 * @param {object} options
 * @param {string} options.ref component reference
 * @param {string} options.path path to the field or group
 * @param {object} options.data field or group data
 * @param {object} options.componentData full data for the component
 * @returns {Element} el
 */
function handler(el, options) {
  // do something to the el, based on the data
  return el;
}
```
