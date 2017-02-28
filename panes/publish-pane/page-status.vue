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
      <div class="page-status-msg-main" :class="stateClass">{{ message }}</div>
      <div class="page-status-msg-info">{{ time }}</div>
    </div>
    <div class="page-status-action">
      <button type="button" class="page-status-action-btn" v-if="isPublished && !isScheduled" @click="unpublishPage">
        Unpublish
      </button>
      <button type="button" class="page-status-action-btn" v-if="isScheduled" @click="unschedulePage">
        Unscheduled
      </button>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';

  export default {
    props: [],
    data() {
      return {}
    },
    computed: {
      isPublished() {
        return true;
      },
      isScheduled() {
        return false;
      },
      isDraft() {
        return false;
      },
      stateClass() {
        return {
          published: this.isPublished,
          scheduled: this.isScheduled,
          draft: this.isDraft
        }
      },
      message() {
        var msg = '',
          time = `WHEN`

        if (this.isPublished) {
          msg = `Published`;
        } else if (this.isScheduled) {
          msg = `Scheduled`;
        } else {
          msg = `Draft`;
        }

        return `${msg} ${time}`;
      },
      time() {
        return `MONTH DAY at TIME`
      }
    },
    methods: {
      unschedulePage() {
        console.log('Unschedule');
      },
      unpublishPage() {
        console.log('Unpublish');
      }
    },
    components: {}
  };
</script>
