<style lang="sass">
  @import '../../styleguide/typography';

  .info-text {
    @include primary-text();

    line-height: 20px;
    margin: 0;

    ul {
      margin: 0;
      padding-left: 17px;
    }

    a {
      @include link();
    }

    kbd {
      @include keyboard-keys();
    }

    code {
      @include code();
    }
  }
</style>

<template>
  <div class="info-text" v-html="text"></div>
</template>

<script>
  import snarkdown from 'snarkdown';

  export default {
    props: ['data'],
    data() {
      return {};
    },
    computed: {
      text() {
        const md = this.data;

        // parse markdown / html for html, then do a simple find/replace
        // to make sure all links open in a new tab
        return md ? snarkdown(md)
          .replace(/<a\s/gi, '<a target="_blank" ')
          .replace(/<br\s? \/>/ig, '<br /><br />')
          .replace(/~{1,2}(.*?)~{1,2}/ig, '<strike>$1</strike>') : '';
      }
    }
  };
</script>
