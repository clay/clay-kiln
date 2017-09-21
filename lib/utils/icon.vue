<template>
  <ui-icon v-html="icon"></ui-icon>
</template>

<script>
  import icons from './icons';
  import UiIcon from 'keen-ui/src/UiIcon.vue';

  // NOTE: this is only for using custom SVG icons. For material design icons, please use ui-icon directly
  export default {
    props: ['name'],
    data() {
      return {};
    },
    computed: {
      icon() {
        return icons[this.name];
      }
    },
    components: {
      UiIcon
    }
  };
</script>
