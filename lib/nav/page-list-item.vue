<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';
  @import '../../styleguide/clay-menu-columns';

  .page-list-item {
    align-items: center;
    border-bottom: 1px solid $divider-color;
    display: flex;
    flex: 1 0 auto;
    max-height: 100px;
    min-height: 48px;
    padding: 0 16px;

    @media screen and (min-width: 904px) {
      flex: 0 0 48px;
    }

    &-site {
      @include type-button();

      display: none;
      flex: 0 0 $site-column;
      overflow: hidden;
      padding-right: 16px;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;

      @media screen and (min-width: 904px) {
        display: block;
      }
    }

    &-title {
      @include type-body();

      display: block;
      flex: 1 1 $title-column;
      min-width: 0;
      padding: 16px 16px 16px 0;

      &-inner {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }

      .no-title {
        color: $text-alt-color;
        font-style: italic;
      }

      .page-list-item-site-small {
        @include type-button();

        display: block;
        text-transform: uppercase;
        width: 100%;

        @media screen and (min-width: 904px) {
          display: none;
        }
      }

      .page-list-item-byline-small {
        @include type-caption();

        display: block;
        width: 100%;

        &.no-byline {
          color: $text-alt-color;
          font-style: italic;
        }

        @media screen and (min-width: 904px) {
          display: none;
        }
      }
    }

    &-byline {
      @include type-body();

      display: none;
      flex: 0 0 $byline-column;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.no-byline {
        color: $text-alt-color;
      }

      @media screen and (min-width: 904px) {
        display: inline;
      }

      @media screen and (min-width: 1056px) {
        padding-right: 16px;
      }
    }

    &-status {
      align-items: flex-end;
      display: flex;
      flex: 0 0 $status-column;
      flex-direction: column;
      min-width: 0;
      padding: 16px 0;

      @media screen and (min-width: 1056px) {
        align-items: flex-start;
      }

      .status-message {
        @include type-caption();

        overflow: hidden;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;

        &.scheduled {
          color: $scheduled;
        }

        &.published {
          color: $published;
        }
      }

      .status-time {
        @include type-caption();

        overflow: hidden;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }
    }

    &-collaborators {
      display: none;
      flex: 0 0 $collaborators-column;

      @media screen and (min-width: 1056px) {
        display: flex;
      }
    }
  }
</style>

<template>
  <div class="page-list-item">
    <div v-if="multipleSitesSelected" class="page-list-item-site">{{ site }}</div>
    <a class="page-list-item-title" :href="url" target="_blank" @click="onUrlClick">
      <span v-if="multipleSitesSelected" class="page-list-item-site-small">{{ site }}</span>
      <span class="page-list-item-title-inner" :class="{ 'no-title': !page.titleTruncated }">{{ title }}</span>
      <span class="page-list-item-byline-small" :class="{ 'no-byline': !page.authors.length }">{{ firstAuthor }}</span>
    </a>
    <div class="page-list-item-byline" :class="{ 'no-byline': !page.authors.length }">{{ firstAuthor }}</div>
    <div class="page-list-item-status">
      <span class="status-message" :class="status">{{ statusMessage }}</span>
      <span v-if="statusTime" class="status-time">{{ statusTime }}</span>
    </div>
    <div class="page-list-item-collaborators">
      <collaborator v-for="user in users" :user="user" :key="user.username"></collaborator>
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
  import { htmlExt } from '../utils/references';
  import { uriToUrl } from '../utils/urls';
  import collaborator from './collaborator.vue';

  /**
   * format hour and minute
   * @param  {Date} date
   * @return {string}
   */
  function formatHM(date) {
    return ' ' + dateFormat(date, 'h:mm A');
  }

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
      return 'Today' + formatHM(date);
    } else if (isTomorrow(date)) {
      return 'Tomorrow' + formatHM(date);
    } else if (isYesterday(date)) {
      return 'Yesterday' + formatHM(date);
    } else if (isThisYear(date)) {
      return dateFormat(date, 'M/D') + formatHM(date);
    } else {
      return dateFormat(date, 'M/D/YY') + formatHM(date);
    }
  }

  /**
   * generate a page url to link to, based on site configs
   * @param  {object} page
   * @param  {object} sites
   * @return {string}
   */
  function generatePageUrl(page, sites) {
    const site = sites[page.siteSlug];

    return uriToUrl(page.uri, {
      protocol: 'http:', // note: assumes http (until we have protocol in site configs)
      port: site.port.toString(),
      hostname: site.host,
    }) + htmlExt;
  }

  export default {
    props: ['page', 'multipleSitesSelected', 'isPopoverOpen'],
    computed: {
      url() {
        return this.page.url || generatePageUrl(this.page, _.get(this.$store, 'state.allSites'));
      },
      firstAuthor() {
        return this.page.authors.length ? _.head(this.page.authors) : 'No Byline';
      },
      pageStatus() {
        if (this.page.scheduled) {
          return {
            status: 'scheduled',
            statusMessage: 'Scheduled',
            statusTime: formatStatusTime(this.page.scheduledTime)
          };
        } else if (this.page.published) {
          return {
            status: 'published',
            statusMessage: 'Published',
            statusTime: formatStatusTime(this.page.publishTime)
          };
        } else {
          return {
            status: 'draft',
            statusMessage: 'Draft'
          };
        }
      },
      status() {
        return this.pageStatus.status;
      },
      statusMessage() {
        return this.pageStatus.statusMessage;
      },
      statusTime() {
        return this.pageStatus.statusTime;
      },
      site() {
        const site = _.find(_.get(this.$store, 'state.allSites'), (site) => site.slug === this.page.siteSlug);

        return site.name;
      },
      title() {
        return this.page.titleTruncated || 'No Title';
      },
      users() {
        return this.page.users;
      }
    },
    methods: {
      onUrlClick(e) {
        if (this.isPopoverOpen) {
          // don't navigate links if the site select or status select popover menus are open
          e.preventDefault();
        }
      }
    },
    components: {
      collaborator
    }
  };
</script>
