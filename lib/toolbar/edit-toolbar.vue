<template>
  <div class="kiln-wrapper">
    <background></background>
    <overlay></overlay>
    <div class="kiln-toolbar-wrapper">
      <pane></pane>
      <status></status>
      <nprogress-container :class="progressColor"></nprogress-container>
      <section class="kiln-toolbar edit-mode">
        <toolbar-button class="clay-menu-button" icon-name="clay-menu" text="Clay" centered="false"></toolbar-button>
        <toolbar-button class="new" icon-name="new-page" text="New Page"></toolbar-button>
        <div class="kiln-toolbar-inner">
          <toolbar-button class="view-button" name="close" icon-name="close-edit" @click="stopEditing"></toolbar-button>
          <toolbar-button class="components" name="components" icon-name="search-page" text="Components"></toolbar-button>
          <div class="flex-span flex-span-inner"></div>
          <toolbar-button class="preview" name="preview" icon-name="new-tab" text="Preview"></toolbar-button>
        </div>
        <toolbar-button v-if="isLoading" class="publish loading" name="publish" icon-name="draft" text="Loading&hellip;"></toolbar-button>
        <toolbar-button v-else-if="pageState.scheduled" class="publish scheduled" name="publish" icon-name="scheduled" text="Scheduled"></toolbar-button>
        <toolbar-button v-else-if="pageState.published" class="publish published" name="publish" icon-name="published" text="Published"></toolbar-button>
        <toolbar-button v-else class="publish draft" name="publish" icon-name="draft" text="Draft"></toolbar-button>
      </section>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex';
  import toggleEdit from '../utils/toggle-edit';
  import NprogressContainer from 'vue-nprogress/src/NprogressContainer.vue';
  import button from './toolbar-button.vue';
  import background from './background.vue';
  import overlay from '../forms/overlay.vue';
  import pane from '../panes/pane.vue';
  import status from './status.vue';

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
      log =  MAX_LOG;
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
      this.timer = setTimeout(() => {
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
      clearTimeout(this.timer); // stop the pause (if it was started)
      np.done(); // finish the progress bar
    }
  }

  export default {
    computed: mapState({
      pageState: (state) => state.page.state,
      isLoading: 'isLoading',
      progressColor: (state) => state.ui.progressColor,
      currentProgress: (state) => state.ui.currentProgress
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
      'toolbar-button': button,
      background,
      overlay,
      pane,
      status,
      NprogressContainer
    },
    methods: {
      stopEditing() {
        toggleEdit();
      }
    }
  };
</script>
