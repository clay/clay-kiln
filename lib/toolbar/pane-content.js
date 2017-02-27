export default {
  'clay-menu': {
    title: 'Clay Menu',
    tabbed: true,
    large: true,
    content: [{
      centered: false,
      title: 'My Pages',
      tabContent: {
        component: 'page-list',
        args: {
          number: 1
        }
      }
    }, {
      centered: false,
      size: 'small',
      title: 'All Pages',
      tabContent: {
        component: 'placeholder',
        args: {
          number: 2
        }
      }
    }, {
      centered: false,
      size: 'small',
      title: 'Searches',
      tabContent: {
        component: 'placeholder',
        args: {
          number: 3
        }
      }
    }, {
      centered: false,
      size: 'small',
      title: 'New Page',
      tabContent: {
        component: 'placeholder',
        args: {
          number: 4
        }
      }
    }]
  },
  'new-page': {
    title: 'New Page',
    component: 'new-page'
  },
  'publish': {
    title: 'Page Status',
    tabbed: true,
    content: [{
      centered: false,
      title: 'Publish',
      tabContent: {
        component: 'edit-publish'
      }
    }, {
      centered: false,
      size: 'small',
      title: 'Health',
      tabContent: {
        component: 'placeholder',
      }
    }, {
      centered: false,
      size: 'small',
      title: 'History',
      tabContent: {
        component: 'placeholder',
      }
    }, {
      centered: false,
      size: 'small',
      title: 'Location',
      tabContent: {
        component: 'placeholder',
      }
    }]
  },
  'preview': {
    title: 'Preview',
    tabbed: true,
    content: [{
      centered: false,
      size: 'small',
      title: 'Preview Links',
      tabContent: {
        component: 'preview-actions'
      }
    }, {
      centered: false,
      size: 'small',
      title: 'Shareable Link',
      tabContent: {
        component: 'preview-share',
      }
    }]
  },
  'components': {
    title: 'Components',
    tabbed: true,
    content: [{
      centered: false,
      title: 'Find Component',
      tabContent: {
        component: 'find-component'
      }
    }, {
      centered: false,
      title: 'Head',
      tabContent: {
        component: 'placeholder',
      }
    }, {
      centered: false,
      title: 'Head Layout',
      tabContent: {
        component: 'placeholder',
      }
    }, {
      centered: false,
      title: 'Foot',
      tabContent: {
        component: 'placeholder',
      }
    }]
  }
}

