import store from '../core-data/store';

const getDragDelay = () => {
  // Elements that use SortableJS have a dragDelay property which is the ms
  // the user must hold the element before they can drag it.  On desktop this
  // should be 0.
    let dragDelay = 0;

    if (window.matchMedia && window.matchMedia('(hover: none)').matches || 'ontouchstart' in document.documentElement) {
      // for devices that don't support hover (i.e. mobile devices), dragDelay is set to 200 so users
      //  can scroll without triggering drags every time their finger touches a draggable element
      dragDelay = 200;
    }

    return dragDelay;
  },
  disableSortableWhenFocused = (sortable) => {
    store.subscribe((mutation) => {
      // When an element has focus, i.e. is being edited, the sortable is disabled so it doesn't interfere with the wysiwyg editor
      switch (mutation.type) {
        case 'FOCUS':
          sortable.option('disabled', true);
          break;
        case 'UN_FOCUS':
          sortable.option('disabled', false);
          break;
        default:
      }
    });
  };

export { getDragDelay, disableSortableWhenFocused };
