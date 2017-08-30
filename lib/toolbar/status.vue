<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .kiln-status {
    @include primary-text();

    align-items: center;
    bottom: 100%;
    color: $toolbar-icons;
    display: flex;
    height: 70px; // 50px viewable, plus some extra for the easing
    justify-content: space-between;
    left: 0;
    padding: 15px 15px 35px;
    position: absolute;
    text-align: center;
    transform: translateY(20px);
    width: 100%;
  }

  // transition
  .slide-status-enter-active {
    transition: transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .slide-status-leave-active {
    transition: transform 150ms cubic-bezier(0.6, -0.28, 0.735, 0.045);
  }

  .slide-status-enter, .slide-status-leave-to {
    transform: translateY(70px);
  }

  // colors
  .kiln-status.schedule {
    background-color: $scheduled;
  }

  .kiln-status.publish {
    background-color: $published;
  }

  .kiln-status.offline {
    background-color: $offline;
  }

  .kiln-status.error {
    background-color: $error;
  }

  .kiln-status.warning {
    background-color: $warning;
  }

  .kiln-status.save {
    background-color: $save;
  }

    .kiln-status.draft {
      background-color: $draft;
    }

  .kiln-status a {
    @include primary-text();

    color: $toolbar-icons;
    text-decoration: underline;
  }
</style>

<template>
  <transition name="slide-status">
    <div class="kiln-status" v-if="hasCurrentStatus" :class="type" @click.stop>
      <div class="kiln-status-message" v-if="message" v-html="message"></div>
      <div class="kiln-status-action" v-if="action" v-html="action"></div>
      <div class="kiln-status-action" v-if="isPermanent && dismissable"><a @click.stop.prevent="dismissStatus">Dismiss</a></div>
    </div>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import { HIDE_STATUS } from './mutationTypes';

  const timeout = 3500; // should be the same timeout for every status message;

  export default {
    data() {
      return {};
    },
    computed: mapState({
      hasCurrentStatus: (state) => !_.isNull(_.get(state, 'ui.currentStatus')),
      message: (state) => _.get(state, 'ui.currentStatus.message'),
      action: (state) => _.get(state, 'ui.currentStatus.action'),
      isPermanent: (state) => _.get(state, 'ui.currentStatus.isPermanent'),
      dismissable: (state) => _.get(state, 'ui.currentStatus.dismissable'),
      type: (state) => _.get(state, 'ui.currentStatus.type')
    }),
    watch: {
      // set up the timeout every time a new status message exists
      hasCurrentStatus(val) {
        const store = this.$store;

        if (this.timer) {
          // every time the status message closes (or a new one is created), clear the timeout
          // this prevents the NEXT status message from closing
          // if it's created less than <timeout> milliseconds from the previous one
          // note: the timer is added to the data, so it persists outside the scope of this function
          clearTimeout(this.timer);
        }

        // after the timer is cleared (if it exists), determine if we should create
        // a new timer for the current status message
        if (val && !this.isPermanent) {
          this.timer = setTimeout(() => {
            // most status messages are NOT permanent
            store.commit(HIDE_STATUS);
          }, timeout);
        }
      }
    },
    methods: {
      dismissStatus() {
        return this.$store.commit('HIDE_STATUS');
      }
    }
  };
</script>
