<template>
  <span class="kiln-custom-icon" v-html="icon"></span>
</template>

<script>
  import icons from './icons';

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
    }
  };
</script>
