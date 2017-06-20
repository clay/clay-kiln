<style lang="sass">
  @import '../styleguide/inputs';
  @import '../styleguide/colors';

  $toggle-speed: 350ms;

  .page-list-input {
    border-bottom: 1px solid $input-border;
    overflow: hidden;
    width: 100%;
    position: relative;
    padding: 4px;
  }

  .page-list-search {
    @include input;

    /* right padding: 2x48 (buttons) + 10px padding */
    padding: 10px 106px 10px 14px;
    width: 100%;
  }

  .sites-readout {
    background-color: $input-background;
    border-left: 1px solid $input-border;
    display: flex;
    position: absolute;
    right: 44px;
    top: 4px;
    transition: $toggle-speed all ease;
    width: 44px;
    z-index: 1;

    &.open {
      width: calc(100% - 44px);
    }

    &-trigger {
      appearance: none;
      background: transparent;
      border: none;
      cursor: pointer;
      flex-shrink: 0;
      width: 44px;
      height: 48px;

      &:focus {
        outline: none;
      }

      > * {
        max-width: 100%;
      }

      &-text {
        background-color: $text;
        border-radius: 4px;
        color: $input-background;
        font-size: 15px;
        font-weight: bold;
        padding: 5px 9px;
      }
    }

    &-overflow {
      overflow-x: scroll;
      overflow-y: hidden;
    }

    &-list {
      border-left: 1px solid $input-border;
      display: flex;
      list-style-type: none;
      margin: 0;
      opacity: 0;
      padding: 0;

      &-item {
        &-btn {
          appearance: none;
          background: transparent;
          border: none;
          cursor: pointer;
          height: 44px;
          outline: none;
          position: relative;
          width: 44px;

          & > img {
            max-width: 100%;
          }

          .checkmark {
            bottom: 0;
            display: none;
            position: absolute;
            right: 0;
            width: 20px;

            svg {
              fill: $published;
            }
          }

          &.active {
            .checkmark {
              display: block;
            }
          }
        }
      }
    }

    &.open .sites-readout-list {
      opacity: 1;
    }
  }

  .status-toggle {
    appearance: none;
    background-color: $input-background;
    border: none;
    border-left: 1px solid $pane-list-divider;
    cursor: pointer;
    display: flex;
    position: absolute;
    right: 0;
    top: 2px;
    transition: $toggle-speed all ease;
    width: 44px;
    height: 50px;
    z-index: 1;

    &:focus {
      outline: none;
    }

    .triforce {
      margin-top: 5px;
    }

    // grey icons when no status is toggled
    .triforce-published,
    .triforce-scheduled {
      fill: $triforce-disabled;
    }

    .triforce-draft {
      stroke: $triforce-disabled;
    }

    // bright icons when status is toggled
    &.show-draft .triforce-draft {
      stroke: $draft;
    }

    &.show-published .triforce-published {
      fill: $published;
    }

    &.show-scheduled .triforce-scheduled {
      fill: $scheduled;
    }
  }

  .page-list-readout {
    margin: 0;
    padding: 0;

    &-item {
      align-items: center;
      border-bottom: 1px solid $pane-list-divider;
      display: flex;
      flex-grow: 1;
      font-size: 14px;
      justify-content: space-between;
      padding: 0 17px;

      &:first-child {
        padding-top: 30px;

        .page-list-readout-item-title:before,
        .page-list-readout-item-status:before,
        .page-list-readout-item-author:before {
          color: $subtext;
          font-size: 12px;
          font-style: normal;
          position: absolute;
          right: 0;
          text-transform: uppercase;
          top: -15px;
        }

        .page-list-readout-item-title:before {
          content: 'Title';
          left: 0;
          right: auto;
        }

        .page-list-readout-item-status:before {
          content: 'Status';
        }

        .page-list-readout-item-author:before {
          content: 'Author';
        }
      }

      &-link {
        color: $subtitle;
        cursor: pointer;
        display: flex;
        padding: 15px 0;
        text-decoration: none;

        &.no-text {
          color: $subtext;
          font-style: italic;
        }

        &.current-page {
          /* make current page bold in page list */
          font-weight: 700;
        }
      }

      &-title {
        flex: 1 0 50%;
        position: relative;
      }

      &-status {
        flex: 0 0 100px;
        padding: 15px 0;
        position: relative;
        text-align: right;

        .published {
          color: $published;
        }

        .scheduled {
          color: $scheduled;
        }

        .draft {
          color: $draft;
        }

        &-time {
          color: $page-list-text;
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
      }

      &-author {
        color: $subtitle;
        display: none;
        flex: 0 0 150px;
        padding: 15px 0;
        position: relative;
        text-align: right;

        &.no-text {
          color: $subtext;
          font-style: italic;
        }

        @media screen and (min-width: 800px) {
          display: block;
        }
      }
    }

    &-loadmore {
      background: $button-disabled-light;
      background: linear-gradient($pane-background, $button-disabled-light);
      color: $subtitle;
      cursor: pointer;
      padding: 14px 0;
      text-align: center;

      &.hidden {
        display: none;
      }
    }
  }
</style>

<template>
  <div class="page-list">
    <div class="page-list-input">
      <input class="page-list-search" placeholder="Search Pages" v-model="searchString" @keyup="onSearchKeyup" />
      <div class="sites-readout" :class="{ open: isSiteListOpen }">
        <button class="sites-readout-trigger" type="button" @click.stop="toggleSitesList">
          <svg v-if="isSiteListOpen" width="8" height="12" viewBox="0 0 8 12" xmlns="http://www.w3.org/2000/svg"><path d="M2 0L.59 1.41 5.17 6 .59 10.59 2 12l6-6z" fill-rule="evenodd"/></svg>
          <span v-else-if="hasAllSitesSelected" class="sites-readout-trigger-text">All</span>
          <span v-else-if="hasMultipleSitesSelected" class="sites-readout-trigger-text">{{ selectedSites.length }}</span>
          <img v-else-if="hasOneSiteSelected" :src="selectedSites[0].iconURL" :title="selectedSites[0].name" />
          <span v-else-if="hasNoSitesSelected" class="sites-readout-trigger-text">{{ selectedSites.length }}</span>
        </button>
        <div class="sites-readout-overflow">
          <ul class="sites-readout-list">
            <li v-for="site in sites" class="sites-readout-list-item">
              <button type="button" class="sites-readout-list-item-btn" :class="{ active: site.isSelected }" :title="site.name" @click.stop.prevent="toggleSiteSelected(site)">
                <img :src="site.iconURL" />
                <icon class="checkmark" name="publish-check"></icon>
              </button>
            </li>
          </ul>
        </div>
      </div>
      <button class="status-toggle" :class="{ 'show-draft': toggledStatuses.draft, 'show-published': toggledStatuses.published, 'show-scheduled': toggledStatuses.scheduled }" @click.stop.prevent="cycleStatuses">
        <icon class="triforce" name="triforce-of-publishing"></icon>
      </button>
    </div>
    <div class="page-list-display">
      <transition name="fade">
        <ul v-if="pagesLoaded" class="page-list-readout">
          <li v-for="page in pages" class="page-list-readout-item">
            <div class="page-list-readout-item-title">
              <a v-if="page.title" class="page-list-readout-item-link" :class="{ 'current-page': page.isCurrentPage }" :href="page.url" target="_blank">{{ page.title }}</a>
              <a v-else class="page-list-readout-item-link no-text" :class="{ 'current-page': page.isCurrentPage }" :href="page.url" target="_blank">No Headline</a>
            </div>
            <div v-if="page.firstAuthor" class="page-list-readout-item-author">{{ page.firstAuthor }}</div>
            <div v-else class="page-list-readout-item-author no-text">No Author</div>
            <div class="page-list-readout-item-status">
              <span :class="page.status">{{ page.statusMessage }}</span>
              <span v-if="page.statusTime" class="page-list-readout-item-status-time">{{ page.statusTime }}</span>
            </div>
          </li>
          <li v-if="showLoadMore" class="page-list-readout-loadmore" @click.stop="fetchPages">Load More&hellip;</li>
        </ul>
      </transition>

      <transition name="fade">
        <div v-if="!pagesLoaded" class="page-list-loading">
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import isValidDate from 'date-fns/is_valid';
  import dateFormat from 'date-fns/format';
  import isToday from 'date-fns/is_today';
  import isTomorrow from 'date-fns/is_tomorrow';
  import isYesterday from 'date-fns/is_yesterday';
  import isThisYear from 'date-fns/is_this_year';
  import { postJSON } from '../lib/core-data/api';
  import { searchRoute, htmlExt } from '../lib/utils/references';
  import { uriToUrl } from '../lib/utils/urls';
  import icon from '../lib/utils/icon.vue';

  const querySize = 20; // todo: this is for testing. make this 50 before release

  /**
   * format time for pages
   * @param  {Date} date
   * @return {string}
   */
  function formatStatusTime(date) {
    date = date ? new Date(date) : null;

    if (!date || !isValidDate(date)) {
      return null;
    }

    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isThisYear(date)) {
      return dateFormat(date, 'M/D');
    } else {
      return dateFormat(date, 'M/D/YY');
    }
  }

  /**
   * get published / scheduled state
   * todo: determine if a page has unpublished changes
   * @param  {object} src from elastic
   * @return {object}
   */
  function getStatus(src) {
    if (src.scheduled) {
      return {
        status: 'scheduled',
        statusMessage: 'Scheduled',
        statusTime: formatStatusTime(src.scheduledTime)
      };
    } else if (src.published) {
      return {
        status: 'published',
        statusMessage: 'Published',
        statusTime: formatStatusTime(src.publishTime)
      };
    } else {
      return {
        status: 'draft',
        statusMessage: 'Draft'
      };
    }
  }

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
        iconURL: `http://${site.mediaPath}${site.siteIcon}`,
        isSelected: site.slug === _.get(this.$store, 'state.site.slug')
      };
    }), 'slug');
  }

  /**
   * generate a page url to link to, based on site configs
   * @param  {object} src
   * @param  {object} sites
   * @return {string}
   */
  function generatePageUrl(src, sites) {
    const site = sites[src.siteSlug];

    return uriToUrl(src.uri, {
      protocol: 'http:', // note: assumes http (until we have protocol in site configs)
      port: site.port.toString(),
      hostname: site.host,
    }) + htmlExt;
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
  function buildQuery({ siteFilter, searchFilter, offset, statuses, isMyPages, username }) { // eslint-disable-line
    const allStatuses = statuses.draft && statuses.published && statuses.scheduled;

    let query = {
      index: 'pages',
      type: 'general',
      body: {
        size: querySize,
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
      if (statuses.draft) {
        query.body.query.bool.must.push({
          term: {
            published: false
          }
        }, {
          term: {
            scheduled: false
          }
        });
      } else if (statuses.published) {
        query.body.query.bool.must.push({
          term: {
            published: true
          }
        });
      } else if (statuses.scheduled) {
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
    props: ['args'],
    data() {
      return {
        searchString: '',
        offset: 0,
        total: null,
        pagesLoaded: true,
        isSiteListOpen: false,
        sites: getInitialSites.call(this),
        pages: [],
        toggledStatuses: {
          draft: true,
          published: true,
          scheduled: true
        }
      };
    },
    computed: {
      currentSite() {
        return _.get(this.$store, 'state.site.slug');
      },
      selectedSites() {
        return _.filter(this.sites, 'isSelected');
      },
      hasAllSitesSelected() {
        return this.selectedSites.length === 10;
      },
      hasMultipleSitesSelected() {
        return this.selectedSites.length > 1 && !this.hasAllSitesSelected;
      },
      hasOneSiteSelected() {
        return this.selectedSites.length === 1;
      },
      hasNoSitesSelected() {
        return this.selectedSites.length === 0;
      },
      showLoadMore() {
        return this.total === null || this.offset < this.total;
      }
    },
    methods: {
      toggleSitesList() {
        this.isSiteListOpen = !this.isSiteListOpen;

        // when closing this list, trigger a fetch of new pages
        // todo: optimize this to only fetch if site selection has changed
        if (!this.isSiteListOpen) {
          this.offset = 0;
          this.fetchPages();
        }
      },
      toggleSiteSelected(site) {
        site.isSelected = !site.isSelected;
        this.offset = 0;
        this.fetchPages();
      },
      onSearchKeyup: _.debounce(function () {
        this.offset = 0;
        this.fetchPages();
      }, 300),
      cycleStatuses() {
        const allShown = this.toggledStatuses.draft && this.toggledStatuses.published && this.toggledStatuses.scheduled;

        // all → draft → scheduled → published
        if (allShown) {
          this.toggledStatuses.scheduled = false;
          this.toggledStatuses.published = false;
          // only show draft
        } else if (this.toggledStatuses.draft) {
          this.toggledStatuses.draft = false;
          this.toggledStatuses.scheduled = true; // switch to scheduled
        } else if (this.toggledStatuses.scheduled) {
          this.toggledStatuses.scheduled = false;
          this.toggledStatuses.published = true; // switch to published
        } else if (this.toggledStatuses.published) {
          // back to all
          this.toggledStatuses.draft = true;
          this.toggledStatuses.scheduled = true;
        }
        this.offset = 0;
        this.fetchPages();
      },
      fetchPages() {
        const siteFilter = _.map(this.selectedSites, (site) => site.slug),
          searchFilter = this.searchString,
          offset = this.offset,
          prefix = _.get(this.$store, 'state.site.prefix'),
          isMyPages = this.args && this.args.isMyPages,
          username = _.get(this.$store, 'state.user.username'),
          statuses = this.toggledStatuses,
          query = buildQuery({ siteFilter, searchFilter, offset, statuses, isMyPages, username }),
          currentPageURI = _.get(this.$store, 'state.page.uri');

        return postJSON(prefix + searchRoute, query).then((res) => {
          const hits = _.get(res, 'hits.hits') || [],
            total = _.get(res, 'hits.total'),
            pages = _.map(hits, (hit) => {
              const src = hit._source,
                pageStatus = getStatus(src);

              return {
                site: src.siteSlug,
                url: src.url || generatePageUrl(src, _.get(this.$store, 'state.allSites')),
                uri: src.uri,
                title: src.titleTruncated, // display truncated title (query by full title)
                firstAuthor: _.head(src.authors),
                status: pageStatus.status,
                statusMessage: pageStatus.statusMessage,
                statusTime: pageStatus.statusTime,
                isCurrentPage: src.uri === currentPageURI
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
      return this.fetchPages();
    },
    components: {
      icon
    }
  };
</script>
