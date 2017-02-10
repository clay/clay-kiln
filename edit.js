import store from './lib/core-data/store';
import { preload } from './lib/preloader/actions';

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

// kick off loading when DOM is ready
// note: preloaded data, external behaviors, decorators, and validation rules should already be added
// when this event fires
document.addEventListener('DOMContentLoaded', function () {
  store.subscribe(() => {
    console.log('state updated!')
    console.log(store.getState())
  })

  store.dispatch(preload());
});
