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
      <input class="page-list-search" :class="{ closed: isSiteListOpen }" placeholder="Search Pages" v-model="searchString" />
      <div class="sites-readout" :class="{ open: isSiteListOpen }">
        <button class="sites-readout-trigger" type="button" @click.stop="toggleSitesList">
          <svg v-if="isSiteListOpen" width="8" height="12" viewBox="0 0 8 12" xmlns="http://www.w3.org/2000/svg"><path d="M2 0L.59 1.41 5.17 6 .59 10.59 2 12l6-6z" fill-rule="evenodd"/></svg>
          <span v-else-if="hasAllSitesSelected" class="sites-readout-trigger-text">All</span>
          <span v-else-if="hasMultipleSitesSelected">{{ selectedSites.length }}</span>
          <img v-else-if="hasOneSiteSelected" :src="selectedSites[0].iconURL" />
        </button>
        <div class="sites-readout-overflow">
          <ul class="sites-readout-list">
            <li v-for="site in sites" class="sites-readout-list-item">
              <button type="button" class="sites-readout-list-item-btn" :class="{ active: site.slug === currentSite }">
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
              <a class="page-list-readout-item-link" :href="page.url" target="_blank">{{ page.title }}</a>
            </div>
            <div class="page-list-readout-item-author">{{ page.firstAuthor }}</div>
            <div class="page-list-readout-item-status">
              <span :class="page.status">{{ page.statusMessage }}</span>
              <span v-if="page.statusTime" class="page-list-readout-item-status-time">{{ page.statusTime }}</span>
            </div>
          </li>
          <li class="page-list-readout-loadmore">Load More&hellip;</li>
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
  import icon from '../lib/utils/icon.vue';

  function formatStatusTime(date) {
    if (!isValidDate(date)) {
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

  export default {
    data() {
      return {
        searchString: '',
        pagesLoaded: true,
        isSiteListOpen: false,
        selectedSites: [{
          slug: 'di',
          iconURL: '/daily/intelligencer/media/sites/di/icon.svg'
        }]
      };
    },
    computed: {
      currentSite() {
        return _.get(this.$store, 'state.site.slug');
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
      sites() {
        return [{
          slug: 'di',
          iconURL: '/daily/intelligencer/media/sites/di/icon.svg'
        }];
      },
      pages() {
        return [{
          site: 'di',
          url: 'http://google.com',
          title: 'My first Page',
          firstAuthor: 'Nelson Pecora',
          status: 'published',
          statusMessage: 'Published',
          statusTime: formatStatusTime(new Date())
        }];
      }
    },
    methods: {
      toggleSitesList() {
        this.isSiteListOpen = !this.isSiteListOpen;

        // todo: when closing this list, trigger a fetch of new pages (if the selected sites have changed)
      }
    },
    components: {
      icon
    }
  };
</script>
