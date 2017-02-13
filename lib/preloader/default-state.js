export default {
  // data for components and the current page
  components: {}, // component data, keyed by uri
  tree: {}, // tree of component refs. root has two props, pageURI and layoutURI
  page: {
    uri: null,
    data: {}, // page data
    state: {} // scheduled, published, etc
  },
  // data for lists
  lists: {
    users: [],
    authors: [],
    'new-pages': [],
    tags: []
  },
  // data for logged-in user
  user: {},
  // ui state management
  ui: {
    currentForm: null,
    currentPane: null,
    currentSelection: null,
    currentFocus: null
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
  isLoading: true
};
