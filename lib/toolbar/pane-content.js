export default {
  'clay-menu': {
    title: 'Clay Menu',
    tabbed: true,
    content: [{
      centered: false,
      size: 'medium',
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
  'components': {
    title: 'Components',
    component: 'filterable-list',
    content: [{
      id: 23123,
      title: 'An Item 1'
    }, {
      id: 657,
      title: 'An Item 2'
    }, {
      id: 23123987,
      title: 'An Item 3'
    }, {
      id: 12,
      title: 'An Item 4'
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
  }
}

