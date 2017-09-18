<style lang="sass">
  @import '../styleguide/typography';

  .info-pane {
    height: 100%;
    max-height: calc(100% - 51px);
    overflow-y: scroll;
    padding: 17px;

    &-text {
      @include primary-text();

      margin: 0;
    }
  }
</style>

<template>
  <div class="info-pane">
    <p class="info-pane-text" v-html="text"></p>
  </div>
</template>

<script>
  import snarkdown from 'snarkdown';

  export default {
    props: ['args'],
    data() {
      return {};
    },
    computed: {
      text() {
        const md = this.args.text;

        // parse markdown / html for html, then do a simple find/replace
        // to make sure all links open in a new tab
        return md ? snarkdown(md).replace(/<a\s/gi, '<a target="_blank" ') : '';
      }
    }
  };
</script>
