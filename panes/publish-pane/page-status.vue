<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/buttons';

  .page-status {
    align-items: center;
    display: flex;
    justify-content: space-between;

    &-msg {
      &-main {
        font-size: 18px;
        text-decoration: none;

        &.draft {
          color: $draft;
        }

        &.published {
          color: $published;
        }

        &.scheduled {
          color: $scheduled;
        }
      }

      .public-link-icon {
        display: inline-block;
        margin-left: 4px;

        svg {
          fill: $published;
          vertical-align: middle;
        }
      }

      &-info {
        font-size: 14px;
        margin-top: 5px;
      }
    }


    &-action {
      &-btn {
        @include button-outlined($error);

        margin: 0;
      }
    }
  }

</style>

<template>
  <div class="page-status">
    <div class="page-status-msg">
      <a v-if="isPublished && !isScheduled" class="page-status-msg-main" :class="stateClass" :href="url" target="_blank">{{ message }}<ui-icon icon="open_in_new" class="public-link-icon"></ui-icon></a>
      <div v-else class="page-status-msg-main" :class="stateClass">{{ message }}</div>
      <div class="page-status-msg-info">{{ time }}</div>
    </div>
    <div class="page-status-action">
      <button type="button" class="page-status-action-btn" v-if="isPublished && !isScheduled" @click="unpublishPage">
        Unpublish
      </button>
      <button type="button" class="page-status-action-btn" v-if="isScheduled" @click="unschedulePage">
        Unschedule
      </button>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';
  import dateFormat from 'date-fns/format';
  import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
  import { mapState } from 'vuex';
  import { uriToUrl } from '../../lib/utils/urls';
  import { htmlExt, editExt } from '../../lib/utils/references';
  import { START_PROGRESS, FINISH_PROGRESS } from '../../lib/toolbar/mutationTypes';
  import UiIcon from 'keen-ui/src/UiIcon.vue';

  export default {
    data() {
      return {};
    },
    computed: mapState({
      isPublished: (state) => state.page.state.published,
      isScheduled: (state) => state.page.state.scheduled,
      publishedDate: (state) => state.page.state.publishTime,
      url: (state) => state.page.state.url,
      scheduledDate: (state) => state.page.state.scheduledTime,
      isDraft() {
        return !this.isPublished && !this.isScheduled;
      },
      stateClass() {
        return {
          published: this.isPublished,
          scheduled: this.isScheduled,
          draft: this.isDraft
        };
      },
      message() {
        if (this.isScheduled) {
          return `Scheduled ${distanceInWordsToNow(this.scheduledDate, { includeSeconds: true, addSuffix: true })}`;
        } if (this.isPublished) {
          return `Published ${distanceInWordsToNow(this.publishedDate, { includeSeconds: true, addSuffix: true })}`;
        } else {
          return 'Draft Created';
        }
      },
      time() {
        if (this.isScheduled) {
          return dateFormat(this.scheduledDate, 'MMMM Do [at] h:mm A');
        } if (this.isPublished) {
          return dateFormat(this.publishedDate, 'MMMM Do [at] h:mm A');
        }
      }
    }),
    methods: {
      unschedulePage() {
        const store = this.$store;

        store.commit(START_PROGRESS, 'schedule');
        this.$store.dispatch('closePane');
        this.$store.dispatch('unschedulePage', this.$store.state.page.uri)
          .catch((e) => {
            store.commit(FINISH_PROGRESS, 'error');
            console.error(`Error unscheduling page: ${e.message}`);
            store.dispatch('showStatus', { type: 'error', message: 'Error unscheduling page!'});
            throw e;
          })
          .then(() => {
            store.commit(FINISH_PROGRESS, 'schedule');
            store.dispatch('showStatus', { type: 'schedule', message: 'Unscheduled Page!' });
          });
      },
      unpublishPage() {
        const store = this.$store,
          uri = this.$store.state.page.uri;

        store.commit(START_PROGRESS, 'draft');
        this.$store.dispatch('closePane');
        this.$store.dispatch('unpublishPage', uri)
          .catch((e) => {
            store.commit(FINISH_PROGRESS, 'error');
            console.error(`Error unpublishing page: ${e.message}`);
            store.dispatch('showStatus', { type: 'error', message: 'Error unpublishing page!'});
            throw e;
          })
          .then(() => {
            if (_.includes(window.location.href, uriToUrl(uri))) {
              // if we're already looking at /pages/whatever, display the status message
              store.commit(FINISH_PROGRESS, 'draft');
              store.dispatch('showStatus', { type: 'draft', message: 'Unpublished Page!' });
            } else {
              // if we're looking at the published page, navigate to the latest version
              window.location.href = `${uriToUrl(uri)}${htmlExt}${editExt}`;
            }
          });
      }
    },
    components: {
      UiIcon
    }
  };
</script>
