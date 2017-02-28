<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/inputs';

  .preview {
    padding: 17px;

    .preview-actions-list {
      margin: 0;
      padding: 0;
      list-style: none;

      &-item {
        border-bottom: 1px solid $grey;
      }

      // TODO: Colors & basically re-structure
      .preview-link {
        align-items: center;
        justify-content: space-between;
        color: #727272;
        cursor: pointer;
        display: flex;
        padding: 10px 0;
        text-decoration: none;

        &-size {
          margin-right: 10px;

          & svg {
            width: 30px;
            height: 23px;
          }
        }

        &-text {
          flex-grow: 1;
        }

        svg path {
          fill: #4A4A4A;
        }
      }
    }

    // TODO: We need to figure out input +
    // buttons in the styleguide.
    .input-group {
      input {
        @include input();

        margin: 0;
      }

      button {
        appearance: none;
        background: none;
        border: 1px solid $black-25;
        border-left: 0;
        height: 41px;
      }

      & span {
        align-items: center;
        display: flex;
      }
    }
  }
</style>

<template>
  <div class="preview">
    <div class="preview-actions">
      <ul class="preview-actions-list">
        <li class="preview-actions-list-item">
          <a class="preview-link" :href="url" @click.prevent="open('small')">
            <icon name="preview-small" class="preview-link-size small"></icon>
            <span class="preview-link-text">Small</span>
            <icon name="new-tab" class="preview-link-icon"></icon>
          </a>
        </li>
        <li class="preview-actions-list-item">
          <a class="preview-link" :href="url" @click.prevent="open('medium')">
            <icon name="preview-medium" class="preview-link-size medium"></icon>
            <span class="preview-link-text">Medium</span>
            <icon name="new-tab" class="preview-link-icon"></icon>
          </a>
        </li>
        <li class="preview-actions-list-item">
          <a class="preview-link" :href="url" @click.prevent="open('large')">
            <icon name="preview-large" class="preview-link-size large"></icon>
            <span class="preview-link-text">Large</span>
            <icon name="new-tab" class="preview-link-icon"></icon>
          </a>
        </li>
      </ul>
    </div>

    <div class="preview-share">
      <label class="input-group">
        Shareable link
        <span class="input-group-input">
          <input class="share-input" v-model="url"></input>
          <button class="share-copy" @click="copyURL"><icon name="copy"></icon></button>
        </span>
      </label>

    </div>
  </div>
</template>

<script>
  import { uriToUrl } from '../lib/utils/urls';
  import icon from '../lib/utils/icon.vue';
  import { mapState } from 'vuex';

  const previewSizes = {
    small: { w: 375, h: 660 },
    medium: { w: 768, h: 1024 },
    large: { w: 1024, h: 768 }
  };

  export default {
    components: {
      icon
    },
    computed: mapState({
      url: (state) => uriToUrl(state.page.uri) + '.html'
    }),
    methods: {
      open(size) {
        window.open(this.url, `Preview${size}`, `resizable=yes,scrollbars=yes,width=${previewSizes[size].w},height=${previewSizes[size].h}`);
      },
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
