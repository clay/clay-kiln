<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/buttons';

  .view-status {
    align-items: center;
    display: flex;
    justify-content: space-between;

    &-msg {
      &-main {
        font-size: 18px;

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

      &-info {
        font-size: 14px;
        margin-top: 5px;
      }
    }
  }

</style>

<template>
  <div class="view-status">
    <div class="view-status-msg">
      <div class="view-status-msg-main" :class="stateClass">{{ message }}</div>
      <div class="view-status-msg-info">{{ time }}</div>
    </div>
  </div>
</template>


<script>
  import dateFormat from 'date-fns/format';
  import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
  import { mapState } from 'vuex';

  export default {
    data() {
      return {};
    },
    computed: mapState({
      isPublished: (state) => state.page.state.published,
      isScheduled: (state) => state.page.state.scheduled,
      publishedDate: (state) => state.page.state.publishedAt,
      scheduledDate: (state) => state.page.state.scheduledAt,
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
    })
  };
</script>
