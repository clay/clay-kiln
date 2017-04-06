export default {
  // data for components and the current page
  components: {}, // component data, keyed by uri
  componentDefaults: {}, // default component data, used when creating new components
  page: {
    uri: null,
    data: {}, // page data
    state: {} // scheduled, published, etc
  },
  user: {},
  // ui state management
  ui: {
    currentForm: null, // gets { uri, path, data }
    currentPane: null, // gets { name, previous, content }
    currentSelection: null, // gets uri
    currentFocus: null, // gets { uri, path }
    currentStatus: null, // gets { type, message, action, isPermanent }
    currentProgress: 0, // gets boolean
    progressColor: null // gets string
  },
  // publishing validation
  validation: {
    errors: [],
    warnings: []
  },
  // read-only
  schemas: {},
  locals: {},
  models: {},
  templates: {},
  site: {},
  url: {},
  isLoading: true
};
