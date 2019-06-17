<template>
  <div>
    <div v-for="(error, index) in errors" :class="`publish-${errorLevel}`" :key="`publish-${errorKey}-item-${index}`">
      <span :class="`${errorLevel}-label`">{{ error.label }}</span>
      <span :class="`${errorLevel}-description`">{{ error.description }}</span>
      <span class="validation-info">Go To Components</span>
      <ul class="validation-items">
        <li v-for="(item, idx) in error.items" class="validation-item" :key="`publish-${errorKey}-validation-item-${idx}`">
          <span v-if="openItem" class="validation-item-location" :class="{ 'validation-item-link': item.uri && item.field }" @click.stop="openLocation(item.uri, item.field, item.path, item.location)">{{ item.location }}</span>
          <span v-if="item.preview" class="validation-item-preview">{{ item.preview }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { getFieldEl, getComponentEl } from '../utils/component-elements';

export default {
  methods: {
    openLocation(uri, field, path, location) {
      const el = getFieldEl(uri, path),
        componentEl = el && getComponentEl(el);

      this.$store.commit('OPEN_VALIDATION_LINK', location);
      if (componentEl) {
        // component exists and is in the body (not a head component)
        this.$store.dispatch('select', componentEl);
      }
      this.$store.dispatch('focus', { uri, path, initialFocus: field, el });
    }
  },
  props:{
    errors: {},
    errorLevel: {},
    errorKey: {},
    openItem: {
      default: true
    }
  }
};
</script>
