<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/layers';

  $box-shadow: 0 0 10px 0;

  // progress bars
  .nprogress-container {
    left: 0;
    overflow: visible;
    pointer-events: none;
    position: absolute;
    top: 0;
    width: 100%;

    &.nprogress-custom-parent {
      // override nprogress styling
      overflow: visible;
      position: absolute;
    }

    #nprogress .bar {
      @include toolbar-layer();

      background-color: $brand-accent-color;
      box-shadow: $box-shadow $brand-accent-color;
      height: 3px;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
    }
  }
</style>

<template>
  <nprogress-container></nprogress-container>
</template>

<script>
  import { mapState } from 'vuex';
  import { requestTimeout, clearRequestTimeout } from '../utils/events';
  import NprogressContainer from 'vue-nprogress/src/NprogressContainer.vue';

  const PAUSE_TIMEOUT = 500, // number of milliseconds to pause when new things are added to the progress
    MAX_LOG = 0.999;

  /**
   * logarithmic trickle function
   * we're using this because the default trickle function
   * cannot be paused, and uses random (rather than decreasing) increments
   * @param {number} step
   */
  function trickle(step) {
    const np = this.$nprogress;

    let log;

    // if the progress bar has ended (or is paused), stop animating
    if (!np.isStarted() || this.paused) {
      this.pausedStep = step;
  
      return;
    }

    // increase the step amount each time
    step++;
    // then get the log value
    log = Math.log(step) / Math.log(700);

    // never hit 100%
    if (log >= MAX_LOG) {
      log = MAX_LOG;
    }

    np.set(log);
    this.trickle = requestAnimationFrame(trickle.bind(this, step));
  }

  /**
   * start progress if it's not running,
   * otherwise pause the incrementing for a bit
   */
  function startProgress() {
    const np = this.$nprogress,
      self = this;

    if (np.isStarted()) {
      this.paused = true;
      // if it's already started, just pause it for a second
      this.timer = requestTimeout(() => {
        self.paused = false;
        self.trickle = requestAnimationFrame(trickle.bind(self, self.pausedStep));
      }, PAUSE_TIMEOUT);
    } else {
      np.start();
      // start logarithmic trickle animation
      this.trickle = requestAnimationFrame(trickle.bind(this, 1));
    }
  }

  function finishProgress() {
    const np = this.$nprogress;

    if (np.isStarted()) {
      clearRequestTimeout(this.timer); // stop the pause (if it was started)
      np.done(); // finish the progress bar
    }
  }

  export default {
    computed: mapState({
      currentProgress: state => state.ui.currentProgress
    }),
    watch: {
      currentProgress(val) {
        if (val > 0) {
          startProgress.call(this);
        } else {
          finishProgress.call(this);
        }
      }
    },
    components: {
      NprogressContainer
    }
  };
</script>
