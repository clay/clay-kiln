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
    @media screen and (min-width: 600px) {
      max-width: calc(100vw - 200px);
    }

    @media screen and (min-width: 1056px) {
      max-width: 1056px;
    }
  }

  .page-list-controls {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    padding: 8px;
    width: 100%;

    @media screen and (min-width: 800px) {
      padding: 16px 16px 16px 8px;
    }
  }

  .page-list-sites {
    flex: 0 0 auto;
    margin-right: 8px;
    max-width: 140px;

    @media screen and (min-width: 800px) {
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

    @media screen and (min-width: 1056px) {
      display: none;
    }
  }

  .status-selector.page-list-status-large {
    display: none;
    flex: 0 0 auto;
    margin-left: 16px;

    @media screen and (min-width: 1056px) {
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

    @media screen and (min-width: 800px) {
      display: flex;
    }

    .page-list-header {
      &-site {
        flex: 0 0 $site-column;
      }

      &-title {
        flex: 1 1 $title-column;
      }

      &-byline {
        display: none;
        flex: 0 0 $byline-column;

        @media screen and (min-width: 904px) {
          display: inline;
        }
      }

      &-status {
        flex: 0 0 $status-column;
      }

      &-collaborators {
        display: none;
        flex: 0 0 $collaborators-column;

        @media screen and (min-width: 1056px) {
          display: inline;
        }
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
      <ui-button buttonType="button" class="page-list-sites" type="secondary" color="primary" has-dropdown ref="sitesDropdown">
        <span class="page-list-selected-site">{{ selectedSite }}</span>
        <site-selector slot="dropdown" :sites="sites" :selectedSite="selectedSite" @close="$refs.sitesDropdown.closeDropdown()" @select="selectSite" @multi-select="selectMultipleSites"></site-selector>
      </ui-button>
      <ui-textbox class="page-list-search" v-model="query" type="search" autofocus placeholder="Search by Title or Byline"></ui-textbox>
      <ui-icon-button class="page-list-status-small" type="secondary" icon="filter_list" has-dropdown ref="statusDropdown">
        <status-selector slot="dropdown" :statuses="statuses" :vertical="true" @close="$refs.statusDropdown.closeDropdown()" @select="selectStatus"></status-selector>
      </ui-icon-button>
      <status-selector class="page-list-status-large" :statuses="statuses" @select="selectStatus"></status-selector>
    </div>
    <div class="page-list-headers">
      <span v-if="selectedSites.length > 1" class="page-list-header page-list-header-site">Site</span>
      <span class="page-list-header page-list-header-title">Title</span>
      <span class="page-list-header page-list-header-byline">Byline</span>
      <span class="page-list-header page-list-header-status">Status</span>
      <span class="page-list-header page-list-header-collaborators">Collaborators</span>
    </div>
    <div class="page-list-readout">
      <page-list-item v-for="page in pages" :page="page"></page-list-item>
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

  const DEFAULT_QUERY_SIZE = 50;

  /**
   * get data for all sites, and format it into something we can use
   * @return {array}
   */
  function getInitialSites() {
    // make an array of all sites, sorted by slug
    return _.sortBy(_.map(_.get(this.$store, 'state.allSites'), (site) => {
      return {
        slug: site.slug,
        name: site.name,
        selected: site.slug === _.get(this.$store, 'state.site.slug')
      };
    }), 'name');
  }

  /**
   * build the query to send to elastic
   * @param  {array} siteFilter
   * @param  {string} searchFilter
   * @param {number} offset
   * @param {object} statuses
   * @param {boolean} isMyPages
   * @param {string} username
   * @return {object}
   */
  function buildQuery({ siteFilter, searchFilter, offset, statusFilter, isMyPages, username }) { // eslint-disable-line
    const allStatuses = statusFilter.draft && statusFilter.published && statusFilter.scheduled;

    let query = {
      index: 'pages',
      type: 'general',
      body: {
        size: DEFAULT_QUERY_SIZE,
        from: offset,
        sort: {
          updateTime: {
            order: 'desc'
          }
        },
        query: {}
      }
    };

    _.set(query, 'body.query.bool.must', []);

    // filter for only "My Pages"
    if (isMyPages) {
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
    if (searchFilter) {
      query.body.query.bool.must.push({
        multi_match: {
          query: searchFilter,
          fields: ['authors^2', 'title'], // favor authors, then title
          type: 'phrase_prefix'
        }
      });
    }

    // filter by selected status
    if (!allStatuses) {
      // when all statuses are selected, it doesn't need to include a status filter in the query
      // when a single status is selected, it does include the filter
      if (statusFilter.draft) {
        query.body.query.bool.must.push({
          term: {
            published: false
          }
        }, {
          term: {
            scheduled: false
          }
        });
      } else if (statusFilter.published) {
        query.body.query.bool.must.push({
          term: {
            published: true
          }
        });
      } else if (statusFilter.scheduled) {
        query.body.query.bool.must.push({
          term: {
            scheduled: true
          }
        });
      }
    }

    return query;
  }

  export default {
    props: ['isMyPages'],
    data() {
      return {
        query: '',
        offset: 0,
        total: null,
        sites: getInitialSites.call(this),
        pages: [],
        statuses: {
          draft: true,
          published: true,
          scheduled: true
        }
      };
    },
    computed: {
      selectedSites() {
        return _.filter(this.sites, 'selected');
      },
      selectedSite() {
        if (this.selectedSites.length > 1) {
          return 'Multiple';
        } else if (this.selectedSites.length === 1) {
          return _.head(this.selectedSites).name;
        } else {
          return 'No Site Selected';
        }
      },
      showLoadMore() {
        return this.total === null || this.offset < this.total;
      }
    },
    methods: {
      selectSite(slug) {
        const site = _.find(this.sites, (s) => s.slug === slug);

        site.selected = !site.selected;
        this.$store.commit('FILTER_PAGELIST_SITE', _.map(this.selectedSites, (site) => site.slug).join(', '));
        this.offset = 0;
        this.fetchPages();
      },
      selectMultipleSites(allSites) {
        this.sites = _.map(this.sites, (site) => {
          site.selected = allSites;
          return site;
        });
      },
      onSearchKeyup: _.debounce(function () {
        this.$store.commit('FILTER_PAGELIST_SEARCH', this.searchString);
        this.offset = 0;
        this.fetchPages();
      }, 300),
      selectStatus(status, value) {
        let showAllStatuses, currentStatus;

        this.statuses[status] = value;
        showAllStatuses = this.statuses.draft && this.statuses.published && this.statuses.scheduled;
        currentStatus = showAllStatuses ? 'all' : _.findKey(this.statuses, (status) => !!status);

        this.$store.commit('FILTER_PAGELIST_STATUS', currentStatus);
        this.offset = 0;
        this.fetchPages();
      },
      fetchPages() {
        const siteFilter = _.map(this.selectedSites, (site) => site.slug),
          searchFilter = this.query,
          offset = this.offset,
          prefix = _.get(this.$store, 'state.site.prefix'),
          isMyPages = this.isMyPages,
          username = _.get(this.$store, 'state.user.username'),
          statusFilter = this.statuses,
          query = buildQuery({ siteFilter, searchFilter, offset, statusFilter, isMyPages, username });

        return postJSON(prefix + searchRoute, query).then((res) => {
          const hits = _.get(res, 'hits.hits') || [],
            total = _.get(res, 'hits.total'),
            pages = _.map(hits, (hit) => {
              const src = hit._source;

              return {
                site: src.siteSlug,
                uri: src.uri,
                title: src.title,
                titleTruncated: src.titleTruncated, // display truncated title (query by full title)
                authors: src.authors
              };
            });

          if (this.offset === 0) {
            this.pages = pages;
          } else {
            this.pages = this.pages.concat(pages);
          }

          this.offset = this.offset + pages.length;
          this.total = total; // update the total for this particular query
          // (it's used to hide the "load more" button)
        });
      }
    },
    mounted() {
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
