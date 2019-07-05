export default {
  editMode: 'page', // or 'layout'
  // data for components and the current page
  components: {}, // component data, keyed by uri
  componentDefaults: {}, // default component data, used when creating new components
  componentVariations: {}, // components that have variations and their variations
  page: {
    uri: null,
    data: {}, // page data
    state: {} // this page's representation in the list (data that's sent to the page list)
  },
  layout: {}, // layout state, from the layouts index
  user: {},
  // ui state management
  ui: {
    currentForm: null, // currently opened form, gets { uri, path, data }
    currentAddComponentModal: null, // current "add component" modal, gets { currentURI, parentURI, path, available }
    currentModal: null, // current "simple" modal, gets { title, type, size, data }
    currentConfirm: null, // current "confirmation" modal, gets { title, text, button, onConfirm }
    currentDrawer: null, // current drawer menu
    currentSelection: null, // currently selected component, gets uri
    currentFocus: null, // currently focused field/group, gets { uri, path }
    showNavBackground: false, // show/hide the shaded semi-transparent background, used when some drawers are open
    currentProgress: 0, // progress bar, gets random number (to prevent flashes)
    currentlySaving: false, // don't focus components while forms are saving, gets boolean
    currentlyRestoring: false, // if the page is currently being restored to the published version, gets boolean
    currentlyPublishing: false, // if the page is being published
    metaKey: false, // set to true when meta key is pressed, enables additional functionality in kiln
    alerts: [], // array of alerts to display to the user
    snackbar: {}, // current (or previous) snackbar.
    favoritePageCategory: '' // id of the last new-pages category used
    // note: snackbars are created imperitively (settings this simply informs the toolbar to create a new snackbar),
    // so this won't always be the snackbar displayed (it will be either the one displayed or the previous one displayed)
  },
  // publishing validation
  validation: {
    errors: [],
    warnings: [],
    metadataErrors: [],
    metadataWarnings: [],
    kilnjsErrors: []
  },
  // read-only
  schemas: {},
  locals: {},
  models: {},
  componentKilnjs: {},
  templates: {},
  site: {},
  allSites: {},
  url: {},
  lists: {}, // /_lists/ things we want to add to the store
  isLoading: true, // preloading has started
  undo: {
    atStart: true, // boolean if we're at the start of the history (no undo)
    atEnd: true, // boolean if we're at the end of the history (no redo)
    cursor: 0 // current snapshot the user is on. used to undo/redo non-destructively
  }
};
