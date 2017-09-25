<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/inputs';
  @import '../styleguide/buttons';

  .preview {
    padding: 17px;

    .preview-actions-list {
      margin: 0;
      padding: 0;
      list-style: none;

      &-item {
        border-bottom: 1px solid $pane-list-divider;
      }

      .preview-link {
        @include primary-text();

        align-items: center;
        cursor: pointer;
        display: flex;
        flex-grow: 1;
        justify-content: space-between;
        line-height: 1.4;
        padding: 15px 0;
        text-align: left;

        &-size {
          height: 23px;
          margin-right: 10px;

          svg {
            fill: $text;
            height: 23px;
            width: 30px;

            path {
              fill: $text;
            }
          }
        }

        &-text {
          flex-grow: 1;
        }

        &-icon {
          svg {
            fill: $text;

            path {
              fill: $text;
            }
          }
        }
      }
    }

    .preview-share {
      padding: 15px 0 30px; // extra space at the bottom for copy success/error message

      .input-group-input {
        display: flex;
        margin-top: 5px;
      }

      .share-input {
        @include input();

        flex: 1 1 auto;
        margin: 0;
      }

      .share-copy {
        @include button-outlined($input-border, $input-background);

        border-left: none;
        border-bottom-left-radius: 0;
        border-top-left-radius: 0;
        flex: 0 0 auto;
        height: 48px;
        margin: 0;
        position: relative;

        &:before,
        &:after {
          @include secondary-text();

          opacity: 0;
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          transition: opacity 300ms ease-out;
          white-space: nowrap;
        }

        // :before is the success message, :after is the error
        // this allows us to fade them in (setting the content with the class messes up the animation)
        &:before {
          color: $save;
          content: 'Copied to clipboard!';
        }

        &:after {
          color: $error;
          content: 'Cannot copy link';
        }

        &.success:before {
          opacity: 1;
        }

        &.error:after {
          opacity: 1;
        }
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
            <ui-icon icon="smartphone" class="preview-link-size small"></ui-icon>
            <span class="preview-link-text">Small</span>
            <ui-icon icon="open_in_new" class="preview-link-icon"></ui-icon>
          </a>
        </li>
        <li class="preview-actions-list-item">
          <a class="preview-link" :href="url" @click.prevent="open('medium')">
            <ui-icon icon="tablet" class="preview-link-size medium"></ui-icon>
            <span class="preview-link-text">Medium</span>
            <ui-icon icon="open_in_new" class="preview-link-icon"></ui-icon>
          </a>
        </li>
        <li class="preview-actions-list-item">
          <a class="preview-link" :href="url" @click.prevent="open('large')">
            <ui-icon icon="laptop" class="preview-link-size large"></ui-icon>
            <span class="preview-link-text">Large</span>
            <ui-icon icon="open_in_new" class="preview-link-icon"></ui-icon>
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
  import UiIcon from 'keen/UiIcon'

  const previewSizes = {
    small: { w: 375, h: 660 },
    medium: { w: 768, h: 1024 },
    large: { w: 1024, h: 768 }
  };

  export default {
    components: {
      icon,
      UiIcon
    },
    computed: mapState({
      url: (state) => uriToUrl(state.page.uri) + '.html'
    }),
    methods: {
      open(size) {
        this.$store.commit('OPEN_PREVIEW_LINK', `${this.url} (${size})`);
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
            this.$store.commit('COPY_PREVIEW_LINK', this.url);
          } else {
            button.classList.remove('success');
            button.classList.add('error');
          }
        } catch (e) {
          // some browsers can't do this.
          button.classList.remove('success');
          button.classList.add('error');
          console.error(`Error copying preview link: ${e.message}`);
        }
      }
    }
  };
</script>
