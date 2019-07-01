<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .preview {
    display: flex;
    flex-direction: column;
    height: 100%;

    .preview-link {
      align-items: center;
      background-color: $list-bg;
      color: $text-alt-color;
      display: flex;
      height: 48px;
      padding: 0 16px;
      position: relative;
      text-decoration: none;
      transition: 200ms background-color ease-out;
      width: 100%;

      &:hover {
        background-color: $list-bg-hover;
        cursor: pointer;
      }

      .preview-link-size {
        flex: 0 0 auto;
        margin-right: 16px;
      }

      .preview-link-text {
        @include type-subheading();

        flex: 1 0 auto;
      }

      .preview-link-icon {
        flex: 0 0 auto;
        margin-left: 16px;
      }
    }

    .preview-share {
      border-top: 1px solid $divider-color;
      flex: 0 0 auto;
      padding: 16px;
    }
  }
</style>

<template>
  <div class="preview">
    <a class="preview-link" :href="url" @click.prevent="open('small')">
      <ui-icon icon="smartphone" class="preview-link-size small"></ui-icon>
      <span class="preview-link-text">Small</span>
      <ui-icon icon="open_in_new" class="preview-link-icon"></ui-icon>
    </a>
    <a class="preview-link" :href="url" @click.prevent="open('medium')">
      <ui-icon icon="tablet" class="preview-link-size medium"></ui-icon>
      <span class="preview-link-text">Medium</span>
      <ui-icon icon="open_in_new" class="preview-link-icon"></ui-icon>
    </a>
    <a class="preview-link" :href="url" @click.prevent="open('large')">
      <ui-icon icon="laptop" class="preview-link-size large"></ui-icon>
      <span class="preview-link-text">Large</span>
      <ui-icon icon="open_in_new" class="preview-link-icon"></ui-icon>
    </a>
    <div class="preview-share">
      <ui-textbox ref="input" :value="url" :readonly="true" iconPosition="right" label="Copy To Clipboard" :floatingLabel="true" :invalid="isInvalid" :help="help" :error="error">
        <ui-icon-button type="secondary" color="default" slot="icon" :icon="copyIcon" @click="copyURL"></ui-icon-button>
      </ui-textbox>
    </div>
  </div>
</template>

<script>
  import { find } from '@nymag/dom';
  import { uriToUrl } from '../utils/urls';
  import { mapState } from 'vuex';
  import UiIcon from 'keen/UiIcon';
  import UiIconButton from 'keen/UiIconButton';
  import UiTextbox from 'keen/UiTextbox';
  import logger from '../utils/log';

  const log = logger(__filename),
    previewSizes = {
      small: { w: 375, h: 660 },
      medium: { w: 768, h: 1024 },
      large: { w: 1180, h: 768 }
    };

  export default {
    data() {
      return {
        isInvalid: false,
        help: '',
        error: ''
      };
    },
    computed: mapState({
      url: state => uriToUrl(state.page.uri) + '.html',
      copyIcon() {
        return this.isInvalid ? 'error_outline' : 'content_copy';
      }
    }),
    methods: {
      open(size) {
        this.$store.commit('OPEN_PREVIEW_LINK', `${this.url} (${size})`);
        window.open(this.url, `Preview${size}`, `resizable=yes,scrollbars=yes,width=${previewSizes[size].w},height=${previewSizes[size].h}`);
      },
      copyURL() {
        try {
          const input = this.$refs.input.$el,
            link = find(input, 'input');

          let success;

          link.select();
          success = document.execCommand('copy');

          if (success) {
            this.isInvalid = false;
            this.error = '';
            this.help = 'Copied to clipboard!';
            this.$store.commit('COPY_PREVIEW_LINK', this.url);
          } else {
            this.isInvalid = true;
            this.help = '';
            this.error = 'Cannot copy link!';
          }
        } catch (e) {
          // some browsers can't do this.
          this.isInvalid = true;
          this.help = '';
          this.error = 'Cannot copy link!';
          log.error(`Error copying preview link: ${e.message}`, { action: 'copyURL' });
        }
      }
    },
    components: {
      UiIconButton,
      UiIcon,
      UiTextbox
    }
  };
</script>
