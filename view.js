import addClayListeners from './lib/utils/shift-clay';

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

addClayListeners();
