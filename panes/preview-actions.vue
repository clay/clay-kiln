<template>
  <ul class="preview-actions actions">
    <li class="preview-item">
      <a class="preview-link small" :href="url" @click.prevent="open('small')">
        <icon name="preview-small" class="preview-link-size"></icon>
        <span class="preview-link-text">Small</span>
        <icon name="new-tab" class="preview-link-icon"></icon>
      </a>
    </li>
    <li class="preview-item">
      <a class="preview-link medium" :href="url" @click.prevent="open('medium')">
        <icon name="preview-medium" class="preview-link-size"></icon>
        <span class="preview-link-text">Medium</span>
        <icon name="new-tab" class="preview-link-icon"></icon>
      </a>
    </li>
    <li class="preview-item">
      <a class="preview-link large" :href="url" @click.prevent="open('large')">
        <icon name="preview-large" class="preview-link-size"></icon>
        <span class="preview-link-text">Large</span>
        <icon name="new-tab" class="preview-link-icon"></icon>
      </a>
    </li>
  </ul>
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
      }
    }
  }
</script>
