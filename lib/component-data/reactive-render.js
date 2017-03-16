import { RENDER_COMPONENT } from './mutationTypes';
import { render as renderTemplate } from './template';
import { decorateURIAndChildren } from '../decorators';

/**
 * replace and decorate a component that was rendered server-side
 * note: this will be removed in kiln v2.0
 * @param  {string} uri
 * @param  {Element} html
 */
function renderServerHTML(uri, html) {
  // replace the html (of all matching elements) and decorate
  decorateURIAndChildren(uri, html);
}

/**
 * render a component client-side based on data
 * @param  {string} uri
 * @param  {object} data
 */
function renderClientData(uri, data) {
  // render, then replace the html (of all matching elements) and decorate
  renderTemplate(uri, data).then((html) => decorateURIAndChildren(uri, html));
}

export default function reactiveRender(store) {
  store.subscribe((mutation) => {
    if (mutation.type === RENDER_COMPONENT) {
      const uri = mutation.payload.uri,
        data = mutation.payload.data,
        html = mutation.payload.html;

      if (html) {
        // server-side legacy html
        renderServerHTML(uri, html);
      } else if (data) {
        renderClientData(uri, data);
      }
    }
  });
}
