<template>
  <div class="publish-drawer">
    <!-- publish status -->
    <div class="publish-status">
      <span class="status-message">{{ statusMessage }}</span>
      <span class="status-time">{{ time }}</span>
      <a v-if="isPublished" class="status-link" :href="url" target="_blank">
        <ui-icon icon="open_in_new"></ui-icon>
        <span class="status-link-text">View public page</span>
      </a>
      <ui-button v-if="isScheduled" class="status-undo-button" buttonType="button" color="red" @click.stop="unschedulePage">Unschedule</ui-button>
      <ui-button v-else-if="isPublished" class="status-undo-button" buttonType="button" color="red" @click.stop="unpublishPage">Unpublish</ui-button>
      <ui-button v-else-if="isArchived" class="status-undo-button" buttonType="button" color="red" @click.stop="archivePage(false)">Unarchive</ui-button>
    </div>

    <!-- publish actions -->
    <div class="publish-actions">
      <span class="action-message">{{ actionMessage }} <ui-icon-button v-if="showSchedule" icon="close" buttonType="button" type="secondary" color="default" size="small" tooltip="Clear Date/Time" tooltipPosition="left middle" @click.stop="clearScheduleForm"></ui-icon-button></span>
      <form class="schedule-form" @submit.prevent="schedulePage">
        <ui-datepicker class="schedule-date" color="accent" v-model="dateValue" :minDate="today" :customFormatter="formatDate" label="Date" :disabled="hasErrors"></ui-datepicker>
        <timepicker ref="timepicker" class="schedule-time" :value="timeValue" label="Time" :disabled="hasErrors" @update="updateTime"></timepicker>
      </form>
      <span class="action-info-message">Time Zone: {{ timezone }}</span>
      <ui-button v-if="showSchedule" :disabled="disableSchedule || isArchived || hasErrors || !isLayoutPublished" class="action-button" buttonType="button" color="orange" @click.stop="schedulePage">{{ actionMessage }}</ui-button>
      <ui-button v-else :disabled="isPublishing || isArchived || hasErrors || !isLayoutPublished" class="action-button" buttonType="button" color="accent" @click.stop="publishPage">{{ actionMessage }}</ui-button>
      <span v-if="!isLayoutPublished && isAdmin" class="action-error-message" @click="goToLayout">Layout must be published first</span>
      <span v-else-if="!isLayoutPublished" class="action-error-message">Layout must be published first (by an admin)</span>
      <span v-else-if="hasErrors" class="action-error-message" @click="goToHealth">Please fix errors before publishing</span>
      <span v-else-if="hasWarnings" class="action-warning-message" @click="goToHealth">Please review warnings before publishing</span>
    </div>

    <!-- custom location -->
    <ui-collapsible :open="hasCustomLocation" class="publish-section publish-location" title="Custom URL" ref="uiCollapsiblePublish">
      <form class="publish-location-form" @submit.prevent="saveLocation">
        <span class="location-description">Designate a custom URL for this page. This should only be used for special cases, such as index pages and static pages.</span>
        <ui-textbox class="location-input" v-model="location" placeholder="/special-page.html" label="Enter Custom Location" :error="error" :invalid="isInvalid" @input="onLocationInput"></ui-textbox>
        <ui-button class="location-submit" buttonType="submit" type="primary" color="default">Save</ui-button>
      </form>
    </ui-collapsible>

    <!-- manual title updating -->
    <ui-collapsible class="publish-section publish-title" title="Page Title">
      <form class="publish-title-form" @submit.prevent="saveTitle">
        <span class="title-description">Manually update the page title that appears in the Clay Menu. Will be overwritten when saving components that set the title.</span>
        <ui-textbox class="title-input" v-model="title" label="Page Title"></ui-textbox>
        <ui-button class="title-submit" buttonType="submit" type="primary" color="default" :disabled="!title">Save</ui-button>
      </form>
    </ui-collapsible>

    <!-- archiving -->
    <ui-collapsible class="publish-section publish-archive" title="Archive Page">
      <span class="archive-help">You may archive any page that isn't published (or scheduled to be published). Archived pages will not show up in the Clay Menu unless you explicitly filter for them.</span>
      <ui-button class="archive-submit" buttonType="button" type="primary" color="red" :disabled="isScheduled || isPublished || isArchived" @click.stop="archivePage(true)">Archive</ui-button>
    </ui-collapsible>


    <!-- restore from published -->
    <ui-collapsible v-if="isPublished && hasChanges" class="publish-section publish-archive" title="Restore Published Version">
      <span class="archive-help">You may override all changes by restoring to the most recently published version of this page. <strong>Warning:</strong> this action cannot be undone, you will lose all changes applied to this post since the last publish.</span>
      <ui-button class="action-button" buttonType="button" type="primary" color="red" @click.stop="restorePageClick()">Restore</ui-button>
    </ui-collapsible>
  </div>
</template>


<script>
  import _ from 'lodash';
  import dateFormat from 'date-fns/format';
  import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
  import parseDate from 'date-fns/parse';
  import getTime from 'date-fns/get_time';
  import { mapState } from 'vuex';
  import Routable from 'routable';
  import pathToRegexp from 'path-to-regexp';
  import { uriToUrl } from '../utils/urls';
  import { getLastEditUser, hasPageChanges } from '../utils/history';
  import { htmlExt, editExt, getLayoutNameAndInstance } from '../utils/references';
  import { getTimezone, calendar, isInThePast } from '../utils/calendar';
  import { START_PROGRESS, FINISH_PROGRESS } from '../toolbar/mutationTypes';
  import UiIcon from 'keen/UiIcon';
  import UiButton from 'keen/UiButton';
  import UiDatepicker from 'keen/UiDatepicker';
  import UiTextbox from 'keen/UiTextbox';
  import UiCollapsible from 'keen/UiCollapsible';
  import UiIconButton from 'keen/UiIconButton';
  import timepicker from '../utils/timepicker.vue';
  import logger from '../utils/log';
  import * as api from '../core-data/api.js';

  const log = logger(__filename);

  let restoreTimer = null;

  /**
   * determine if a url is navigable in our site's express router
   * @param  {string}  val of custom url input
   * @param  {array}  routes passed through from the server
   * @return {boolean}
   */
  function isValidUrl(val, routes) {
    return !!_.find(routes, function (route) {
      const regexRoute = pathToRegexp(route),
        r = new Routable(regexRoute);

      return r.test(val) || r.test('/' + val); // test with and without the beginning slash
    });
  }

  export default {
    data() {
      return {
        dateValue: null,
        timeValue: '',
        today: new Date(),
        location: '',
        title: '',
        error: 'Custom URL must match an available route!',
        isInvalid: false,
        hasCustomLocation: false
      };
    },
    computed: mapState({
      hasErrors: (state) =>
        state.validation.errors && state.validation.errors.length > 0 ||
        state.validation.metadataErrors && state.validation.metadataErrors.length > 0,
      hasWarnings: (state) =>
        state.validation.warnings && state.validation.warnings.length > 0 ||
        state.validation.metadataWarnings && state.validation.metadataWarnings.length > 0,
      isPublished: (state) => state.page.state.published,
      isPublishing: (state) => state.ui.currentlyPublishing,
      isScheduled: (state) => state.page.state.scheduled,
      isArchived: (state) => state.page.state.archived,
      uri: (state) => state.page.uri,
      url: (state) => state.page.state.url,
      publishedDate: (state) => state.page.state.publishTime,
      createdDate: (state) => state.page.state.createdAt,
      scheduledDate: (state) => state.page.state.scheduledTime,
      lastUpdated: (state) => state.page.state.updateTime,
      currentTitle: (state) => state.page.state.title,
      isAdmin: (state) => state.user.auth === 'admin',
      isLayoutPublished: (state) => state.layout.state.published,
      headComponents: (state) => state.page.data.head,
      hasChanges: (state) => hasPageChanges(state),
      statusMessage() {
        if (this.isScheduled) {
          return `Scheduled ${distanceInWordsToNow(this.scheduledDate, { addSuffix: true })}`;
        } if (this.isPublished) {
          return `Published ${distanceInWordsToNow(this.publishedDate, { addSuffix: true })}`;
        } else if (this.isArchived) {
          return 'Archived';
        } else if (this.createdDate) {
          return `Draft Created ${distanceInWordsToNow(this.createdDate, { addSuffix: true })}`;
        } else {
          return 'Draft Created some time ago';
        }
      },
      time() {
        const tz = getTimezone();

        if (this.isScheduled) {
          return `${dateFormat(this.scheduledDate, 'MMMM Do [at] h:mm A')} (${tz} time)`;
        } else if (this.isPublished) {
          return `${dateFormat(this.publishedDate, 'MMMM Do [at] h:mm A')} (${tz} time)`;
        } else if (this.isArchived) {
          return `${ dateFormat(this.lastUpdated, 'MMMM Do [at] h:mm A') } (${tz} time)`;
        } else if (this.createdDate) {
          return `${ dateFormat(this.createdDate, 'MMMM Do [at] h:mm A') } (${tz} time)`;
        } else {
          return 'Some time ago';
        }
      },
      showSchedule() {
        return this.dateValue || this.timeValue;
      },
      disableSchedule() {
        if (this.dateValue && !this.timeValue || this.timeValue && !this.dateValue) {
          // only one field is filled out (note: button is entirely hidden if neither field is filled out)
          return true;
        } else if (isInThePast(this.dateValue, this.timeValue)) {
          // scheduling things for the past makes them publish immediately
          // note: the date input has no UI to schedule things in the past, but the time input allows it
          return true;
        } else {
          // nothing preventing you from scheduling!
          return false;
        }
      },
      actionMessage() {
        if (this.isScheduled && this.showSchedule) {
          return 'Reschedule';
        } else if (this.showSchedule) {
          return 'Schedule';
        } else if (this.isPublished) {
          return 'Republish Now';
        } else {
          return 'Publish Now';
        }
      },
      timezone() {
        return getTimezone();
      }
    }),
    watch: {
      currentTitle(val) {
        if (val) {
          // if the page already has a title set, default the form to use it
          this.title = val;
        }
      }
    },
    methods: {
      goToHealth() {
        this.$emit('selectTab', 'Health');
      },
      goToLayout() {
        const { message } = getLayoutNameAndInstance(this.$store),
          layoutAlert = { type: 'warning', text: message },
          lastUser = getLastEditUser(_.get(this.$store, 'state.layout.state'), _.get(this.$store, 'state.user')),
          layoutUserAlert = lastUser && { type: 'info', message: `Edited less than 5 minutes ago${ lastUser.name ? ` by ${lastUser.name}` : '' }` };

        this.$store.commit('TOGGLE_EDIT_MODE', 'layout');
        this.$store.dispatch('closeDrawer');
        this.$store.dispatch('addAlert', layoutAlert);
        if (layoutUserAlert) {
          this.$store.dispatch('addAlert', layoutUserAlert);
        }
      },
      unschedulePage() {
        const store = this.$store;

        store.commit(START_PROGRESS);
        store.dispatch('unschedulePage', this.uri)
          .catch((e) => {
            store.commit(FINISH_PROGRESS, 'error');
            log.error(`Error unscheduling page: ${e.message}`, { action: 'unschedulePage' });
            store.dispatch('showSnackbar', {
              message: 'Error unscheduling page',
              action: 'Retry',
              onActionClick: () => this.unschedulePage()
            });
            throw e;
          })
          .then(() => {
            store.commit(FINISH_PROGRESS);
            store.dispatch('showSnackbar', 'Unscheduled Page');
          });
      },
      unpublishPage() {
        const store = this.$store,
          uri = this.uri;

        store.commit(START_PROGRESS);
        this.$store.dispatch('unpublishPage', uri)
          .catch((e) => {
            store.commit(FINISH_PROGRESS, 'error');
            log.error(`Error unpublishing page: ${e.message}`, { action: 'unpublishPage' });
            store.dispatch('showSnackbar', {
              message: 'Error unpublishing page',
              action: 'Retry',
              onActionClick: () => this.unpublishPage()
            });
            throw e;
          })
          .then(() => {
            if (_.includes(window.location.href, uriToUrl(uri))) {
              // if we're already looking at /_pages/whatever, display the status message
              store.commit(FINISH_PROGRESS);
              store.dispatch('showSnackbar', 'Unpublished Page');
            } else {
              // if we're looking at the published page, navigate to the latest version
              window.location.href = `${uriToUrl(uri)}${htmlExt}${editExt}`;
            }
          });
      },
      schedulePage() {
        // firefox uses a nonstandard AM/PM format, rather than the accepted W3C standard that other browsers use
        // therefore, check for AM/PM
        const date = dateFormat(this.dateValue, 'YYYY-MM-DD'),
          time = this.timeValue,
          datetime = parseDate(date + ' ' + time),
          timestamp = getTime(datetime),
          store = this.$store;

        this.$store.commit(START_PROGRESS);
        this.$store.dispatch('schedulePage', { uri: this.uri, timestamp })
          .catch((e) => {
            log.error(`Error scheduling page: ${e.message}`, { action: 'schedulePage' });
            this.$store.dispatch('showSnackbar', {
              message: 'Error scheduling page',
              action: 'Retry',
              onActionClick: () => this.schedulePage()
            });
            throw e;
          })
          .then(() => {
            store.commit(FINISH_PROGRESS);
            // reset date and time values
            this.clearScheduleForm();
            store.dispatch('showSnackbar', {
              message: `Scheduled to publish ${calendar(datetime)}`,
              action: 'Undo',
              onActionClick: () => this.unschedulePage()
            });
          });
      },
      publishPage() {
        this.$store.dispatch('isPublishing', true).then(() => {
          this.$store.dispatch('publishPage', this.uri)
            .catch((e) => {
              log.error(`Error publishing page: ${e.message}`, { action: 'publishPage' });
              this.$store.dispatch('showSnackbar', {
                message: 'Error publishing page',
                action: 'Retry',
                onActionClick: () => this.publishPage()
              });
              throw e;
            })
            .then(() => this.$store.dispatch('showSnackbar', {
              message: 'Published Page',
              action: 'View',
              onActionClick: () => window.open(this.url)
            }));
        });
      },
      formatDate(date) {
        return dateFormat(date, 'M/D/YY');
      },
      clearScheduleForm() {
        this.dateValue = null;
        this.$refs.timepicker.clear();
      },
      saveLocation(undoUrl) {
        const prefix = _.get(this.$store, 'state.site.prefix'),
          val = _.isString(undoUrl) ? undoUrl : this.location,
          store = this.$store,
          oldUrl = _.get(store, 'state.page.data.url');

        let url;

        // make sure we're not adding the site prefix twice!
        // handle both /paths and http://full-urls
        if (val.match(/^http/i)) {
          // full url
          url = val;
        } else if (val === '/') {
          // a single slash means this page should be the root url for a site, e.g. an index page
          url = uriToUrl(prefix);
        } else if (val.match(/^\/\S/i)) {
          // already starts with a slash (but isn't the root url for a site)
          url = uriToUrl(prefix + val);
        } else if (val.match(/^\S/i)) {
          // add the slash ourselves
          url = uriToUrl(prefix + '/' + val);
        } else if (val === '') {
          // unset custom url
          url === '';
        }

        store.dispatch('savePage', { url }).then(() => {
          if (url && !_.isString(undoUrl)) { // by default this method will be passed the Event that triggered it. check to see if it's passed an explicit undoUrl instead
            store.dispatch('showSnackbar', 'Saved custom page url');
          } else {
            store.dispatch('showSnackbar', {
              message: 'Removed custom page url',
              action: 'Undo',
              onActionClick: () => {
                this.saveLocation(oldUrl);
              }
            });
          }
        });
      },
      onLocationInput() {
        // validate that what the user typed in is routable
        // note: if it's empty string, catch it early (removing custom urls is totally valid)
        // note: if it's a full url, assume the user knows what they're doing and say it's valid
        const val = this.location,
          routes = _.get(this.$store, 'state.locals.routes'),
          current = this.isInvalid;

        if (val === '' || val.match(/^http/i) || isValidUrl(val, routes)) {
          this.isInvalid = false;
        } else {
          this.isInvalid = true;
        }
        // if validity state has changed, refresh collapsible height to account
        // for addition or removal of error message
        if (current !== this.isInvalid) {
          this.$refs.uiCollapsiblePublish.refreshHeight();
        }
      },
      saveTitle() {
        const store = this.$store,
          val = this.title.trim();

        return store.dispatch('updatePageList', { title: val }).then(() => {
          store.dispatch('showSnackbar', 'Updated page title');
        });
      },
      updateTime(val) {
        this.timeValue = val;
      },
      archivePage(archived) {
        this.$store.dispatch('startProgress');
        return this.$store.dispatch('updatePageList', { archived, shouldPatchArchive: true })
          .then(() => {
            this.$store.dispatch('finishProgress');
            this.$store.dispatch('showSnackbar', {
              message: `${archived ? 'Archived' : 'Unarchived'} page`,
              action: 'Undo',
              onActionClick: () => this.archivePage(!archived)
            });
            return this.$store.dispatch('closeModal');
          })
          .catch((e) => {
            log.error(`Error ${archived ? 'archiving' : 'unarchiving'} page: ${e.message}`, { action: 'archivePage', archived });
            store.dispatch('finishProgress');
            store.dispatch('showSnackbar', 'Error archiving page');
          });
      },
      restorePageClick() {
        this.$store.dispatch('openModal', {
          title: 'Restore Published Version',
          type: 'type-restore-published-version-modal',
          data: {
            name: 'restorePublishedVersion',
            username: this.$store.state.user.username,
            onConfirm: () => {
              this.restorePage();
            }
          }
        });
      },
      restorePage() {
        this.$store.dispatch('currentlyRestoring', true);
        api.getObject(`${this.$store.state.page.uri}@published.json`).then((publishedPage) => {
          this.restoreHeadComponents(publishedPage.head).then(() => {
            this.saveComponents(publishedPage.main, 'main', true).then((components) => {
              this.loopThroughComponents(components);
            });
          });
        })
          .catch(() => {
            this.$store.dispatch('currentlyRestoring', false);
          });
      },
      finishedRestoring() {
        this.$store.dispatch('showSnackbar', {
          message: 'Page Restored to Published Version'
        });
        this.$store.dispatch('currentlyRestoring', false);
      },
      restoreHeadComponents(publishedHeadComponents) {
        return new Promise((resolve) => {
          // delete current headComponents in one go, which takes care of removing any components that have been added since last publish & any reordering that may have been done
          this.$store.dispatch('savePage', { head: [] }).then(() => {
            this.saveComponents(publishedHeadComponents, 'head').then(() => {
              resolve();
            });
          });
        });
      },
      saveComponents(components, path, forceRender = false) {
        // Save Components and Rerender in the page
        return new Promise((resolve) => {
          const arrComponents = [];

          components.forEach((component) => {
            const data = JSON.parse(JSON.stringify(component).replace(new RegExp('@published','g'),''));

            arrComponents.push(data);
          });

          let dataObj = {
            newComponents: arrComponents,
            path: path,
            replace: true,
            index: 0,
            data: [],
            forceRender
          };

          this.$store.dispatch('addCreatedComponentsToPageArea', dataObj).then(() => {
            resolve(arrComponents);
          });
        });
      },
      saveComponent(component) {
        // Update the changed components in the Vue Store
        // without this, vue won't be in sync with the rendered content
        // and will revert to the unrestored content when editing
        let newData = component,
          uri = component['_ref'];

        delete newData['_ref'];

        newData = { ...this.$store.state.components[uri], ...newData };

        if (newData && this.$store.state.components[uri] && JSON.stringify(newData) !== JSON.stringify(this.$store.state.components[uri])) {
          this.$store.dispatch('saveComponent', { uri, data: newData });
        }

        if (restoreTimer) {
          clearTimeout(restoreTimer);
        }
        restoreTimer = setTimeout(() => {
          this.finishedRestoring();
        }, 2000);
      },
      loopThroughComponents(components) {
        components.forEach((component) => {
          if (_.isObject(component)) {
            if (component['_ref']) {
              this.saveComponent(component);
            }

            for (let key in component) {
              if (_.isObject(component[key]) && component[key]['_ref']) {
                this.saveComponent(component[key]);
              } else if (_.isArray(component[key])) {
                this.loopThroughComponents(component[key]);
              }
            }
          }
        });
      }
    },
    mounted() {
      const prefix = _.get(this.$store, 'state.site.prefix'),
        customUrl = _.get(this.$store, 'state.page.data.url') || '';

      // get location when form opens
      // remove prefix when displaying the url in the form. it'll be added when saving
      this.location = customUrl.replace(uriToUrl(prefix), '');
      if (this.location) {
        // if there's a custom location on mount, show the custom location section
        this.hasCustomLocation = true;
      }

      if (this.currentTitle) {
        this.title = this.currentTitle;
      }
    },
    components: {
      UiIcon,
      UiButton,
      UiDatepicker,
      UiTextbox,
      UiCollapsible,
      UiIconButton,
      timepicker
    }
  };
</script>

<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .publish-drawer {
    padding: 16px 0;

    .section-heading {
       @include type-subheading();
    }

    .section-text {
      @include type-caption();
      margin-top: 8px;
    }

    .action-button {
      margin-top: 16px;
    }
  }

  .publish-status {
    border-bottom: 1px solid $divider-color;
    display: flex;
    flex-direction: column;
    padding: 0 16px 16px;

    .status-message {
      @include type-subheading();
    }

    .status-time {
      @include type-caption();

      margin-top: 8px;
    }

    .status-link {
      @include type-caption();

      align-items: center;
      color: $brand-primary-color;
      display: flex;
      justify-content: flex-start;
      margin-top: 8px;

      .status-link-text {
        margin-left: 4px;
        text-decoration: underline;
      }
    }

    .status-undo-button {
      margin-top: 16px;
    }
  }

  .publish-actions {
    border-bottom: 1px solid $divider-color;
    display: flex;
    flex-direction: column;
    padding: 16px;

    .action-message {
      @include type-subheading();

      align-items: center;
      display: flex;
      height: 32px;
      justify-content: space-between;
      margin-top: -6px;
    }

    .schedule-form {
      align-items: flex-start;
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      width: 100%;

      .schedule-date,
      .schedule-time {
        margin: 0;
        width: 48%;
      }
    }

    .action-error-message,
    .action-warning-message,
    .action-info-message {
      @include type-caption();

      cursor: pointer;
      margin-top: 16px;
    }

    .action-info-message {
      text-align: center;
    }

    .action-error-message {
      color: $md-red;
    }

    .action-warning-message {
      color: $md-orange;
    }
  }

  .publish-section {
    border-bottom: 1px solid $divider-color;
    margin-bottom: 0;
    padding: 0;

    .ui-collapsible__header {
      background-color: $pure-white;
    }

    .ui-collapsible__body {
      border: none;
    }
  }

  .publish-location {
    .publish-location-form {
      display: flex;
      flex-direction: column;
    }

    .location-description {
      @include type-body();
    }

    .location-input {
      margin-top: 8px;
    }

    .location-submit {
      margin-top: 16px;
    }
  }

  .publish-title {
    .publish-title-form {
      display: flex;
      flex-direction: column;
    }

    .title-description {
      @include type-body();
    }

    .title-input {
      margin-top: 8px;
    }

    .title-submit {
      margin-top: 16px;
    }
  }

  .publish-archive {
    .ui-collapsible__body {
      display: flex;
      flex-direction: column;
    }

    .archive-help {
      @include type-body();
    }

    .archive-submit {
      margin-top: 16px;
    }
  }
</style>
