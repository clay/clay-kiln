<style lang="sass">
  @import '../styleguide/inputs';
  @import '../styleguide/colors';

  $toggle-speed: 350ms;

  .page-list-input {
    border-bottom: 1px solid $input-border;
    display: flex;
    overflow: hidden;
    max-width: 500px;
  }

  .page-list-search {
    @include input;

    border: none;
    transition: $toggle-speed all ease;

    &.closed {
      padding: 0;
      width: 0;
    }
  }

  .sites-readout {
    border-left: 1px solid $input-border;
    display: flex;
    flex-grow: 0;
    transition: $toggle-speed all ease;
    width: 48px;

    &.open {
      flex-grow: 1;
      width: 100%;
    }

    &-trigger {
      appearance: none;
      background: transparent;
      border: none;
      cursor: pointer;
      flex-shrink: 0;
      width: 48px;

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
          height: 48px;
          outline: none;
          position: relative;
          width: 48px;

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

  .page-list-readout {
    margin: 0;
    padding: 0;

    &-item {
      align-items: flex-start;
      display: flex;
      flex-grow: 1;
      font-size: 14px;
      justify-content: space-between;
      padding: 15px 10px;

      &:first-child {
        padding-top: 30px;

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

        .page-list-readout-item-status:before {
          content: 'Status';
        }

        .page-list-readout-item-author:before {
          content: 'Author';
        }
      }

      &-link {
        color: $subtitle;
        display: flex;
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
        flex: 0 1 50%;
      }

      &-status {
        flex: 0 0 100px;
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
          color: $subtitle;
          display: block;
          font-size: 12px;
          text-transform: uppercase;
        }
      }

      &-author {
        color: $subtitle;
        display: none;
        position: relative;

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
      <input class="page-list-search" :class="{ closed: isSiteListOpen }" placeholder="Search Pages" v-model="searchString" @keyup="onSearchKeyup" />
      <div class="sites-readout" :class="{ open: isSiteListOpen }">
        <button class="sites-readout-trigger" type="button" @click.stop="toggleSitesList">
          <svg v-if="isSiteListOpen" width="8" height="12" viewBox="0 0 8 12" xmlns="http://www.w3.org/2000/svg"><path d="M2 0L.59 1.41 5.17 6 .59 10.59 2 12l6-6z" fill-rule="evenodd"/></svg>
          <span v-else-if="hasAllSitesSelected" class="sites-readout-trigger-text">All</span>
          <span v-else-if="hasMultipleSitesSelected" class="sites-readout-trigger-text">{{ selectedSites.length }}</span>
          <img v-else-if="hasOneSiteSelected" :src="selectedSites[0].iconURL" :title="selectedSites[0].name" />
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
      hostname: site.host
    }) + htmlExt;
  }

  /**
   * build the query to send to elastic
   * @param  {array} siteFilter
   * @param  {string} searchFilter
   * @param {number} offset
   * @return {object}
   */
  function buildQuery(siteFilter, searchFilter, offset) {
    let query = {
      index: 'pages',
      type: 'general',
      body: {
        size: querySize,
        from: offset,
        sort: {
          createdAt: {
            order: 'desc'
          }
        },
        query: {}
      }
    };

    if (siteFilter.length) {
      _.set(query, 'body.query.filtered.filter.terms.siteSlug', siteFilter);
    }

    if (searchFilter) {
      _.set(query, 'body.query.filtered.query.multi_match', {
        query: searchFilter,
        fields: ['authors^3', 'title^2', 'content'], // favor authors, then title, then full content
        type: 'phrase_prefix'
      });
    }

    if (!siteFilter.length && !searchFilter) {
      _.set(query, 'body.query.match_all', {});
    }

    return query;
  }

  export default {
    data() {
      return {
        searchString: '',
        offset: 0,
        total: null,
        pagesLoaded: true,
        isSiteListOpen: false,
        sites: getInitialSites.call(this),
        pages: []
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
      },
      onSearchKeyup: _.debounce(function () {
        this.offset = 0;
        this.fetchPages();
      }, 300),
      fetchPages() {
        const siteFilter = _.map(this.selectedSites, (site) => site.slug),
          searchFilter = this.searchString,
          offset = this.offset,
          prefix = _.get(this.$store, 'state.site.prefix'),
          query = buildQuery(siteFilter, searchFilter, offset),
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
