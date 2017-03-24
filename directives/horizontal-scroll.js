import Vue from 'vue';

export default function horizontalScroll() {
  return {
    componentUpdated: (el, { value }) => {
      // Wait until the next tick to repaint
      Vue.nextTick(() => {
        el.scrollLeft = value;
      });
    }
  };
};
