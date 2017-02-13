<template>
  <div class="info-message">Share the link below to preview the latest version of this page.</div>
  <div class="share-actions actions">
    <input class="share-input">{{ url }}</input>
    <button class="share-copy" @click="copyURL"><icon name="copy"></icon></button>
  </div>
</template>

<script>
  import icon from './icon.vue';
  import { mapState } from 'vuex';
  import { uriToUrl } from '../utils/urls';

  export default {
    components: {
      icon
    },
    computed: mapState({
      url: (state) => uriToUrl(state.page.uri) + '.html'
    }),
    methods: {
      copyURL() {
        const link = this.$el.querySelector('.share-input'),
          button = this.$el.querySelector('.share-copy');

        let success;

        try {
          link.select();
          success = document.execCommand('copy');

          if (success) {
            button.classList.remove('error');
            button.classList.add('success');
          } else {
            button.classList.remove('success');
            button.classList.add('error');
          }
        } catch (e) {
          // some browsers can't do this.
          button.classList.remove('success');
          button.classList.add('error');
          console.error(e.message, e.stack);
        }
      }
    }
  }
</script>
