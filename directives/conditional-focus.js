import Vue from 'vue';

export default Vue.directive('conditional-focus', {
  componentUpdated: (el, { value }) => {
    if (value) {
      el.focus();
    }
  }
});
