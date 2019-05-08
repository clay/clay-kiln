<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';
  @import '../../styleguide/clay-menu-columns';

  .page-list {
    display: flex;
    flex-direction: column;
    width: 100%;

    // note: left nav menu appears at 600px (it's 200px wide),
    // so all other breakpoints go from 800px
    @media screen and (min-width: $site-title-status-columns) {
      max-width: calc(100vw - 200px);
    }

    @media screen and (min-width: $all-columns-sidebar) {
      max-width: $all-columns;
    }
  }

  .page-list-controls {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    padding: 8px;
    width: 100%;

    @media screen and (min-width: $site-title-status-columns-sidebar) {
      padding: 16px 16px 16px 8px;
    }
  }

  .page-list-sites {
    flex: 0 0 auto;
    margin-right: 8px;
    max-width: 140px;

    @media screen and (min-width: $site-title-status-columns-sidebar) {
      max-width: 300px;
    }
  }

  .page-list-search {
    flex: 0 1 100%;
  }

  .page-list-status-small {
    display: inline-flex;
    flex: 0 0 auto;
    margin-left: 8px;

    @media screen and (min-width: $all-columns-sidebar) {
      display: none;
    }
  }

  .status-selector.page-list-status-large {
    display: none;
    flex: 0 0 auto;
    margin-left: 8px;

    .status-selector-radio:first-child {
      margin-left: 0;
    }

    @media screen and (min-width: $all-columns-sidebar) {
      display: flex;
    }
  }

  .page-list-headers {
    @include type-list-header();

    align-items: center;
    background-color: $md-grey-50;
    border-top: 1px solid $divider-color;
    display: none;
    flex: 0 0 auto;
    padding: 8px 16px;

    @media screen and (min-width: $site-title-status-columns-sidebar) {
      display: flex;
    }

    .page-list-header {
      @include type-list-header();

      height: auto;
      justify-content: start;
      padding: 0;

      &:hover {
        background-color: transparent;
      }

      &-site {
        flex: 0 0 $site-column;
      }

      &-title {
        flex: 1 1 $title-column;
      }

      &-byline {
        display: none;
        flex: 0 0 $byline-column;

        @media screen and (min-width: $site-title-byline-status-columns-sidebar) {
          display: inline;
        }
      }

      &-status {
        flex: 0 0 $status-column;
        text-align: right;

        @media screen and (min-width: $all-columns-sidebar) {
          text-align: left;
        }
      }

      &-collaborators {
        cursor: default;
        display: none;
        flex: 0 0 $collaborators-column;

        @media screen and (min-width: $all-columns-sidebar) {
          display: inline;
        }
      }

      & > .ui-button__content {
        font-weight: normal;
        justify-content: start;
      }
    }
  }

  .page-list-readout {
    display: flex;
    flex: 0 1 100%;
    flex-direction: column;
    overflow-y: scroll;

    .page-list-load-more {
      border-top: 1px solid $divider-color;
      display: flex;
      flex: 0 0 auto;
      justify-content: center;
      padding: 16px;
    }
  }
</style>

<template>
  <div class="page-list">
    <div class="page-list-controls">
      <ui-button buttonType="button" class="page-list-sites" type="secondary" color="default" has-dropdown ref="sitesDropdown" @dropdown-open="onPopoverOpen" @dropdown-close="onPopoverClose">
        <span class="page-list-selected-site">{{ selectedSite }}</span>
        <site-selector slot="dropdown" :sites="sites" @select="selectSite" @multi-select="selectMultipleSites"></site-selector>
      </ui-button>
      <ui-textbox class="page-list-search" v-model.trim="query" type="search" autofocus placeholder="Search by Title or Byline" @input="filterList"></ui-textbox>
      <ui-icon-button class="page-list-status-small" type="secondary" icon="filter_list" has-dropdown ref="statusDropdown" @dropdown-open="onPopoverOpen" @dropdown-close="onPopoverClose">
        <status-selector slot="dropdown" :selectedStatus="selectedStatus" :vertical="true" @select="selectStatus"></status-selector>
      </ui-icon-button>
      <status-selector class="page-list-status-large" :selectedStatus="selectedStatus" @select="selectStatus"></status-selector>
    </div>
    <div class="page-list-headers">
      <span v-if="multipleSitesSelected" class="page-list-header page-list-header-site">Site</span>
      <ui-button
        v-for="header in headerTitles"
        :key="header.key"
        buttonType="button"
        :class="[`page-list-header page-list-header-${header.key}`]"
        disableRipple
        :icon="sortBy === header.sortField ? sortIcon : null"
        iconPosition="right"
        size="small"
        type="secondary"
        @click="header.key !== 'collaborators' && sortByField(header.sortField)"
      >
        {{ header.title }}
      </ui-button>
    </div>
    <div class="page-list-readout">
      <page-list-item
        v-for="(page, pageIndex) in pages"
        :key="pageIndex"
        :page="page"
        :multipleSitesSelected="multipleSitesSelected"
        :isPopoverOpen="isPopoverOpen"
        @setSite="setSingleSite"
        @setQuery="setQuery"
        @setStatus="selectStatus"></page-list-item>
      <div class="page-list-load-more" v-if="showLoadMore">
        <ui-button type="secondary" class="page-list-load-more-button" @click="fetchPages">Load More</ui-button>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { postJSON } from '../core-data/api';
  import { searchRoute } from '../utils/references';
  import UiButton from 'keen/UiButton';
  import UiTextbox from 'keen/UiTextbox';
  import UiIconButton from 'keen/UiIconButton';
  import siteSelector from './site-selector.vue';
  import statusSelector from './status-selector.vue';
  import pageListItem from './page-list-item.vue';

  const DEFAULT_QUERY_SIZE = 50,
    SORT_DESC = 'desc',
    SORT_ASC = 'asc';

  /**
   * get data for all sites, and format it into something we can use
   * @return {array}
   */
  function getInitialSites() {
    const configSites = _.get(this.$store, 'state.url.sites'),
      selectedSites = configSites ? configSites.split(',') : [];

    // make an array of all sites, sorted by slug
    return _.sortBy(_.map(_.get(this.$store, 'state.allSites'), (site) => {
      return {
        slug: site.slug,
        name: site.name,
        selected: selectedSites.length ? _.includes(selectedSites, site.slug) : site.slug === _.get(this.$store, 'state.site.slug')
      };
    }), 'name');
  }

  /**
   * build the query to send to elastic
   * @param  {array} siteFilter
   * @param  {string} queryText
   * @param  {string} queryUser
   * @param {number} offset
   * @param {object} statusFilter
   * @param {boolean} isMyPages
   * @param {string} username
   * @return {object}
   */
  function buildQuery({ siteFilter, queryText, queryUser, offset, statusFilter, isMyPages, username, sortBy, sortOrder }) { // eslint-disable-line
    let query = {
      index: 'pages',
      body: {
        size: DEFAULT_QUERY_SIZE,
        from: offset,
        sort: {
          [sortBy]: { order: sortOrder }
        },
        query: {}
      }
    };

    _.set(query, 'body.query.bool.must', []);

    // filter for only "My Pages", and filter users
    if (isMyPages && queryUser) {
      query.body.query.bool.must.push({
        nested: {
          path: 'users',
          query: {
            terms: {
              'users.username': [username, queryUser]
            }
          }
        }
      });
    } else if (isMyPages) {
      query.body.query.bool.must.push({
        nested: {
          path: 'users',
          query: {
            term: {
              'users.username': username
            }
          }
        }
      });
    } else if (queryUser) {
      query.body.query.bool.must.push({
        nested: {
          path: 'users',
          query: {
            term: {
              'users.username': queryUser
            }
          }
        }
      });
    }

    // filter by selected sites
    if (siteFilter.length) {
      query.body.query.bool.must.push({
        terms: {
          siteSlug: siteFilter
        }
      });
    } else {
      query.body.query.bool.must.push({
        terms: {
          siteSlug: ['no-site-selected']
        }
      });
    }

    // filter by search string
    if (queryText) {
      query.body.query.bool.must.push({
        multi_match: {
          query: queryText,
          fields: ['authors^2', 'title'], // favor authors, then title
          type: 'phrase_prefix'
        }
      });
    }

    // filter by selected status
    // when the 'all' status is selected, it allows draft, published, and scheduled pages
    // (but NOT archived)
    if (statusFilter === 'all') {
      query.body.query.bool.must.push({
        term: { archived: false }
      });

      // Status sorting is handled differently,
      // we have to deal with boolean properties
      if (sortBy === 'status') {
        query.body.sort = {
          published: { order: sortOrder },
          scheduled: { order: sortOrder }
        };
      }
    } else if (statusFilter === 'draft') {
      query.body.query.bool.must.push({
        term: { published: false }
      }, {
        term: { archived: false } // only drafts can be archived, but we need to explicitly NOT include archived pages when looking at drafts in the list
      });

      query.body.query.bool.should = [];
      // look for either explicitly not scheduled pages or pages where scheduled is not set at all
      query.body.query.bool.should.push({
        term: { scheduled: false }
      });
      query.body.query.bool.should.push({
        bool: {
          must_not: {
            exists: {
              field: 'scheduled'
            }
          }
        }
      });
      query.body.query.bool.minimum_should_match = 1;
    } else if (statusFilter === 'published') {
      query.body.query.bool.must.push({
        term: { published: true }
      });

      // also sort by last published timestamp
      if (sortBy === 'status') {
        query.body.sort = {
          publishTime: { order: sortOrder }
        };
      }
    } else if (statusFilter === 'scheduled') {
      query.body.query.bool.must.push({
        term: { scheduled: true }
      });

      // also sort by scheduledlast scheduled time
      if (sortBy === 'status') {
        query.body.sort = {
          scheduledTime: { order: sortOrder }
        };
      }
    } else if (statusFilter === 'archived') {
      query.body.query.bool.must.push({
        term: { archived: true }
      });

      // Also, sort by last update time
      if (sortBy === 'status') {
        query.body.sort = {
          updateTime: { order: sortOrder }
        };
      }
    }

    return query;
  }

  export default {
    props: ['isMyPages'],
    data() {
      return {
        query: _.get(this.$store, 'state.url.query', ''),
        offset: 0,
        total: null,
        sites: getInitialSites.call(this),
        pages: [],
        selectedStatus: _.get(this.$store, 'state.url.status', 'all'),
        isPopoverOpen: false,
        sortBy: 'title.raw',
        sortOrder: SORT_ASC,
        headerTitles: [{
          title: 'Title',
          key: 'title',
          sortField: 'title.raw'
        }, {
          title: 'Byline',
          key: 'byline',
          sortField: 'authors.raw'
        }, {
          title: 'Status',
          key: 'status',
          sortField: 'status'
        }, {
          title: 'Collaborators',
          key: 'collaborators',
          sortField: 'users'
        }]
      };
    },
    computed: {
      selectedSites() {
        return _.filter(this.sites, 'selected');
      },
      multipleSitesSelected() {
        return this.selectedSites.length > 1;
      },
      selectedSite() {
        if (this.multipleSitesSelected) {
          return 'Multiple';
        } else if (this.selectedSites.length === 1) {
          return _.head(this.selectedSites).name;
        } else {
          return 'No Site Selected';
        }
      },
      showLoadMore() {
        return this.total === null || this.offset < this.total;
      },
      queryText() {
        return this.query.replace(/user:\S+/i, '').trim();
      },
      queryUser() {
        const user = this.query.match(/user:(\S+)/i);

        return user ? user[1] : '';
      },
      sortIcon() {
        return this.sortOrder === SORT_DESC ? 'arrow_downward' : 'arrow_upward';
      }
    },
    methods: {
      /**
       * Sets the isPopoverOpen prop to true
       * when the popover is opened
       * @returns {void}
       */
      onPopoverOpen() {
        this.isPopoverOpen = true;
      },
      /**
       * Sets the isPopoverOpen prop to false
       * when the popover is closed
       * @returns {void}
       */
      onPopoverClose() {
        this.isPopoverOpen = false;
      },
      /**
       * Sets the selected site in the state
       * and refetches the pages
       * @param {String} slug
       * @returns {void}
       */
      selectSite(slug) {
        const site = _.find(this.sites, (s) => s.slug === slug);

        site.selected = !site.selected;
        this.$store.commit('FILTER_PAGELIST_SITE', _.map(this.selectedSites, (site) => site.slug).join(', '));
        this.offset = 0;
        this.fetchPages();
      },
      /**
       * Sets the selected sites if there are multiple selected
       * @param {String[]} allSites
       * @returns {void}
       */
      selectMultipleSites(allSites) {
        this.sites = _.map(this.sites, (site) => {
          site.selected = allSites;
          return site;
        });
      },
      /**
       * Sets the selected site in the state
       * and refetches the pages
       * @param {String} slug
       * @returns {void}
       */
      setSingleSite(slug) {
        // loop through all sites, making sure that only one is selected
        _.each(this.sites, (site) => {
          if (site.slug === slug) {
            site.selected = true;
          } else {
            site.selected = false;
          }
        });

        this.$store.commit('FILTER_PAGELIST_SITE', _.map(this.selectedSites, (site) => site.slug).join(', '));
        this.offset = 0;
        this.fetchPages();
      },
      /**
       * Triggers a request to filter the pages with
       * a 300 ms delay
       * @returns {void}
       */
      filterList: _.debounce(function () {
        this.$store.commit('FILTER_PAGELIST_SEARCH', this.query);
        this.offset = 0;
        this.fetchPages();
      }, 300),
      /**
       * Sets the selected status in the state
       * and refetches the pages
       * @param {String} status
       * @returns {void}
       */
      selectStatus(status) {
        this.selectedStatus = status;

        this.$store.commit('FILTER_PAGELIST_STATUS', this.selectedStatus);
        this.offset = 0;
        this.fetchPages();
      },
      /**
       * Sets the built query in the state
       * and refetches the pages
       * @param {Object} query
       * @returns {void}
       */
      setQuery(query) {
        this.query = query;
        this.offset = 0;
        this.fetchPages();
      },
      /**
       * Sets the sort order and sort field in the state
       * and refetches the pages
       * @param {String} field
       * @returns {void}
       */
      sortByField(field) {
        this.sortOrder = this.sortBy === field ? this.toggleSortOrder(this.sortOrder) : SORT_ASC;
        this.sortBy = field;
        this.offset = 0;

        this.fetchPages();
      },
      /**
       * Toggles the sort order between ascending and descending
       * @param {String} order
       * @returns {String}
       */
      toggleSortOrder(order) {
        return order === SORT_DESC ? SORT_ASC : SORT_DESC;
      },
      /**
       * Makes a query to ES to fetch for all pages
       * @returns {Promise}
       */
      fetchPages() {
        const {
            isMyPages,
            offset,
            queryText,
            queryUser,
            selectedSites,
            selectedStatus: statusFilter,
            sortBy,
            sortOrder
          } = this,
          siteFilter = _.map(selectedSites, (site) => site.slug),
          prefix = _.get(this.$store, 'state.site.prefix'),
          username = _.get(this.$store, 'state.user.username'),
          query = buildQuery({ siteFilter, queryText, queryUser, offset, statusFilter, isMyPages, username, sortBy, sortOrder });

        return postJSON(prefix + searchRoute, query)
          .then((res) => {
            const hits = _.get(res, 'hits.hits') || [],
              total = _.get(res, 'hits.total'),
              pages = _.map(hits, (hit) => Object.assign({}, hit._source, { uri: hit._id }));

            this.pages = offset === 0 ? pages : this.pages.concat(pages);

            this.offset = offset + pages.length;
            this.total = total; // update the total for this particular query
            // (it's used to hide the "load more" button)

            // set the url hash
            if (_.get(this.$store, 'state.ui.currentDrawer')) {
              this.$store.dispatch('setHash', { menu: {
                tab: isMyPages ? 'my-pages' : 'all-pages',
                sites: siteFilter.join(','),
                status: statusFilter,
                query: this.query
              }});
            }
          })
          .catch((e) => console.error(e));
      }
    },
    mounted() {
      this.fetchPages();
    },
    activated() {
      this.offset = 0;
      this.fetchPages();
    },
    components: {
      UiButton,
      UiTextbox,
      UiIconButton,
      'site-selector': siteSelector,
      'status-selector': statusSelector,
      'page-list-item': pageListItem
    }
  };
</script>
