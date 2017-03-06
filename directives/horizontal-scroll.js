import Vue from 'vue';

export default Vue.directive('h-scroll', {
  componentUpdated: (el, { value }) => {
    // Wait until the next tick to repaint
    Vue.nextTick(() => {
      el.scrollLeft = value;
    });
  }
});
